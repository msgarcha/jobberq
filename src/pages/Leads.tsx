import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useLeads, useLeadCounts, type LeadStatus } from "@/hooks/useLeads";

const statusColors: Record<string, string> = {
  new: "bg-status-info text-status-info-foreground",
  quoted: "bg-status-warning text-status-warning-foreground",
  won: "bg-status-success text-status-success-foreground",
  lost: "bg-muted text-muted-foreground",
};

export default function Leads() {
  const [tab, setTab] = useState<LeadStatus | "all">("new");
  const { data: leads = [], isLoading } = useLeads(tab);
  const { data: counts } = useLeadCounts();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Inbox className="h-6 w-6" /> Leads
            </h1>
            <p className="text-sm text-muted-foreground">
              Submissions from your pricing forms — convert into quotes and invoices.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="new">New {counts?.new ? `(${counts.new})` : ""}</TabsTrigger>
            <TabsTrigger value="quoted">Quoted {counts?.quoted ? `(${counts.quoted})` : ""}</TabsTrigger>
            <TabsTrigger value="won">Won {counts?.won ? `(${counts.won})` : ""}</TabsTrigger>
            <TabsTrigger value="lost">Lost {counts?.lost ? `(${counts.lost})` : ""}</TabsTrigger>
            <TabsTrigger value="all">All {counts?.all ? `(${counts.all})` : ""}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">Loading…</TableCell></TableRow>
              )}
              {!isLoading && leads.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  No leads here yet. Share your pricing form to start collecting them.
                </TableCell></TableRow>
              )}
              {leads.map((l) => {
                const name = `${l.contact?.first_name || l.client?.first_name || ""} ${l.contact?.last_name || l.client?.last_name || ""}`.trim() || "—";
                const email = l.contact?.email || l.client?.email || "—";
                return (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => navigate(`/leads/${l.id}`)}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-muted-foreground">{email}</TableCell>
                    <TableCell className="text-muted-foreground">{l.form?.title || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">${Number(l.computed_total).toFixed(2)}</TableCell>
                    <TableCell><Badge className={statusColors[l.status]}>{l.status}</Badge></TableCell>
                    <TableCell><Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
