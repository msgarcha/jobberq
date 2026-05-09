// Linq AI Assistant — tool-calling agent that creates DRAFT records only.
// Never sends, never charges, never approves. Audit-logged via ai_actions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enforceAiQuota, quotaResponse, resolveTier } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are Linq — a warm, sharp, confident AI assistant for QuickLinq (CRM for trade contractors). Think of yourself as a trusted ops manager, not a chatbot. Speak naturally, use contractions, keep it human. Many replies are spoken aloud, so write the way a real person talks — short sentences, no bullet lists, no markdown.

PERSONA:
- On the very first reply of a brand-new conversation, briefly introduce yourself by name: "Hey {first name} — Linq here. What are we tackling?" (use the owner name from context). After that, drop the intro; use their first name occasionally and naturally.
- Be encouraging and direct. Never robotic. Never apologize unless something actually broke.

You can do TWO things:
1) DRAFT new records (quote, invoice, client, job) — never send, email, charge, or approve. Drafts only.
2) ANSWER QUESTIONS about the user's existing data using the read-only lookup/list tools (client history, overdue invoices, unpaid invoices, approved quotes not yet invoiced). Never modify, never send reminders — just tell the user what you found.

Rules:
- Call tools once you have the info you need; otherwise ask ONE short follow-up question (under 15 words, voice-friendly). Never invent IDs, numbers, dates, or amounts.
- For QUESTIONS like "when did I last invoice X", "what's overdue", "any unpaid invoices", call the matching read tool and answer in 1-2 short sentences with concrete dates and amounts. Format money like $1,200.
- For "invoice the [thing] quote" requests, first call lookup_recent_documents to find the matching approved quote, then convert it (no confirmation needed — they already named it).

GUIDED CREATION FLOW for new quotes/invoices (do NOT skip steps, ask one question at a time):
  1. INTENT — If the user says "create / make / draft" without saying quote vs invoice, ask: "Quote or invoice?"
  2. CLIENT — If no client mentioned, ask: "Who is this for?" If a name matches multiple existing clients, ask which one.
  3. NEW CLIENT INFO — If the client doesn't exist yet, collect ONLY what's missing, one question at a time, in this order: last name → phone or email → address (address is optional, accept "skip"). Do NOT ask for everything at once.
  4. SERVICES & PRICES — If no services given, ask: "What services and prices?" Accept multiples in one reply ("bathroom reno 8k and faucet 200"). If a price is vague or missing for a mentioned service, ask for the number.
  5. CONFIRM — Read back a one-line summary like "Draft quote for Mark Henderson, bathroom reno $8,000 — create it?" Only call create_draft_quote / create_draft_invoice after the user says yes.
  6. One-shot shortcut: if the user gives everything in one message ("Quote Mark Henderson 10k for bathroom reno"), skip the confirm step and create the draft immediately.

