import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useClient, useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { useEffect } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const clientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  company_name: z.string().trim().max(200).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  status: z.enum(["lead", "active", "archived"]),
  address_line1: z.string().trim().max(200).optional(),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  zip: z.string().trim().max(20).optional(),
  country: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
});

type FormData = z.infer<typeof clientSchema>;

const emptyForm: FormData = {
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  status: "lead",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  notes: "",
};

const ClientForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: existingClient, isLoading: loadingClient } = useClient(id);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (existingClient) {
      setForm({
        first_name: existingClient.first_name,
        last_name: existingClient.last_name,
        company_name: existingClient.company_name || "",
        email: existingClient.email || "",
        phone: existingClient.phone || "",
        status: existingClient.status,
        address_line1: existingClient.address_line1 || "",
        address_line2: existingClient.address_line2 || "",
        city: existingClient.city || "",
        state: existingClient.state || "",
        zip: existingClient.zip || "",
        country: existingClient.country || "US",
        notes: existingClient.notes || "",
      });
    }
  }, [existingClient]);

  const setField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = clientSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const d = result.data;
    const cleanData = {
      first_name: d.first_name!,
      last_name: d.last_name!,
      status: d.status,
      email: d.email || null,
      company_name: d.company_name || null,
      phone: d.phone || null,
      address_line1: d.address_line1 || null,
      address_line2: d.address_line2 || null,
      city: d.city || null,
      state: d.state || null,
      zip: d.zip || null,
      country: d.country || null,
      notes: d.notes || null,
    };

    try {
      if (isEdit) {
        await updateClient.mutateAsync({ id, ...cleanData });
      } else {
        const created = await createClient.mutateAsync(cleanData);
        navigate(`/clients/${created.id}`, { replace: true });
        return;
      }
      navigate(`/clients/${id}`, { replace: true });
    } catch {
      // error handled by mutation
    }
  };

  const saving = createClient.isPending || updateClient.isPending;

  if (isEdit && loadingClient) {
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {isEdit ? "Edit Client" : "New Client"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isEdit ? "Update client information." : "Add a new client to your business."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <Card className="shadow-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    className="rounded-lg"
                  />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    className="rounded-lg"
                  />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) => setField("company_name", e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className="rounded-lg"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="shadow-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={form.address_line1}
                  onChange={(e) => setField("address_line1", e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={form.address_line2}
                  onChange={(e) => setField("address_line2", e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">State / Province</Label>
                  <Input id="state" value={form.state} onChange={(e) => setField("state", e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="zip">ZIP / Postal Code</Label>
                  <Input id="zip" value={form.zip} onChange={(e) => setField("zip", e.target.value)} className="rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Internal notes about this client…"
                rows={4}
                className="rounded-lg resize-none"
              />
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg shadow-warm" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ClientForm;
