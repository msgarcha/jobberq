import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const statusStyles: Record<string, string> = {
  active: "bg-status-success text-status-success-foreground",
  lead: "bg-status-info text-status-info-foreground",
  archived: "bg-status-neutral text-status-neutral-foreground",
};

const filters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Leads", value: "lead" },
  { label: "Archived", value: "archived" },
];

const Clients = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: clients, isLoading } = useClients({
    search: debouncedSearch,
    status: statusFilter,
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {clients?.length ?? 0} {statusFilter === "all" ? "total" : statusFilter} clients
            </p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm hidden md:inline-flex" onClick={() => navigate("/clients/new")}>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients…"
              className="pl-10 rounded-lg bg-secondary/60 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs px-4 shrink-0"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !clients?.length ? (
          <Card className="shadow-warm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-display font-semibold text-lg mb-1">No clients yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "No clients match your search." : "Add your first client or import from another platform."}
              </p>
              {!search && (
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <Button onClick={() => navigate("/clients/new")} className="rounded-lg">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Client
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/import?source=csv")} className="rounded-lg">
                    Import from CSV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
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
                      <p className="font-medium text-sm">
                        {client.first_name} {client.last_name}
                      </p>
                      <Badge
                        className={`${statusStyles[client.status]} text-[10px] px-1.5 py-0`}
                        variant="secondary"
                      >
                        {client.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client.company_name && `${client.company_name} · `}
                      {client.email || client.phone || "No contact info"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clients;