Other rules:
- Use the team's default tax rate when not specified. Don't add deposits unless requested.
- BEFORE calling create_draft_quote or create_draft_invoice (when NOT converting from an existing quote), call resolve_service ONCE per line item. Use the returned service_id, description, unit_price, and tax_rate when building line_items. Never write your own line-item description.
- Keep replies under 25 words. Be friendly and direct — your reply will often be spoken aloud.
- After successfully creating a draft, briefly confirm what you created (include the quote/invoice number) and stop.`;


const TOOLS = [
  {
    type: "function",
    function: {
      name: "find_or_create_client",
      description: "Find a matching client by name, or flag candidates if ambiguous, or create new if confirmed_new=true.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name as spoken (e.g. 'Mark Henderson' or just 'Mark')" },
          email: { type: "string" },
          phone: { type: "string" },
          company: { type: "string" },
          confirmed_new: { type: "boolean", description: "True only after user confirms this is a new client" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resolve_service",
      description: "Resolve a user phrase like 'bathroom reno' into a real service from the catalog (or create a new one with a learned description and price). Call once per line item BEFORE creating a quote/invoice. Returns the service_id, description, unit_price, and tax_rate to use.",
      parameters: {
        type: "object",
        properties: {
          user_phrase: { type: "string", description: "Exactly what the user said for this item, e.g. 'bathroom reno'" },
          hint_amount: { type: "number", description: "Price the user mentioned for THIS line, if any" },
          quantity: { type: "number", description: "Quantity if mentioned, default 1" },
          doc_context: { type: "string", description: "Short context, e.g. 'quote for Mark Henderson'" },
        },
        required: ["user_phrase"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_draft_quote",
      description: "Create a DRAFT quote. Returns quote_id and quote_number. Use line items returned by resolve_service.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          title: { type: "string" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service_id: { type: "string", description: "From resolve_service. Required unless this is an ad-hoc one-off." },
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                tax_rate: { type: "number" },
              },
              required: ["description", "quantity", "unit_price"],
            },
          },
          valid_until: { type: "string", description: "ISO date YYYY-MM-DD" },
        },
        required: ["client_id", "line_items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_draft_invoice",
      description: "Create a DRAFT invoice. Optionally from an existing quote (from_quote_id). Use line items returned by resolve_service when not converting.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          title: { type: "string" },
          from_quote_id: { type: "string", description: "If converting from an approved quote" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service_id: { type: "string" },
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                tax_rate: { type: "number" },
              },
              required: ["description", "quantity", "unit_price"],
            },
          },
        },
        required: ["client_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_recent_documents",
      description: "Find recent quotes/invoices for a client, optionally filtered by keyword in title (e.g. 'window cleaning').",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          doc_type: { type: "string", enum: ["quote", "invoice"] },
          keyword: { type: "string" },
          status: { type: "string", description: "e.g. approved, sent, paid" },
        },
        required: ["client_id", "doc_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_client_history",
      description: "Get summary of a client's history: most recent quote, most recent invoice (date, total, paid status), lifetime revenue, and total open balance. Use for 'when did I last invoice X', 'how much have I made from X', 'does X owe me anything'. Provide either client_id or client_name.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" },
          client_name: { type: "string", description: "Full or partial name (first, last, or company)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_overdue_invoices",
      description: "List invoices past their due_date with balance still owing. Use for 'what's overdue', 'who hasn't paid me', 'late invoices'.",
      parameters: {
        type: "object",
        properties: {
          min_days_overdue: { type: "number", description: "Only include invoices overdue by at least this many days. Default 1." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_unpaid_invoices",
      description: "List invoices with balance_due > 0 (sent, partially paid, or overdue). Optionally filter by client name or only invoices from a date onward. Use for 'any unpaid invoices', 'unpaid for Acme'.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string" },
          since_date: { type: "string", description: "ISO date YYYY-MM-DD; only invoices issued on or after this date." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_approved_quotes_not_invoiced",
      description: "List approved quotes that have not yet been converted to an invoice. Use for 'which approved quotes still need invoicing', 'what should I bill next'.",
      parameters: { type: "object", properties: {} },
    },
  },
];

interface Ctx {
  supabase: ReturnType<typeof createClient>;
  admin: ReturnType<typeof createClient>;
  userId: string;
  teamId: string;
  defaultTaxRate: number;
}

async function handleTool(name: string, args: any, ctx: Ctx): Promise<any> {
  switch (name) {
    case "find_or_create_client":
      return await findOrCreateClient(args, ctx);
    case "resolve_service":
      return await resolveService(args, ctx);
    case "create_draft_quote":
      return await createDraftQuote(args, ctx);
    case "create_draft_invoice":
      return await createDraftInvoice(args, ctx);
    case "lookup_recent_documents":
      return await lookupRecentDocuments(args, ctx);
    case "lookup_client_history":
      return await lookupClientHistory(args, ctx);
    case "list_overdue_invoices":
      return await listOverdueInvoices(args, ctx);
    case "list_unpaid_invoices":
      return await listUnpaidInvoices(args, ctx);
    case "list_approved_quotes_not_invoiced":
      return await listApprovedQuotesNotInvoiced(args, ctx);
    default:
      return { error: `Unknown tool ${name}` };
  }
}

// ---------- resolve_service ----------
// Matches a user phrase against services_catalog (and learns from past line items),
// or creates a new service with a learned description + price.
async function resolveService(args: any, ctx: Ctx) {
  const { user_phrase, hint_amount, quantity, doc_context } = args;
  if (!user_phrase || typeof user_phrase !== "string") {
    return { error: "user_phrase required" };
  }

  // 1. Pull catalog (active services, capped)
  const { data: catalog } = await ctx.supabase
    .from("services_catalog")
    .select("id, name, description, default_price, category, tax_rate")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(80);

  // 2. Pull recent historical line items (for wording + pricing)
  const [{ data: qHist }, { data: iHist }] = await Promise.all([
    ctx.supabase
      .from("quote_line_items")
      .select("description, unit_price, tax_rate")
      .order("created_at", { ascending: false })
      .limit(40),
    ctx.supabase
      .from("invoice_line_items")
      .select("description, unit_price, tax_rate")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const history = [...(qHist || []), ...(iHist || [])]
    .filter((h) => h.description && h.description.length < 300)
    .slice(0, 60);

  const catalogText =
    (catalog || [])
      .map(
        (s: any) =>
          `[${s.id}] ${s.name} | $${s.default_price} | tax ${s.tax_rate ?? "default"} | ${s.category || "uncat"} | ${s.description?.slice(0, 120) || "(no desc)"}`
      )
      .join("\n") || "(empty catalog)";

  const historyText =
    history.length > 0
      ? history.map((h: any) => `- "${h.description}" @ $${h.unit_price}`).join("\n")
      : "(no prior line items)";

  const prompt = `User said for this line: "${user_phrase}"
