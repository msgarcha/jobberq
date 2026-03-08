import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Receipt, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockInvoices = [
  { id: "INV-1042", client: "Acme Corp", total: 4200, status: "paid", date: "Jan 15, 2024", due: "Feb 14, 2024" },
  { id: "INV-1041", client: "Metro Properties", total: 8600, status: "overdue", date: "Jan 1, 2024", due: "Jan 31, 2024" },
  { id: "INV-1040", client: "Johnson Landscaping", total: 1800, status: "sent", date: "Jan 12, 2024", due: "Feb 11, 2024" },
  { id: "INV-1039", client: "Green Valley HOA", total: 3400, status: "draft", date: "Jan 14, 2024", due: "Feb 13, 2024" },
  { id: "INV-1038", client: "Smith Residence", total: 1850, status: "viewed", date: "Jan 10, 2024", due: "Feb 9, 2024" },
];

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  viewed: "bg-status-warning text-status-warning-foreground",
  paid: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
};

const filters = ["All", "Draft", "Sent", "Paid", "Overdue"];

const Invoices = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockInvoices.length} invoices</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices…" className="pl-10 rounded-lg bg-secondary/60 border-none" />
          </div>
          <div className="flex gap-1.5">
            {filters.map((f, i) => (
              <Button key={f} variant={i === 0 ? "default" : "outline"} size="sm" className="rounded-full text-xs px-4">
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {mockInvoices.map((inv) => (
            <Card key={inv.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{inv.id}</p>
                    <Badge className={`${statusStyles[inv.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{inv.client} · Due {inv.due}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <span className="text-sm font-medium">${inv.total.toLocaleString()}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
