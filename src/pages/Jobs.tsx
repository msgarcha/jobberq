import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock } from "lucide-react";
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

const Jobs = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockJobs.length} active jobs</p>
          </div>
          <Button className="gap-1.5" onClick={() => navigate("/jobs/new")}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {mockJobs.map((job) => (
            <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">{job.title}</CardTitle>
                  <Badge className={statusStyles[job.status]} variant="secondary">
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{job.id} · {job.client}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
