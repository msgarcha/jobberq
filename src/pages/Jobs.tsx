import { useState } from "react";
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
  complete: "bg-status-success text-status-success-foreground",
  invoiced: "bg-primary text-primary-foreground",
};

const filters = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Complete", value: "complete" },
];

const Jobs = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: jobs, isLoading } = useJobs({ status: statusFilter, search });

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground text-sm mt-1">{jobs?.length ?? 0} jobs</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/jobs/new")}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs px-4"
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search jobs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        ) : !jobs?.length ? (
          <Card className="shadow-warm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No jobs found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/jobs/new")}>Create your first job</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => {
              const client = (job as any).clients;
              const clientName = client ? `${client.first_name} ${client.last_name}` : "";
              return (
                <Card
                  key={job.id}
                  className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{job.title}</p>
                        <Badge className={`${statusStyles[job.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                          {job.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.job_number}{clientName ? ` · ${clientName}` : ""}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {job.address && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>
                        )}
                        {job.scheduled_start && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(job.scheduled_start), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
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

export default Jobs;
