import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Sparkles, Plus, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useService, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServices";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  default_price: z.coerce.number().min(0, "Price must be 0 or more"),
  tax_rate: z.coerce.number().min(0).max(100).nullable().optional(),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface Suggestion {
  name: string;
  description: string | null;
  default_price: number;
  category: string | null;
}

const ServiceForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: existing, isLoading: loadingService } = useService(id);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { data: companySettings } = useCompanySettings();
  const defaultTaxRate = companySettings?.default_tax_rate != null ? Number(companySettings.default_tax_rate) : 0;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", category: "", default_price: 0, tax_rate: defaultTaxRate, is_active: true },
  });

  // Apply default tax rate once company settings load (new service only)
  useEffect(() => {
    if (!isEdit && companySettings) {
      form.setValue("tax_rate", defaultTaxRate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companySettings, isEdit]);

  useEffect(() => {
    if (existing) {
      form.reset({
        name: existing.name,
        description: existing.description || "",
        category: existing.category || "",
        default_price: existing.default_price,
        tax_rate: existing.tax_rate ?? defaultTaxRate,
        is_active: existing.is_active,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-starter-services", {
        body: { mode: "suggest" },
      });
      if (error) throw error;
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (e) {
      toast({
        title: "Couldn't load suggestions",
        description: "Linq is unavailable right now. You can still add services manually.",
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestions(false);
      setSuggestionsLoaded(true);
    }
  };

  // Auto-load suggestions on the New Service screen
  useEffect(() => {
    if (!isEdit) fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  const applySuggestion = (s: Suggestion) => {
    form.setValue("name", s.name, { shouldDirty: true });
    form.setValue("description", s.description || "", { shouldDirty: true });
    form.setValue("category", s.category || "", { shouldDirty: true });
    form.setValue("default_price", s.default_price ?? 0, { shouldDirty: true });
    // Remove the chosen suggestion from the list
    setSuggestions((prev) => prev.filter((x) => x.name !== s.name));
    // Scroll to top so the user sees the prefilled fields
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (values: ServiceFormValues) => {
    const shared = {
      description: values.description || null,
      category: values.category || null,
      tax_rate: values.tax_rate ?? null,
      default_price: values.default_price,
      is_active: values.is_active,
    };
    if (isEdit) {
      await updateService.mutateAsync({ id: id!, name: values.name, ...shared });
      navigate("/services");
    } else {
      await createService.mutateAsync({ name: values.name, ...shared });
      navigate("/services");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteService.mutateAsync(id);
    setDeleteOpen(false);
    navigate("/services");
  };

  const isSaving = createService.isPending || updateService.isPending;

  if (isEdit && loadingService) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-5 animate-fade-in">
        <PageHeader
          onBack={() => navigate("/services")}
          title={isEdit ? "Edit Service" : "New Service"}
          description={isEdit ? "Update this service." : "Add a reusable product or service."}
        />

        {/* Linq Recommended Services (new only) */}
        {!isEdit && (
          <Card className="shadow-warm border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-display flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Linq Recommended
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground"
                  onClick={fetchSuggestions}
                  disabled={loadingSuggestions}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingSuggestions ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Tap a suggestion to prefill the form.</p>
            </CardHeader>
            <CardContent>
              {loadingSuggestions && !suggestions.length ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Linq is thinking…
                </div>
              ) : suggestions.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="group flex items-start gap-2 rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/40 hover:shadow-warm active:scale-[0.99]"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Plus className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                        )}
                        <p className="text-xs font-medium text-primary mt-1">${Number(s.default_price).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : suggestionsLoaded ? (
                <p className="py-2 text-xs text-muted-foreground">No suggestions available right now.</p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl><Input placeholder="e.g. Lawn Mowing" className="rounded-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Optional description" rows={3} className="rounded-lg resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input placeholder="e.g. Landscaping" className="rounded-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="shadow-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display">Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="default_price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Price ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" min="0" className="rounded-lg" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tax_rate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="rounded-lg"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-warm">
              <CardContent className="p-4">
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3">
                    <div>
                      <FormLabel className="text-sm font-medium">Active</FormLabel>
                      <p className="text-xs text-muted-foreground">Available for use in quotes and invoices</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
              {isEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg text-destructive hover:text-destructive sm:order-1"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              ) : <span className="hidden sm:block" />}
              <div className="flex gap-2 sm:order-2">
                <Button type="button" variant="outline" className="flex-1 rounded-lg sm:flex-none" onClick={() => navigate("/services")}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-1.5 rounded-lg shadow-warm sm:flex-none" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isEdit ? "Save Changes" : "Create Service"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{existing?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The service will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteService.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ServiceForm;
