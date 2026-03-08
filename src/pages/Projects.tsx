import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Briefcase, MapPin, Clock, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  pending: "bg-status-warning text-status-warning-foreground",
  in_progress: "bg-status-info text-status-info-foreground",
  on_hold: "bg-[hsl(30,70%,55%)] text-white",
  complete: "bg-status-success text-status-success-foreground",
  invoiced: "bg-primary text-primary-foreground",
};

type FilterTab = "active" | "past" | "new";

const TABS: { label: string; value: FilterTab }[] = [
  { label: "Active", value: "active" },
  { label: "New", value: "new" },
  { label: "Past", value: "past" },
];

const Projects = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>("active");
  const [search, setSearch] = useState("");
  const { data: jobs, isLoading } = useJobs({ search });

  const filtered = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      switch (tab) {
        case "active":
          return ["pending", "in_progress", "on_hold"].includes(job.status);
        case "new":
          return job.status === "pending";
        case "past":
          return ["complete", "invoiced"].includes(job.status);
        default:
          return true;
      }
    });
  }, [jobs, tab]);

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} projects</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/jobs/new")}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1.5">
            {TABS.map((t) => (
              <Button
                key={t.value}
                variant={tab === t.value ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs px-4"
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        ) : !filtered.length ? (
          <Card className="shadow-warm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No {tab} projects found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/jobs/new")}>
                Create a new job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => {
              const client = (job as any).clients;
              const clientName = client ? `${client.first_name} ${client.last_name}` : "";
              return (
                <Card
                  key={job.id}
                  className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{job.title}</p>
                          <Badge className={`${statusStyles[job.status] || "bg-muted text-muted-foreground"} text-[10px] px-1.5 py-0 shrink-0`} variant="secondary">
                            {job.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.job_number}{clientName ? ` · ${clientName}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {job.address && (
                        <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{job.address}</span>
                      )}
                      {job.scheduled_start && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {format(new Date(job.scheduled_start), "MMM d")}
                        </span>
                      )}
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

export default Projects;
