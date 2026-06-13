import { useEffect, useMemo, useState } from "react";
import { getPublicAppUrl } from "@/lib/native/platform";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  usePricingForm, useUpdatePricingForm,
  useUpsertFormService, useDeleteFormService,
  useUpsertFormQuestion, useDeleteFormQuestion,
} from "@/hooks/usePricingForms";
import { useToast } from "@/hooks/use-toast";

const PricingFormBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading } = usePricingForm(id);
  const updateForm = useUpdatePricingForm();
  const upsertSvc = useUpsertFormService();
  const delSvc = useDeleteFormService();
  const upsertQ = useUpsertFormQuestion();
  const delQ = useDeleteFormQuestion();

  const [local, setLocal] = useState({
    title: "", description: "", primary_color: "#1f5f6e",
    success_message: "", require_phone: true, require_address: false, is_published: false, slug: "",
  });

  useEffect(() => {
    if (data?.form) {
      setLocal({
        title: data.form.title,
        description: data.form.description || "",
        primary_color: data.form.primary_color,
        success_message: data.form.success_message,
        require_phone: data.form.require_phone,
        require_address: data.form.require_address,
        is_published: data.form.is_published,
        slug: data.form.slug,
      });
    }
  }, [data?.form]);

  const baseUrl = getPublicAppUrl();
  const publicUrl = `${baseUrl}/book/${local.slug}`;
  const embedSnippet = useMemo(
    () =>
      `<iframe src="${publicUrl}?embed=1" style="width:100%;border:0;min-height:720px" loading="lazy"></iframe>`,
    [publicUrl],
  );

  if (isLoading || !data) {
    return <DashboardLayout><div className="p-6">Loading…</div></DashboardLayout>;
  }

  const saveForm = async () => {
    if (local.is_published && data.services.length === 0) {
      toast({
        title: "Add a service first",
        description: "You can't publish a form with zero services.",
        variant: "destructive",
      });
      return;
    }
    await updateForm.mutateAsync({ id: id!, patch: local });
    toast({ title: "Saved" });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/settings/pricing-forms")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Badge variant={local.is_published ? "default" : "secondary"}>
            {local.is_published ? "Live" : "Draft"}
          </Badge>
          <div className="ml-auto flex gap-2">
            {local.is_published && (
              <Button variant="outline" size="sm" asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </a>
              </Button>
            )}
            <Button onClick={saveForm} disabled={updateForm.isPending}>Save</Button>
          </div>
        </div>

        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="branding">Branding & Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-3">
            {data.services.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 grid gap-3 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Label>Display name</Label>
                    <Input
                      defaultValue={s.display_name}
                      onBlur={(e) =>
                        e.target.value !== s.display_name &&
                        upsertSvc.mutate({ id: s.id, form_id: s.form_id, display_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Base price</Label>
                    <Input
                      type="number" step="0.01" min={0}
                      defaultValue={s.base_price}
                      onBlur={(e) =>
                        upsertSvc.mutate({ id: s.id, form_id: s.form_id, base_price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Unit label</Label>
                    <Input
                      defaultValue={s.unit_label || ""}
                      placeholder="e.g. sq ft"
                      onBlur={(e) =>
                        upsertSvc.mutate({ id: s.id, form_id: s.form_id, unit_label: e.target.value || null })
                      }
                    />
                  </div>
                  <div>
                    <Label>Min qty</Label>
                    <Input
                      type="number" min={1}
                      defaultValue={s.min_qty}
                      onBlur={(e) =>
                        upsertSvc.mutate({ id: s.id, form_id: s.form_id, min_qty: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Max qty</Label>
                      <Input
                        type="number" min={1}
                        defaultValue={s.max_qty}
                        onBlur={(e) =>
                          upsertSvc.mutate({ id: s.id, form_id: s.form_id, max_qty: Number(e.target.value) })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost" size="icon" className="text-destructive"
                      onClick={() => delSvc.mutate({ id: s.id, form_id: s.form_id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                upsertSvc.mutate({
                  form_id: id!,
                  display_name: "New service",
                  base_price: 0,
                  min_qty: 1, max_qty: 1,
                  sort_order: data.services.length,
                })
              }
            >
              <Plus className="h-4 w-4" /> Add service
            </Button>
          </TabsContent>

          <TabsContent value="questions" className="space-y-3">
            {data.questions.map((q) => (
              <Card key={q.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-6">
                    <div className="md:col-span-3">
                      <Label>Question</Label>
                      <Input
                        defaultValue={q.label}
                        onBlur={(e) =>
                          e.target.value !== q.label &&
                          upsertQ.mutate({ id: q.id, form_id: q.form_id, label: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        defaultValue={q.kind}
                        onValueChange={(v) => upsertQ.mutate({ id: q.id, form_id: q.form_id, kind: v as any })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Single select</SelectItem>
                          <SelectItem value="multiselect">Multi-select</SelectItem>
                          <SelectItem value="yesno">Yes / No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          defaultChecked={q.required}
                          onCheckedChange={(v) =>
                            upsertQ.mutate({ id: q.id, form_id: q.form_id, required: v })
                          }
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="text-destructive ml-auto"
                        onClick={() => delQ.mutate({ id: q.id, form_id: q.form_id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {(q.kind === "select" || q.kind === "multiselect") && (
                    <OptionsEditor
                      options={q.options}
                      onChange={(options) => upsertQ.mutate({ id: q.id, form_id: q.form_id, options })}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                upsertQ.mutate({
                  form_id: id!,
                  label: "New question",
                  kind: "text",
                  required: false,
                  options: [],
                  applies_to_service_ids: [],
                  sort_order: data.questions.length,
                })
              }
            >
              <Plus className="h-4 w-4" /> Add question
            </Button>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Form title</Label>
                  <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Primary color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        value={local.primary_color}
                        onChange={(e) => setLocal({ ...local, primary_color: e.target.value })}
                      />
                      <Input
                        value={local.primary_color}
                        onChange={(e) => setLocal({ ...local, primary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>URL slug</Label>
                    <Input
                      value={local.slug}
                      onChange={(e) =>
                        setLocal({ ...local, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Success message</Label>
                  <Textarea
                    value={local.success_message}
                    onChange={(e) => setLocal({ ...local, success_message: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={local.require_phone}
                      onCheckedChange={(v) => setLocal({ ...local, require_phone: v })}
                    />
                    <span className="text-sm">Require phone</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={local.require_address}
                      onCheckedChange={(v) => setLocal({ ...local, require_address: v })}
                    />
                    <span className="text-sm">Require address</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={local.is_published}
                      disabled={data.services.length === 0}
                      onCheckedChange={(v) => {
                        if (v && data.services.length === 0) {
                          toast({
                            title: "Add a service first",
                            description: "You can't publish a form with zero services.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setLocal({ ...local, is_published: v });
                      }}
                    />
                    <span className="text-sm">Published</span>
                    {data.services.length === 0 && (
                      <span className="text-xs text-muted-foreground">(add a service to publish)</span>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium">Share</h3>
                <div className="space-y-2">
                  <Label className="text-xs">Public link</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={publicUrl} />
                    <Button
                      variant="outline" size="icon"
                      onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Copied" }); }}
                    ><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Embed snippet</Label>
                  <Textarea readOnly value={embedSnippet} className="font-mono text-xs h-24" />
                  <Button
                    size="sm" variant="outline"
                    onClick={() => { navigator.clipboard.writeText(embedSnippet); toast({ title: "Copied" }); }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy embed
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function OptionsEditor({
  options,
  onChange,
}: {
  options: Array<{ label: string; value: string; price_delta?: number; price_kind?: "flat" | "percent" | "per_unit" }>;
  onChange: (opts: any[]) => void;
}) {
  const update = (i: number, patch: any) => {
    const next = options.map((o, idx) => (idx === i ? { ...o, ...patch } : o));
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs">Options</Label>
      {options.map((o, i) => (
        <div key={i} className="grid gap-2 md:grid-cols-5">
          <Input
            placeholder="Label"
            defaultValue={o.label}
            onBlur={(e) => update(i, { label: e.target.value, value: o.value || e.target.value })}
          />
          <Input
            placeholder="Value"
            defaultValue={o.value}
            onBlur={(e) => update(i, { value: e.target.value })}
          />
          <Input
            type="number" step="0.01" placeholder="Price delta"
            defaultValue={o.price_delta ?? 0}
            onBlur={(e) => update(i, { price_delta: Number(e.target.value) })}
          />
          <Select
            defaultValue={o.price_kind || "flat"}
            onValueChange={(v) => update(i, { price_kind: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat add</SelectItem>
              <SelectItem value="percent">Percent surcharge</SelectItem>
              <SelectItem value="per_unit">Per unit</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost" size="icon" className="text-destructive"
            onClick={() => onChange(options.filter((_, idx) => idx !== i))}
          ><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button
        size="sm" variant="outline"
        onClick={() => onChange([...options, { label: "Option", value: `opt-${options.length + 1}`, price_delta: 0, price_kind: "flat" }])}
      >
        <Plus className="h-3.5 w-3.5" /> Add option
      </Button>
    </div>
  );
}

export default PricingFormBuilder;
