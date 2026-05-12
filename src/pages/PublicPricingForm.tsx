import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, Minus, Plus } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type FormDef = {
  slug: string;
  title: string;
  description: string | null;
  primary_color: string;
  logo_url: string | null;
  success_message: string;
  require_address: boolean;
  require_phone: boolean;
  company_name: string | null;
  tax_rate: number;
  services: Array<{
    id: string; display_name: string; base_price: number;
    unit_label: string | null; min_qty: number; max_qty: number;
  }>;
  questions: Array<{
    id: string; label: string; help_text: string | null;
    kind: "text" | "number" | "select" | "multiselect" | "yesno";
    required: boolean;
    options: Array<{ label: string; value: string; price_delta?: number; price_kind?: "flat" | "percent" | "per_unit" }>;
    applies_to_service_ids: string[];
  }>;
};

const PublicPricingForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const embed = params.get("embed") === "1";
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormDef | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [contact, setContact] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    address_line1: "", city: "", state: "", zip: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/public-pricing-form?slug=${encodeURIComponent(slug || "")}`, {
          headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
        });
        if (!r.ok) { setNotFound(true); return; }
        const data: FormDef = await r.json();
        setForm(data);
        const q: Record<string, number> = {};
        data.services.forEach((s) => { q[s.id] = s.min_qty; });
        setQty(q);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Auto-resize iframe
  useEffect(() => {
    if (!embed) return;
    const post = () => {
      window.parent?.postMessage({ type: "quicklinq:resize", height: document.body.scrollHeight }, "*");
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [embed, form, qty, picked, answers, done]);

  // Hide questions that duplicate the always-present contact fields
  const visibleQuestions = useMemo(() => {
    if (!form) return [];
    const dupe = /^(first\s*name|last\s*name|full\s*name|name|email|e-?mail|phone|telephone|mobile)\s*\*?$/i;
    return form.questions.filter((q) => !dupe.test(q.label.trim()));
  }, [form]);

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, tax: 0, total: 0 };
    let subtotal = 0;
    let tax = 0;
    for (const s of form.services) {
      if (!picked[s.id]) continue;
      let unit = Number(s.base_price);
      let pct = 0;
      let flat = 0;
      for (const q of form.questions) {
        if (q.applies_to_service_ids.length > 0 && !q.applies_to_service_ids.includes(s.id)) continue;
        const v = answers[q.id];
        const vals: string[] = Array.isArray(v) ? v.map(String) : v != null ? [String(v)] : [];
        for (const opt of q.options || []) {
          if (!vals.includes(String(opt.value))) continue;
          const d = Number(opt.price_delta) || 0;
          if (opt.price_kind === "percent") pct += d;
          else if (opt.price_kind === "per_unit") unit += d;
          else flat += d;
        }
      }
      const lineUnit = Math.round(unit * (1 + pct / 100) * 100) / 100;
      const q = qty[s.id] ?? s.min_qty;
      const lineSub = lineUnit * q + flat;
      subtotal += lineSub;
      tax += lineSub * (form.tax_rate / 100);
    }
    subtotal = Math.round(subtotal * 100) / 100;
    tax = Math.round(tax * 100) / 100;
    return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
  }, [form, picked, qty, answers]);

  const submit = async () => {
    if (!form) return;
    setError(null);
    const selected_services = form.services.filter((s) => picked[s.id]).map((s) => ({
      service_id: s.id, quantity: qty[s.id] ?? s.min_qty,
    }));
    if (selected_services.length === 0) { setError("Pick at least one service."); return; }
    if (!contact.first_name || !contact.last_name || !contact.email) { setError("Name and email required."); return; }
    if (form.require_phone && !contact.phone) { setError("Phone required."); return; }
    if (form.require_address && !contact.address_line1) { setError("Address required."); return; }

    setSubmitting(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/submit-pricing-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({
          slug: form.slug,
          contact,
          selected_services,
          answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Submission failed");
      setDone(form.success_message || "Thanks! We'll be in touch.");
    } catch (e: any) {
      setError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (notFound || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Form not found</h1>
          <p className="text-muted-foreground text-sm mt-1">This link may have been disabled.</p>
        </div>
      </div>
    );
  }

  const accent = form.primary_color || "#1f5f6e";

  return (
    <div className={embed ? "min-h-0 bg-background" : "min-h-screen bg-muted/30"}>
      <div
        className="max-w-2xl mx-auto p-4 md:p-6"
        style={{ ["--accent" as any]: accent }}
      >
        {!embed && (
          <div className="text-center mb-6">
            {form.logo_url && (
              <img src={form.logo_url} alt="" className="h-12 mx-auto mb-3" />
            )}
            {form.company_name && <p className="text-sm text-muted-foreground">{form.company_name}</p>}
          </div>
        )}

        <Card>
          <CardContent className="p-5 md:p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: accent }}>{form.title}</h1>
              {form.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{form.description}</p>}
            </div>

            {done ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: accent }} />
                <h2 className="text-lg font-semibold">All set!</h2>
                <p className="text-muted-foreground whitespace-pre-line">{done}</p>
              </div>
            ) : (
              <>
                <section className="space-y-2">
                  <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Services</h2>
                  {form.services.length === 0 && (
                    <p className="text-sm text-muted-foreground">No services available yet.</p>
                  )}
                  {form.services.map((s) => {
                    const isOn = !!picked[s.id];
                    return (
                      <div
                        key={s.id}
                        className={`border rounded-lg p-3 transition-colors ${isOn ? "border-2" : ""}`}
                        style={isOn ? { borderColor: accent } : {}}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isOn}
                            onChange={(e) => setPicked({ ...picked, [s.id]: e.target.checked })}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2 items-start">
                              <span className="font-medium">{s.display_name}</span>
                              <span className="text-sm font-semibold whitespace-nowrap">
                                ${s.base_price.toFixed(2)}{s.unit_label ? ` / ${s.unit_label}` : ""}
                              </span>
                            </div>
                            {isOn && s.max_qty > s.min_qty && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  type="button" variant="outline" size="icon" className="h-8 w-8"
                                  onClick={() => setQty({ ...qty, [s.id]: Math.max(s.min_qty, (qty[s.id] ?? s.min_qty) - 1) })}
                                ><Minus className="h-3 w-3" /></Button>
                                <span className="w-12 text-center text-sm">{qty[s.id] ?? s.min_qty}</span>
                                <Button
                                  type="button" variant="outline" size="icon" className="h-8 w-8"
                                  onClick={() => setQty({ ...qty, [s.id]: Math.min(s.max_qty, (qty[s.id] ?? s.min_qty) + 1) })}
                                ><Plus className="h-3 w-3" /></Button>
                                {s.unit_label && <span className="text-xs text-muted-foreground">{s.unit_label}</span>}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </section>

                {visibleQuestions.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Tell us more</h2>
                    {visibleQuestions.map((q) => (
                      <div key={q.id} className="space-y-1.5">
                        <Label>{q.label}{q.required && " *"}</Label>
                        {q.help_text && <p className="text-xs text-muted-foreground">{q.help_text}</p>}
                        {q.kind === "text" && (
                          <Input
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          />
                        )}
                        {q.kind === "number" && (
                          <Input
                            type="number"
                            value={answers[q.id] || ""}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          />
                        )}
                        {q.kind === "yesno" && (
                          <div className="flex gap-2">
                            {["yes", "no"].map((v) => (
                              <Button
                                key={v} type="button"
                                variant={answers[q.id] === v ? "default" : "outline"}
                                size="sm"
                                style={answers[q.id] === v ? { background: accent } : {}}
                                onClick={() => setAnswers({ ...answers, [q.id]: v })}
                              >{v.toUpperCase()}</Button>
                            ))}
                          </div>
                        )}
                        {q.kind === "select" && (
                          <div className="grid gap-2">
                            {q.options.map((o) => (
                              <Button
                                key={o.value} type="button"
                                variant={answers[q.id] === o.value ? "default" : "outline"}
                                size="sm" className="justify-start"
                                style={answers[q.id] === o.value ? { background: accent } : {}}
                                onClick={() => setAnswers({ ...answers, [q.id]: o.value })}
                              >{o.label}</Button>
                            ))}
                          </div>
                        )}
                        {q.kind === "multiselect" && (
                          <div className="grid gap-2">
                            {q.options.map((o) => {
                              const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                              const on = arr.includes(o.value);
                              return (
                                <Button
                                  key={o.value} type="button"
                                  variant={on ? "default" : "outline"}
                                  size="sm" className="justify-start"
                                  style={on ? { background: accent } : {}}
                                  onClick={() =>
                                    setAnswers({
                                      ...answers,
                                      [q.id]: on ? arr.filter((v) => v !== o.value) : [...arr, o.value],
                                    })
                                  }
                                >{o.label}</Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                )}

                <section className="space-y-3">
                  <h2 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Your details</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>First name *</Label>
                      <Input value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Last name *</Label>
                      <Input value={contact.last_name} onChange={(e) => setContact({ ...contact, last_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone {form.require_phone && "*"}</Label>
                      <Input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                    </div>
                  </div>
                  {form.require_address && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label>Address *</Label>
                        <Input value={contact.address_line1} onChange={(e) => setContact({ ...contact, address_line1: e.target.value })} />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>State</Label>
                          <Input value={contact.state} onChange={(e) => setContact({ ...contact, state: e.target.value })} />
                        </div>
                        <div>
                          <Label>Zip</Label>
                          <Input value={contact.zip} onChange={(e) => setContact({ ...contact, zip: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax</span><span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Estimated total</span>
                    <span style={{ color: accent }}>${totals.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Final price confirmed in your quote.</p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  className="w-full" size="lg"
                  style={{ background: accent }}
                  disabled={submitting}
                  onClick={submit}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get my quote"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {!embed && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Powered by QuickLinq
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicPricingForm;
