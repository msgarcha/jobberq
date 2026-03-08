import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Receipt, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  viewed: "bg-status-warning text-status-warning-foreground",
  paid: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
};

const filters = ["Active", "Draft", "Sent", "Overdue", "Paid", "All"];

const Invoices = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Active");
  const debouncedSearch = useDebouncedValue(search, 300);

  // "Active" means all non-paid, non-draft
  const statusFilter = activeFilter === "All"
    ? undefined
    : activeFilter === "Active"
      ? undefined // we'll filter client-side
      : activeFilter.toLowerCase();

  const { data: invoices, isLoading } = useInvoices({
    search: debouncedSearch,
    status: statusFilter,
  });

  // Client-side filter for "Active" = exclude paid
  const filteredInvoices = activeFilter === "Active"
    ? invoices?.filter((inv: any) => inv.status !== "paid")
    : invoices;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">{filteredInvoices?.length ?? 0} invoices</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm hidden md:inline-flex" onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices…"
              className="pl-10 rounded-lg bg-secondary/60 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
            {filters.map((f) => (
              <Button
                key={f}
                variant={activeFilter === f ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs px-4 shrink-0"
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        ) : !filteredInvoices || filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredInvoices.map((inv: any) => {
              const clientName = inv.clients
                ? `${inv.clients.first_name} ${inv.clients.last_name}${inv.clients.company_name ? ` · ${inv.clients.company_name}` : ""}`
                : "No client";
              return (
                <Card
                  key={inv.id}
                  className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{inv.invoice_number}</p>
                        <Badge className={`${statusStyles[inv.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                          {inv.status}
                        </Badge>
                        {inv.is_recurring && (
                          <RefreshCw className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {clientName} {inv.due_date && `· Due ${inv.due_date}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="text-sm font-medium">${Number(inv.total).toLocaleString()}</span>
                        {inv.status !== "paid" && Number(inv.balance_due) !== Number(inv.total) && (
                          <p className="text-[10px] text-muted-foreground">Due: ${Number(inv.balance_due).toLocaleString()}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
