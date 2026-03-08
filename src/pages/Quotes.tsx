import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockQuotes = [
  { id: "Q-287", client: "Johnson Landscaping", total: 3200, status: "sent", date: "Jan 15, 2024" },
  { id: "Q-286", client: "Smith Residence", total: 1850, status: "approved", date: "Jan 14, 2024" },
  { id: "Q-285", client: "Acme Corp", total: 12400, status: "draft", date: "Jan 13, 2024" },
  { id: "Q-284", client: "Green Valley HOA", total: 8900, status: "converted", date: "Jan 10, 2024" },
  { id: "Q-283", client: "Metro Properties", total: 5600, status: "expired", date: "Jan 5, 2024" },
];

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  approved: "bg-status-success text-status-success-foreground",
  converted: "bg-primary text-primary-foreground",
  expired: "bg-status-danger text-status-danger-foreground",
};

const filters = ["All", "Draft", "Sent", "Approved"];

const Quotes = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockQuotes.length} quotes</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/quotes/new")}>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search quotes…" className="pl-10 rounded-lg bg-secondary/60 border-none" />
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
          {mockQuotes.map((q) => (
            <Card key={q.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{q.id}</p>
                    <Badge className={`${statusStyles[q.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                      {q.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.client} · {q.date}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <span className="text-sm font-medium">${q.total.toLocaleString()}</span>
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

export default Quotes;
