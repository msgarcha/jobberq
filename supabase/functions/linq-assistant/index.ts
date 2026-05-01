// Linq AI Assistant — tool-calling agent that creates DRAFT records only.
// Never sends, never charges, never approves. Audit-logged via ai_actions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `You are Linq, an AI assistant for QuickLinq — a CRM for trade contractors (plumbers, landscapers, cleaners, etc.).

Your job: turn one short sentence from the user into a DRAFT quote, invoice, client, or job. You NEVER send, email, charge, or approve anything — you only create drafts the user reviews.

Rules:
- Always call tools to do work. Never invent IDs.
- If a client name matches multiple existing clients, ask the user to pick — don't guess.
- If a price is vague ("a few thousand"), ask for a number.
- For "invoice the [thing] quote" requests, first call lookup_recent_documents to find the matching approved quote, then convert it.
- Use the team's default tax rate when not specified. Don't add deposits unless requested.
- BEFORE calling create_draft_quote or create_draft_invoice (when NOT converting from an existing quote), call resolve_service ONCE per line item the user mentioned. Use the returned service_id, description, unit_price, and tax_rate when building line_items. Never write your own line-item description — let resolve_service do it so it matches the team's wording and pricing history.
- Keep replies under 25 words. Be friendly and direct.
- After successfully creating a draft, briefly confirm what you created and stop.`;

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

async function createDraftQuote(args: any, ctx: Ctx) {
  const { client_id, title, line_items, valid_until } = args;
  if (!line_items || line_items.length === 0) {
    return { error: "At least one line item required" };
  }
  const totals = computeLineItems(line_items, ctx.defaultTaxRate);
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
    service_id: null,
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
      .select("description, quantity, unit_price, tax_rate")
      .eq("quote_id", from_quote_id)
      .order("sort_order");
    items = qItems || [];
  }

  if (!items || items.length === 0) {
    return { error: "At least one line item required" };
  }

  const totals = computeLineItems(items, ctx.defaultTaxRate);
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
    service_id: null,
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

    const { data: cs } = await supabase
      .from("company_settings")
      .select("default_tax_rate")
      .maybeSingle();
    const defaultTaxRate = cs?.default_tax_rate != null ? Number(cs.default_tax_rate) : 0;

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
    const conversationMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + `\n\nDefault tax rate: ${defaultTaxRate}%.` },
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
