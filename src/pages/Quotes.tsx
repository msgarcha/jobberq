import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: quotes, isLoading } = useQuotes({
    search: debouncedSearch,
    status: activeFilter === "All" ? undefined : activeFilter.toLowerCase(),
  });

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground text-sm mt-1">{quotes?.length ?? 0} quotes</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm hidden md:inline-flex" onClick={() => navigate("/quotes/new")}>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quotes…"
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
        ) : !quotes || quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No quotes found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.map((q: any) => {
              const clientName = q.clients
                ? `${q.clients.first_name} ${q.clients.last_name}${q.clients.company_name ? ` · ${q.clients.company_name}` : ""}`
                : "No client";
              return (
                <Card
                  key={q.id}
                  className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/quotes/${q.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{q.quote_number}</p>
                        <Badge className={`${statusStyles[q.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                          {q.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {clientName} {q.title && `· ${q.title}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <span className="text-sm font-medium">${Number(q.total).toLocaleString()}</span>
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

export default Quotes;
