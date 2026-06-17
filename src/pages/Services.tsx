import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Wrench, ChevronRight, Search, Package } from "lucide-react";
import { useServices, type Service } from "@/hooks/useServices";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const Services = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data: services, isLoading } = useServices({
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <PageHeader
          title="Service Catalog"
          description="Manage your reusable products and services."
          actions={
            <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/services/new")}>
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          }
        />

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
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={statusFilter === f.value ? "default" : "outline"}
                className="rounded-full text-xs shrink-0"
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
              <Button size="sm" onClick={() => navigate("/services/new")} className="gap-1.5 mt-1">
                <Plus className="h-4 w-4" /> Add Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {services.map((s: Service) => (
              <Card
                key={s.id}
                className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
                onClick={() => navigate(`/services/${s.id}/edit`)}
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
    </DashboardLayout>
  );
};

export default Services;
