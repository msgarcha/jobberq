import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, User, CheckCircle2, XCircle, Mail, Phone, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLead, useUpdateLeadStatus } from "@/hooks/useLeads";

const statusColors: Record<string, string> = {
  new: "bg-status-info text-status-info-foreground",
  quoted: "bg-status-warning text-status-warning-foreground",
  won: "bg-status-success text-status-success-foreground",
  lost: "bg-muted text-muted-foreground",
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id);
  const update = useUpdateLeadStatus();

  if (isLoading) {
    return <DashboardLayout><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardLayout>;
  }
  if (!lead) {
    return <DashboardLayout><div className="p-8 text-sm text-muted-foreground">Lead not found.</div></DashboardLayout>;
  }

  const name = `${lead.contact?.first_name || ""} ${lead.contact?.last_name || ""}`.trim() || "—";
  const services: any[] = Array.isArray(lead.selected_services) ? lead.selected_services : [];
  const answers: any[] = Array.isArray(lead.answers) ? lead.answers : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
          </Button>
          <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {new Date(lead.created_at).toLocaleString()} · {lead.form?.title || "Pricing form"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Selected services</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {services.length === 0 && <p className="text-sm text-muted-foreground">No services recorded.</p>}
              {services.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{s.display_name || s.service_id} × {s.quantity ?? 1}</span>
                </div>
              ))}
              {answers.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <p className="text-xs font-medium uppercase text-muted-foreground">Answers</p>
                  {answers.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{a.label || a.question_id}</span>
                      <span>{Array.isArray(a.value) ? a.value.join(", ") : String(a.value ?? "")}</span>
                    </div>
                  ))}
                </>
              )}
              <Separator className="my-3" />
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">${Number(lead.computed_subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax</span><span className="tabular-nums">${Number(lead.computed_tax).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">${Number(lead.computed_total).toFixed(2)}</span></div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{name}</div>
                {lead.contact?.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{lead.contact.email}</div>}
                {lead.contact?.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{lead.contact.phone}</div>}
                {lead.contact?.address_line1 && (
                  <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{lead.contact.address_line1}{lead.contact.city ? `, ${lead.contact.city}` : ""}{lead.contact.state ? `, ${lead.contact.state}` : ""}{lead.contact.zip ? ` ${lead.contact.zip}` : ""}</span>
                  </div>
                )}
                {lead.client_id && (
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to={`/clients/${lead.client_id}`}>Open client record</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Quote</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {lead.quote ? (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Number</span><span className="font-medium">{lead.quote.quote_number}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{lead.quote.status}</Badge></div>
                    <Button asChild className="w-full">
                      <Link to={`/quotes/${lead.quote.id}`}><FileText className="h-4 w-4 mr-1.5" />Open quote</Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No quote linked.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Update status</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => update.mutate({ id: lead.id, status: "new" })}>New</Button>
                <Button variant="outline" size="sm" onClick={() => update.mutate({ id: lead.id, status: "quoted" })}>Quoted</Button>
                <Button variant="outline" size="sm" onClick={() => update.mutate({ id: lead.id, status: "won" })}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Won
                </Button>
                <Button variant="outline" size="sm" onClick={() => update.mutate({ id: lead.id, status: "lost" })}>
                  <XCircle className="h-4 w-4 mr-1" /> Lost
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
