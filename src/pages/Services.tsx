import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Wrench, ChevronRight, Search, Package } from "lucide-react";
import { useServices, useCreateService, useUpdateService, useDeleteService, type Service } from "@/hooks/useServices";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  default_price: z.coerce.number().min(0, "Price must be 0 or more"),
  tax_rate: z.coerce.number().min(0).max(100).nullable().optional(),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const Services = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: services, isLoading } = useServices({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", category: "", default_price: 0, tax_rate: 13, is_active: true },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", description: "", category: "", default_price: 0, tax_rate: 13, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    form.reset({
      name: s.name,
      description: s.description || "",
      category: s.category || "",
      default_price: s.default_price,
      tax_rate: s.tax_rate ?? 13,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    const payload = {
      ...values,
      description: values.description || null,
      category: values.category || null,
      tax_rate: values.tax_rate ?? null,
    };
    if (editing) {
      await updateService.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createService.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteService.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    setDialogOpen(false);
  };

  const isSaving = createService.isPending || updateService.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Service Catalog</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your reusable products and services.</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? "default" : "outline"}
                className="rounded-full text-xs"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-warm"><CardContent className="p-4 h-16 animate-pulse bg-muted/30" /></Card>
            ))}
          </div>
        ) : !services?.length ? (
          <Card className="shadow-warm">
            <CardContent className="p-12 flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No services found</p>
              <p className="text-xs text-muted-foreground">Add your first service to get started.</p>
              <Button size="sm" onClick={openCreate} className="gap-1.5 mt-1">
                <Plus className="h-4 w-4" /> Add Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {services.map((s) => (
              <Card
                key={s.id}
                className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
                onClick={() => openEdit(s)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{s.name}</p>
                      <Badge
                        className={s.is_active ? "bg-status-success text-status-success-foreground" : "bg-status-neutral text-status-neutral-foreground"}
                        variant="secondary"
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.category || "Uncategorized"}{s.tax_rate != null ? ` · Tax ${s.tax_rate}%` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <span className="text-sm font-medium">${Number(s.default_price).toFixed(2)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service" : "New Service"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the service details below." : "Fill in the details to create a new service."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Lawn Mowing" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Optional description" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input placeholder="e.g. Landscaping" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="default_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Price ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
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
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">Active</FormLabel>
                    <p className="text-xs text-muted-foreground">Available for use in quotes and invoices</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <DialogFooter className="flex-row gap-2 sm:justify-between">
                {editing && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); setDeleteTarget(editing); }}
                  >
                    Delete
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : editing ? "Save Changes" : "Create Service"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
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

export default Services;
