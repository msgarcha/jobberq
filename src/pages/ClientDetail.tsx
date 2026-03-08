import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SendReviewDialog } from "@/components/review/SendReviewDialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Archive,
  RotateCcw,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Receipt,
  Home,
  Plus,
  StickyNote,
  Star,
} from "lucide-react";
import {
  useClient,
  useUpdateClient,
  useClientProperties,
  useClientQuotes,
  useClientInvoices,
  useCreateProperty,
} from "@/hooks/useClients";

const statusStyles: Record<string, string> = {
  active: "bg-status-success text-status-success-foreground",
  lead: "bg-status-info text-status-info-foreground",
  archived: "bg-status-neutral text-status-neutral-foreground",
};

const quoteStatusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  approved: "bg-status-success text-status-success-foreground",
  converted: "bg-primary text-primary-foreground",
  expired: "bg-status-danger text-status-danger-foreground",
};

const invoiceStatusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  viewed: "bg-status-warning text-status-warning-foreground",
  paid: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: properties } = useClientProperties(id);
  const { data: quotes } = useClientQuotes(id);
  const { data: invoices } = useClientInvoices(id);
  const updateClient = useUpdateClient();
  const createProperty = useCreateProperty();

  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: "", address_line1: "", city: "", state: "", zip: "" });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="font-display font-semibold text-lg mb-2">Client not found</h2>
          <Button variant="outline" onClick={() => navigate("/clients")}>Back to Clients</Button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${client.first_name} ${client.last_name}`;
  const address = [client.address_line1, client.city, client.state, client.zip].filter(Boolean).join(", ");

  const handleArchiveToggle = () => {
    const newStatus = client.status === "archived" ? "active" : "archived";
    updateClient.mutate({ id: client.id, status: newStatus });
  };

  const handleAddProperty = async () => {
    if (!newProperty.name.trim()) return;
    await createProperty.mutateAsync({
      client_id: client.id,
      name: newProperty.name,
      address_line1: newProperty.address_line1 || undefined,
      city: newProperty.city || undefined,
      state: newProperty.state || undefined,
      zip: newProperty.zip || undefined,
    });
    setNewProperty({ name: "", address_line1: "", city: "", state: "", zip: "" });
    setPropertyDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="rounded-lg mt-1" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-display font-bold tracking-tight">{fullName}</h1>
              <Badge className={statusStyles[client.status]} variant="secondary">{client.status}</Badge>
            </div>
            {client.company_name && (
              <p className="text-sm text-muted-foreground mt-0.5">{client.company_name}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={handleArchiveToggle}
              disabled={updateClient.isPending}
            >
              {client.status === "archived" ? (
                <><RotateCcw className="h-3.5 w-3.5" /> Restore</>
              ) : (
                <><Archive className="h-3.5 w-3.5" /> Archive</>
              )}
            </Button>
            <Button size="sm" className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate(`/clients/${id}/edit`)}>
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="rounded-lg">
            <TabsTrigger value="overview" className="rounded-md text-xs">Overview</TabsTrigger>
            <TabsTrigger value="properties" className="rounded-md text-xs">Properties ({properties?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-md text-xs">Quotes ({quotes?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-md text-xs">Invoices ({invoices?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-md text-xs">Notes</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="shadow-warm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.email && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
                    </div>
                  )}
                  {client.company_name && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{client.company_name}</span>
                    </div>
                  )}
                  {address && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{address}</span>
                    </div>
                  )}
                  {!client.email && !client.phone && !address && (
                    <p className="text-sm text-muted-foreground">No contact information.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-warm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quotes</span>
                    <span className="font-medium">{quotes?.length ?? 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoices</span>
                    <span className="font-medium">{invoices?.length ?? 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Properties</span>
                    <span className="font-medium">{properties?.length ?? 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client since</span>
                    <span className="font-medium">{new Date(client.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Properties */}
          <TabsContent value="properties" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 rounded-lg shadow-warm">
                    <Plus className="h-4 w-4" /> Add Property
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Add Property</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Property Name *</Label>
                      <Input
                        value={newProperty.name}
                        onChange={(e) => setNewProperty((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Main Office"
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Address</Label>
                      <Input
                        value={newProperty.address_line1}
                        onChange={(e) => setNewProperty((p) => ({ ...p, address_line1: e.target.value }))}
                        placeholder="123 Main St"
                        className="rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label>City</Label>
                        <Input
                          value={newProperty.city}
                          onChange={(e) => setNewProperty((p) => ({ ...p, city: e.target.value }))}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>State</Label>
                        <Input
                          value={newProperty.state}
                          onChange={(e) => setNewProperty((p) => ({ ...p, state: e.target.value }))}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>ZIP</Label>
                        <Input
                          value={newProperty.zip}
                          onChange={(e) => setNewProperty((p) => ({ ...p, zip: e.target.value }))}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" className="rounded-lg" onClick={() => setPropertyDialogOpen(false)}>Cancel</Button>
                      <Button className="rounded-lg" onClick={handleAddProperty} disabled={createProperty.isPending}>
                        {createProperty.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                        Add Property
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!properties?.length ? (
              <Card className="shadow-warm">
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Home className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No properties yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {properties.map((prop) => (
                  <Card key={prop.id} className="shadow-warm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                        <Home className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{prop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[prop.address_line1, prop.city, prop.state, prop.zip].filter(Boolean).join(", ") || "No address"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quotes */}
          <TabsContent value="quotes" className="mt-4">
            {!quotes?.length ? (
              <Card className="shadow-warm">
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No quotes for this client yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {quotes.map((q) => (
                  <Card key={q.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{q.quote_number}</p>
                          <Badge className={`${quoteStatusStyles[q.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                            {q.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{q.title || "Untitled"} · {new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-medium shrink-0">${Number(q.total).toLocaleString()}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices" className="mt-4">
            {!invoices?.length ? (
              <Card className="shadow-warm">
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No invoices for this client yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <Card key={inv.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{inv.invoice_number}</p>
                          <Badge className={`${invoiceStatusStyles[inv.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {inv.title || "Untitled"} · Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <span className="text-sm font-medium shrink-0">${Number(inv.total).toLocaleString()}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="mt-4">
            <Card className="shadow-warm">
              <CardContent className="p-5">
                {client.notes ? (
                  <div className="flex items-start gap-3">
                    <StickyNote className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <StickyNote className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No notes yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => navigate(`/clients/${id}/edit`)}
                    >
                      Add Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClientDetail;
