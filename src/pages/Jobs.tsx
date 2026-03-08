import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, MapPin, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockJobs = [
  { id: "J-120", title: "Weekly Lawn Maintenance", client: "Green Valley HOA", address: "123 Oak Dr", status: "in_progress", date: "Jan 16, 2024" },
  { id: "J-119", title: "HVAC System Repair", client: "Acme Corp", address: "500 Business Blvd", status: "pending", date: "Jan 17, 2024" },
  { id: "J-118", title: "Window Cleaning - Full Building", client: "Metro Properties", address: "200 Metro Ave", status: "complete", date: "Jan 15, 2024" },
  { id: "J-117", title: "Landscape Redesign Phase 2", client: "Smith Residence", address: "42 Elm St", status: "pending", date: "Jan 18, 2024" },
];

const statusStyles: Record<string, string> = {
  pending: "bg-status-warning text-status-warning-foreground",
  in_progress: "bg-status-info text-status-info-foreground",
  complete: "bg-status-success text-status-success-foreground",
  invoiced: "bg-primary text-primary-foreground",
};

const filters = ["All", "Pending", "In Progress", "Complete"];

const Jobs = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockJobs.length} active jobs</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/jobs/new")}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        <div className="flex gap-1.5">
          {filters.map((f, i) => (
            <Button key={f} variant={i === 0 ? "default" : "outline"} size="sm" className="rounded-full text-xs px-4">
              {f}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {mockJobs.map((job) => (
            <Card key={job.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group">
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
                  <p className="text-xs text-muted-foreground mt-0.5">{job.id} · {job.client}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.date}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
