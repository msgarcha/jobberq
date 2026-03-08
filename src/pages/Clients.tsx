import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockClients = [
  { id: "1", name: "Acme Corp", company: "Acme Corporation", email: "billing@acme.com", phone: "(555) 123-4567", status: "active", outstanding: 4200 },
  { id: "2", name: "Sarah Johnson", company: "Johnson Landscaping", email: "sarah@johnsonls.com", phone: "(555) 234-5678", status: "active", outstanding: 1800 },
  { id: "3", name: "Metro Properties", company: "Metro Properties LLC", email: "accounts@metroprops.com", phone: "(555) 345-6789", status: "active", outstanding: 8600 },
  { id: "4", name: "Smith Residence", company: "", email: "john.smith@gmail.com", phone: "(555) 456-7890", status: "lead", outstanding: 0 },
  { id: "5", name: "Green Valley HOA", company: "Green Valley Community", email: "board@greenvalley.org", phone: "(555) 567-8901", status: "active", outstanding: 3400 },
];

const statusStyles: Record<string, string> = {
  active: "bg-status-success text-status-success-foreground",
  lead: "bg-status-info text-status-info-foreground",
  archived: "bg-status-neutral text-status-neutral-foreground",
};

const filters = ["All", "Active", "Leads", "Archived"];

const Clients = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockClients.length} total clients</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/clients/new")}>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clients…" className="pl-10 rounded-lg bg-secondary/60 border-none" />
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
          {mockClients.map((client) => (
            <Card
              key={client.id}
              className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{client.name}</p>
                    <Badge className={`${statusStyles[client.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                      {client.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {client.company && `${client.company} · `}{client.email}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  {client.outstanding > 0 && (
                    <span className="text-sm font-medium">${client.outstanding.toLocaleString()}</span>
                  )}
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

export default Clients;
