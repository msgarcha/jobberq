import { useState } from "react";
import { getPublicAppUrl } from "@/lib/native/platform";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ExternalLink, Copy, Trash2, Globe } from "lucide-react";
import { usePricingForms, useCreatePricingForm, useDeletePricingForm } from "@/hooks/usePricingForms";
import { useToast } from "@/hooks/use-toast";

const PricingForms = () => {
  const { data: forms, isLoading } = usePricingForms();
  const createForm = useCreatePricingForm();
  const deleteForm = useDeletePricingForm();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const baseUrl = getPublicAppUrl();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Pricing Forms</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Embeddable instant-quote forms. Share a link or paste an iframe on your website.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New form
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !forms || forms.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No pricing forms yet</h3>
              <p className="text-sm text-muted-foreground">
                Create your first form, pick services, and start collecting leads with instant pricing.
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Create form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((f) => {
              const url = `${baseUrl}/book/${f.slug}`;
              return (
                <Card key={f.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{f.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">/book/{f.slug}</p>
                      </div>
                      <Badge variant={f.is_published ? "default" : "secondary"}>
                        {f.is_published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/settings/pricing-forms/${f.id}`}>Edit</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          toast({ title: "Link copied" });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" /> Link
                      </Button>
                      {f.is_published && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" /> Open
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive ml-auto"
                        onClick={() => {
                          if (confirm("Delete this form?")) deleteForm.mutate(f.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New pricing form</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lawn Care Instant Quote"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={createForm.isPending}
                onClick={async () => {
                  const f = await createForm.mutateAsync({ title: title.trim() || "Instant Quote" });
                  setOpen(false);
                  setTitle("");
                  window.location.href = `/settings/pricing-forms/${f.id}`;
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PricingForms;