Hint price (from user): ${hint_amount ?? "(none)"}
Quantity: ${quantity ?? 1}
Context: ${doc_context || "(none)"}
Default tax rate: ${ctx.defaultTaxRate}%

Existing services_catalog (id, name, default_price, tax_rate, category, description):
${catalogText}

Recent past line items from this team (for wording/pricing style):
${historyText}

Decide ONE of:
A) pick_existing — if any catalog row clearly matches the user's phrase (semantic match, not just substring). Return its service_id and the unit_price/description to use. If user gave hint_amount, use it for unit_price; else use the catalog default_price.
B) create_new — if no good match. Return name (3-6 words, Title Case), description (1-3 professional sentences modeled on the team's past wording — do NOT just echo the user's phrase), suggested_price (use hint_amount if given; otherwise infer from similar history; otherwise 0), category (one short word like 'Renovation', 'Cleaning', 'Repair'), tax_rate (default ${ctx.defaultTaxRate}).

Be conservative on matching — if uncertain, create_new.`;

  const RESOLVE_TOOL = {
    type: "function" as const,
    function: {
      name: "resolve",
      description: "Pick existing or create new service",
      parameters: {
        type: "object",
        properties: {
          decision: { type: "string", enum: ["pick_existing", "create_new"] },
          service_id: { type: "string", description: "Required if pick_existing" },
          name: { type: "string" },
          description: { type: "string" },
          unit_price: { type: "number" },
          suggested_default_price: { type: "number", description: "For create_new: the price to store as default_price" },
          tax_rate: { type: "number" },
          category: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: { type: "string" },
        },
        required: ["decision", "confidence"],
      },
    },
  };

  let parsed: any = null;
  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You match a user's spoken line-item phrase to a trade contractor's service catalog, or create a new service that fits their existing wording and pricing style. Be precise. Return one tool call.",
          },
          { role: "user", content: prompt },
        ],
        tools: [RESOLVE_TOOL],
        tool_choice: { type: "function", function: { name: "resolve" } },
      }),
    });
    if (aiResp.ok) {
      const data = await aiResp.json();
      const tc = data.choices?.[0]?.message?.tool_calls?.[0];
      if (tc) parsed = JSON.parse(tc.function.arguments || "{}");
    } else {
      console.error("resolve_service gateway error", aiResp.status, await aiResp.text());
    }
  } catch (e) {
    console.error("resolve_service ai error", e);
  }

  // Fallback if AI failed: dumb ILIKE match, else create minimal new service
  if (!parsed) {
    const phrase = user_phrase.toLowerCase();
    const match = (catalog || []).find((s: any) =>
      s.name?.toLowerCase().includes(phrase) || phrase.includes(s.name?.toLowerCase())
    );
    if (match) {
      parsed = {
        decision: "pick_existing",
        service_id: match.id,
        unit_price: hint_amount ?? Number(match.default_price),
        description: match.description || match.name,
        tax_rate: match.tax_rate ?? ctx.defaultTaxRate,
        confidence: 0.5,
      };
    } else {
      parsed = {
        decision: "create_new",
        name: user_phrase.slice(0, 80),
        description: user_phrase,
        suggested_default_price: hint_amount ?? 0,
        unit_price: hint_amount ?? 0,
        tax_rate: ctx.defaultTaxRate,
        category: null,
        confidence: 0.3,
      };
    }
  }

  // Branch: pick_existing
  if (parsed.decision === "pick_existing" && parsed.service_id) {
    const match = (catalog || []).find((s: any) => s.id === parsed.service_id);
    if (match) {
      const unit_price =
        parsed.unit_price != null
          ? Number(parsed.unit_price)
          : hint_amount != null
            ? Number(hint_amount)
            : Number(match.default_price);
      return {
        was_created: false,
        service_id: match.id,
        name: match.name,
        description: parsed.description || match.description || match.name,
        unit_price,
        tax_rate: parsed.tax_rate ?? match.tax_rate ?? ctx.defaultTaxRate,
        match_confidence: parsed.confidence ?? 0.7,
      };
    }
    // Stale id from AI — fall through to create_new
  }

  // Branch: create_new
  const newName = (parsed.name || user_phrase).toString().slice(0, 120);
  const newDesc = (parsed.description || user_phrase).toString().slice(0, 1000);
  const userPrice = hint_amount != null ? Number(hint_amount) : null;

  // Pricing rule: if user gave hint, use it for unit_price.
  // Only store as default_price if confidence is reasonable AND not wildly off-history.
  let defaultPrice = Number(parsed.suggested_default_price ?? 0);
  if (userPrice != null) {
    const sims = history
      .map((h: any) => Number(h.unit_price))
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
    const median = sims.length ? sims[Math.floor(sims.length / 2)] : null;
    const within3x = median == null || (userPrice <= median * 3 && userPrice >= median / 3);
    if ((parsed.confidence ?? 0) >= 0.7 && within3x) {
      defaultPrice = userPrice;
    } else if (defaultPrice <= 0) {
      defaultPrice = userPrice; // still better than 0
    }
  }

  const taxRate = parsed.tax_rate != null ? Number(parsed.tax_rate) : ctx.defaultTaxRate;

  const { data: created, error: insErr } = await ctx.supabase
    .from("services_catalog")
    .insert({
      name: newName,
      description: newDesc,
      default_price: defaultPrice,
      tax_rate: taxRate,
      category: parsed.category || null,
      is_active: true,
      user_id: ctx.userId,
      team_id: ctx.teamId,
    })
    .select()
    .single();

  if (insErr) return { error: insErr.message };

  await audit(ctx, "create_service", "service", created.id, {
    source_phrase: user_phrase,
    confidence: parsed.confidence,
    reason: parsed.reason,
    learned_from_history_count: history.length,
  });

  return {
    was_created: true,
    service_id: created.id,
    name: created.name,
    description: created.description,
    unit_price: userPrice ?? defaultPrice,
    tax_rate: taxRate,
    match_confidence: parsed.confidence ?? 0.5,
  };
}

async function audit(ctx: Ctx, action: string, doc_type: string | null, doc_id: string | null, payload: any) {
  await ctx.admin.from("ai_actions").insert({
    team_id: ctx.teamId,
    user_id: ctx.userId,
    action,
    doc_type,
    doc_id,
    payload,
  });
}

async function findOrCreateClient(args: any, ctx: Ctx) {
  const { name, email, phone, company, confirmed_new } = args;
  const parts = (name || "").trim().split(/\s+/);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ");

  // Fuzzy search using trigram similarity
  const { data: candidates } = await ctx.supabase
    .from("clients")
    .select("id, first_name, last_name, company_name, email, phone")
    .or(
      `first_name.ilike.%${first}%,last_name.ilike.%${last || first}%,company_name.ilike.%${company || name}%`
    )
    .limit(5);

  const matches = (candidates || []).filter((c: any) => {
    const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
    const companyName = (c.company_name || "").toLowerCase();
    const search = name.toLowerCase();
    return fullName.includes(search) || search.includes(fullName.trim()) || companyName.includes(search);
  });

  if (matches.length === 1) {
    return { client_id: matches[0].id, was_created: false, name: `${matches[0].first_name} ${matches[0].last_name}`.trim() };
  }

  if (matches.length > 1 && !confirmed_new) {
    return {
      needs_clarification: true,
      candidates: matches.map((c: any) => ({
        id: c.id,
        label: `${c.first_name} ${c.last_name}${c.company_name ? ` · ${c.company_name}` : ""}`,
      })),
      message: `Found ${matches.length} matching clients. Ask the user which one.`,
    };
  }

  if (!confirmed_new) {
    return {
      needs_clarification: true,
      message: `No client found matching "${name}". Ask the user to confirm this is a new client and provide email or phone.`,
    };
  }

  // Create new
  const { data: created, error } = await ctx.supabase
    .from("clients")
    .insert({
      first_name: first,
      last_name: last || null,
      company_name: company || null,
      email: email || null,
      phone: phone || null,
      status: "active",
      user_id: ctx.userId,
      team_id: ctx.teamId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await audit(ctx, "create_client", "client", created.id, { name, email, phone });
  return { client_id: created.id, was_created: true, name: `${created.first_name} ${created.last_name || ""}`.trim() };
}

function computeLineItems(items: any[], defaultTaxRate: number) {
  let subtotal = 0;
  let tax_amount = 0;
  const normalized = items.map((it) => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unit_price) || 0;
    const tax = it.tax_rate != null ? Number(it.tax_rate) : defaultTaxRate;
    const base = qty * price;
    const taxOnLine = base * (tax / 100);
    subtotal += base;
    tax_amount += taxOnLine;
    return {
      service_id: it.service_id || null,
      description: it.description,
      quantity: qty,
      unit_price: price,
      tax_rate: tax,
      discount_percent: 0,
      line_total: Math.round((base + taxOnLine) * 100) / 100,
    };
  });
  return {
    items: normalized,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax_amount * 100) / 100,
    total: Math.round((subtotal + tax_amount) * 100) / 100,
  };
}

async function nextDocNumber(ctx: Ctx, kind: "quote" | "invoice") {
  const prefixField = kind === "quote" ? "quote_prefix" : "invoice_prefix";
  const numberField = kind === "quote" ? "next_quote_number" : "next_invoice_number";
  const { data: settings } = await ctx.supabase
    .from("company_settings")
    .select(`id, ${prefixField}, ${numberField}`)
    .maybeSingle();
  const prefix = (settings as any)?.[prefixField] || (kind === "quote" ? "Q-" : "INV-");
  const num = (settings as any)?.[numberField] || 1001;
  const formatted = `${prefix}${num}`;
  if (settings) {
    await ctx.supabase
      .from("company_settings")
      .update({ [numberField]: num + 1 })
      .eq("id", (settings as any).id);
  }
  return formatted;
}

async function ensureServiceIds(items: any[], ctx: Ctx, docContext: string): Promise<any[]> {
  const out: any[] = [];
  for (const it of items) {
    if (it.service_id) {
      out.push(it);
      continue;
    }
    // Try a quick ILIKE match first to avoid an AI call
    const phrase = (it.description || "").trim();
    if (phrase) {
      const { data: m } = await ctx.supabase
        .from("services_catalog")
        .select("id, name, description, default_price, tax_rate")
        .eq("is_active", true)
        .ilike("name", `%${phrase.slice(0, 60)}%`)
        .limit(1)
        .maybeSingle();
      if (m) {
        out.push({
          ...it,
          service_id: m.id,
          description: it.description || m.description || m.name,
          tax_rate: it.tax_rate ?? m.tax_rate ?? ctx.defaultTaxRate,
        });
        continue;
      }
    }
    // Fall back to full resolve_service (creates a new service)
    const resolved = await resolveService(
      { user_phrase: phrase || "Service", hint_amount: it.unit_price, quantity: it.quantity, doc_context: docContext },
      ctx
    );
    if (resolved?.service_id) {
      out.push({
        service_id: resolved.service_id,
        description: resolved.description || it.description,
        quantity: it.quantity ?? 1,
        unit_price: it.unit_price ?? resolved.unit_price ?? 0,
        tax_rate: it.tax_rate ?? resolved.tax_rate ?? ctx.defaultTaxRate,
      });
    } else {
      out.push(it); // give up gracefully
    }
  }
  return out;
}

async function createDraftQuote(args: any, ctx: Ctx) {
  const { client_id, title, line_items, valid_until } = args;
  if (!line_items || line_items.length === 0) {
    return { error: "At least one line item required" };
  }
  const enriched = await ensureServiceIds(line_items, ctx, `quote: ${title || ""}`);
  const totals = computeLineItems(enriched, ctx.defaultTaxRate);
  const number = await nextDocNumber(ctx, "quote");

  const { data: quote, error } = await ctx.supabase
    .from("quotes")
    .insert({
      quote_number: number,
      client_id,
      title: title || null,
      valid_until: valid_until || null,
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      discount_amount: 0,
      total: totals.total,
      status: "draft",
      user_id: ctx.userId,
      team_id: ctx.teamId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const lineRows = totals.items.map((it: any, i: number) => ({
    ...it,
    quote_id: quote.id,
    user_id: ctx.userId,
    team_id: ctx.teamId,
    sort_order: i,
  }));
  await ctx.supabase.from("quote_line_items").insert(lineRows);

  await audit(ctx, "create_draft_quote", "quote", quote.id, { number, total: totals.total, title });
  return { quote_id: quote.id, quote_number: number, total: totals.total };
}

async function createDraftInvoice(args: any, ctx: Ctx) {
  const { client_id, title, from_quote_id, line_items } = args;

  let items = line_items;
  let sourceTitle = title;
  let sourceClientId = client_id;

  if (from_quote_id) {
    const { data: q } = await ctx.supabase
      .from("quotes")
      .select("id, title, client_id, deposit_value, deposit_type")
      .eq("id", from_quote_id)
      .maybeSingle();
    if (!q) return { error: "Source quote not found" };
    sourceTitle = title || q.title;
    sourceClientId = client_id || q.client_id;

    const { data: qItems } = await ctx.supabase
      .from("quote_line_items")
      .select("service_id, description, quantity, unit_price, tax_rate")
      .eq("quote_id", from_quote_id)
      .order("sort_order");
    items = qItems || [];
  }

  if (!items || items.length === 0) {
    return { error: "At least one line item required" };
  }

  // Resolve service_id for any ad-hoc items (skipped if from_quote_id since those already carry service_id)
  const enriched = from_quote_id ? items : await ensureServiceIds(items, ctx, `invoice: ${title || ""}`);
  const totals = computeLineItems(enriched, ctx.defaultTaxRate);
  const number = await nextDocNumber(ctx, "invoice");

  const { data: invoice, error } = await ctx.supabase
    .from("invoices")
    .insert({
      invoice_number: number,
      client_id: sourceClientId,
      title: sourceTitle || null,
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      discount_amount: 0,
      total: totals.total,
      balance_due: totals.total,
      amount_paid: 0,
      status: "draft",
      user_id: ctx.userId,
      team_id: ctx.teamId,
      quote_id: from_quote_id || null,
    } as any)
    .select()
    .single();

  if (error) return { error: error.message };

  const lineRows = totals.items.map((it: any, i: number) => ({
    ...it,
    invoice_id: invoice.id,
    user_id: ctx.userId,
    team_id: ctx.teamId,
    sort_order: i,
  }));
  await ctx.supabase.from("invoice_line_items").insert(lineRows);

  await audit(ctx, "create_draft_invoice", "invoice", invoice.id, {
    number,
    total: totals.total,
    title: sourceTitle,
    from_quote_id,
  });
  return { invoice_id: invoice.id, invoice_number: number, total: totals.total };
}

async function lookupRecentDocuments(args: any, ctx: Ctx) {
  const { client_id, doc_type, keyword, status } = args;
  const table = doc_type === "quote" ? "quotes" : "invoices";
  const numberField = doc_type === "quote" ? "quote_number" : "invoice_number";
  let q = ctx.supabase
    .from(table)
    .select(`id, ${numberField}, title, total, status, created_at`)
    .eq("client_id", client_id)
    .order("created_at", { ascending: false })
    .limit(5);
  if (status) q = q.eq("status", status);
  if (keyword) q = q.ilike("title", `%${keyword}%`);
  const { data } = await q;
  return { documents: data || [] };
}

// Find a single client by id or fuzzy name. Returns { client_id, label } or { needs_clarification, candidates }.
async function findClientForLookup(args: { client_id?: string; client_name?: string }, ctx: Ctx) {
  if (args.client_id) {
    const { data } = await ctx.supabase
      .from("clients")
      .select("id, first_name, last_name, company_name")
      .eq("id", args.client_id)
      .maybeSingle();
    if (data) return { client_id: data.id, label: `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.company_name || "client" };
  }
  const name = (args.client_name || "").trim();
  if (!name) return { error: "Provide client_id or client_name." };
  const parts = name.split(/\s+/);
  const first = parts[0] || "";
  const last = parts.slice(1).join(" ");
  const { data } = await ctx.supabase
    .from("clients")
    .select("id, first_name, last_name, company_name")
    .or(
      `first_name.ilike.%${first}%,last_name.ilike.%${last || first}%,company_name.ilike.%${name}%`
    )
    .limit(5);
  const matches = (data || []).filter((c: any) => {
    const full = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().trim();
    const co = (c.company_name || "").toLowerCase();
    const search = name.toLowerCase();
    return full.includes(search) || search.includes(full) || co.includes(search);
  });
  if (matches.length === 0) return { error: `No client found matching "${name}".` };
  if (matches.length > 1) {
    return {
      needs_clarification: true,
      candidates: matches.map((c: any) => ({
        id: c.id,
        label: `${c.first_name || ""} ${c.last_name || ""}${c.company_name ? ` · ${c.company_name}` : ""}`.trim(),
      })),
    };
  }
  const m = matches[0];
  return { client_id: m.id, label: `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.company_name || "client" };
}

async function lookupClientHistory(args: any, ctx: Ctx) {
  const found = await findClientForLookup(args, ctx);
  if ((found as any).error || (found as any).needs_clarification) return found;
  const clientId = (found as any).client_id;
  const label = (found as any).label;

  const [{ data: lastQuote }, { data: lastInvoice }, { data: allInvoices }] = await Promise.all([
    ctx.supabase
      .from("quotes")
      .select("id, quote_number, title, total, status, created_at, approved_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from("invoices")
      .select("id, invoice_number, title, total, amount_paid, balance_due, status, created_at, due_date, paid_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    ctx.supabase
      .from("invoices")
      .select("total, amount_paid, balance_due, status")
      .eq("client_id", clientId)
      .limit(500),
  ]);

  let lifetime_revenue = 0;
  let open_balance = 0;
  for (const inv of allInvoices || []) {
    lifetime_revenue += Number(inv.amount_paid) || 0;
    open_balance += Number(inv.balance_due) || 0;
  }

  return {
    client_id: clientId,
    client_label: label,
    last_quote: lastQuote || null,
    last_invoice: lastInvoice || null,
    lifetime_revenue: Math.round(lifetime_revenue * 100) / 100,
    open_balance: Math.round(open_balance * 100) / 100,
    invoice_count: (allInvoices || []).length,
  };
}

async function listOverdueInvoices(args: any, ctx: Ctx) {
  const minDays = Math.max(1, Number(args?.min_days_overdue) || 1);
  const cutoff = new Date(Date.now() - minDays * 86400000).toISOString().slice(0, 10);
  const { data } = await ctx.supabase
    .from("invoices")
    .select("id, invoice_number, title, total, balance_due, due_date, status, client_id, clients(first_name, last_name, company_name)")
    .gt("balance_due", 0)
    .not("due_date", "is", null)
    .lt("due_date", cutoff)
    .neq("status", "draft")
    .order("due_date", { ascending: true })
    .limit(20);
  const today = new Date();
  const items = (data || []).map((inv: any) => {
    const due = inv.due_date ? new Date(inv.due_date) : null;
    const days_overdue = due ? Math.floor((today.getTime() - due.getTime()) / 86400000) : null;
    const c = inv.clients || {};
    const client_label = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.company_name || "Unknown";
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_label,
      balance_due: Number(inv.balance_due),
      total: Number(inv.total),
      due_date: inv.due_date,
      days_overdue,
    };
  });
  return { count: items.length, invoices: items };
}

async function listUnpaidInvoices(args: any, ctx: Ctx) {
  let q = ctx.supabase
    .from("invoices")
    .select("id, invoice_number, title, total, balance_due, due_date, status, created_at, client_id, clients(first_name, last_name, company_name)")
    .gt("balance_due", 0)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(20);
  if (args?.since_date) q = q.gte("created_at", args.since_date);
  if (args?.client_name) {
    const found = await findClientForLookup({ client_name: args.client_name }, ctx);
    if ((found as any).error) return found;
    if ((found as any).needs_clarification) return found;
    q = q.eq("client_id", (found as any).client_id);
  }
  const { data } = await q;
  const items = (data || []).map((inv: any) => {
    const c = inv.clients || {};
    const client_label = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.company_name || "Unknown";
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_label,
      balance_due: Number(inv.balance_due),
      total: Number(inv.total),
      due_date: inv.due_date,
      created_at: inv.created_at,
      status: inv.status,
    };
  });
  return { count: items.length, invoices: items };
}

async function listApprovedQuotesNotInvoiced(_args: any, ctx: Ctx) {
  const { data: quotes } = await ctx.supabase
    .from("quotes")
    .select("id, quote_number, title, total, approved_at, client_id, clients(first_name, last_name, company_name)")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(40);
  const ids = (quotes || []).map((q: any) => q.id);
  let invoicedQuoteIds = new Set<string>();
  if (ids.length > 0) {
    const { data: invs } = await ctx.supabase
      .from("invoices")
      .select("quote_id")
      .in("quote_id", ids);
    invoicedQuoteIds = new Set((invs || []).map((i: any) => i.quote_id).filter(Boolean));
  }
  const items = (quotes || [])
    .filter((q: any) => !invoicedQuoteIds.has(q.id))
    .slice(0, 20)
    .map((q: any) => {
      const c = q.clients || {};
      const client_label = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.company_name || "Unknown";
      return {
        id: q.id,
        quote_number: q.quote_number,
        title: q.title,
        total: Number(q.total),
        approved_at: q.approved_at,
        client_label,
      };
    });
  return { count: items.length, quotes: items };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tm } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const teamId = tm?.team_id;
    if (!teamId) {
      return new Response(JSON.stringify({ error: "No team" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user rate limiting (protects against runaway AI costs)
    const tier = await resolveTier(admin, user.id);
    const quota = await enforceAiQuota(admin, user.id, "linq-assistant", tier);
    if (!quota.ok) return quotaResponse(quota, corsHeaders);

    const { data: cs } = await supabase
      .from("company_settings")
      .select("default_tax_rate")
      .maybeSingle();
    const defaultTaxRate = cs?.default_tax_rate != null ? Number(cs.default_tax_rate) : 0;

    // Personalize Linq with owner name + team
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: teamRow } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .maybeSingle();
    const rawName = (profile?.display_name || user.email?.split("@")[0] || "there").trim();
    const firstName = rawName.split(/\s+/)[0];
    const teamName = teamRow?.name || "your business";

    const { messages: incomingMessages } = await req.json();
    if (!Array.isArray(incomingMessages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx: Ctx = { supabase, admin, userId: user.id, teamId, defaultTaxRate };

    // Trim history to last 12 messages (≈6 turns)
    const trimmed = incomingMessages.slice(-12);
    const contextLine = `\n\nAccount owner: ${firstName} (full: ${rawName}). Business: ${teamName}. Default tax rate: ${defaultTaxRate}%.`;
    const conversationMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + contextLine },
      ...trimmed,
    ];

    // Up to 5 tool-call iterations to prevent infinite loops
    let createdDocs: any[] = [];
    for (let iter = 0; iter < 5; iter++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: conversationMessages,
          tools: TOOLS,
        }),
      });

      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Linq is busy — try again in a minute." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!aiResp.ok) {
        const t = await aiResp.text();
        console.error("Gateway error:", aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await aiResp.json();
      const choice = data.choices?.[0];
      const message = choice?.message;
      if (!message) break;

      conversationMessages.push(message);

      const toolCalls = message.tool_calls || [];
      if (toolCalls.length === 0) {
        // Final assistant message — return
        return new Response(
          JSON.stringify({
            reply: message.content || "",
            createdDocs,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const tc of toolCalls) {
        let args: any = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch (e) {
          args = {};
        }
        const result = await handleTool(tc.function.name, args, ctx);

        if (result?.quote_id) {
          createdDocs.push({ type: "quote", id: result.quote_id, number: result.quote_number, total: result.total });
        }
        if (result?.invoice_id) {
          createdDocs.push({ type: "invoice", id: result.invoice_id, number: result.invoice_number, total: result.total });
        }

        conversationMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    return new Response(
      JSON.stringify({
        reply: "I got stuck in a loop — could you rephrase that?",
        createdDocs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("linq-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
