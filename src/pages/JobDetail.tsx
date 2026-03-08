import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Play, CheckCircle, FileText, MapPin, Clock, User, Pause, RotateCcw, Star } from "lucide-react";
import { useJob, useUpdateJob, useDeleteJob } from "@/hooks/useJobs";
import { useCreateInvoice, useNextInvoiceNumber, useIncrementInvoiceNumber } from "@/hooks/useInvoices";
import { SendReviewDialog } from "@/components/review/SendReviewDialog";
import { format } from "date-fns";

const statusStyles: Record<string, string> = {
  pending: "bg-status-warning text-status-warning-foreground",
  in_progress: "bg-status-info text-status-info-foreground",
  on_hold: "bg-[hsl(30,70%,55%)] text-white",
  complete: "bg-status-success text-status-success-foreground",
  invoiced: "bg-primary text-primary-foreground",
};

const JobDetail = () => {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const createInvoice = useCreateInvoice();
  const { data: nextInvNum } = useNextInvoiceNumber();
  const incrementInvNum = useIncrementInvoiceNumber();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Job not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/jobs")}>Back to Jobs</Button>
        </div>
      </DashboardLayout>
    );
  }

  const client = (job as any).clients;

  const handleStart = async () => {
    await updateJob.mutateAsync({
      id: job.id,
      status: "in_progress",
      scheduled_start: job.scheduled_start || new Date().toISOString(),
    });
  };

  const handleComplete = async () => {
    await updateJob.mutateAsync({
      id: job.id,
      status: "complete",
      completed_at: new Date().toISOString(),
    });
  };

  const handlePause = async () => {
    await updateJob.mutateAsync({ id: job.id, status: "on_hold" as any });
  };

  const handleResume = async () => {
    await updateJob.mutateAsync({ id: job.id, status: "in_progress" as any });
  };

  const handleCreateInvoice = async () => {
    const invoiceNumber = nextInvNum?.formatted || `INV-${Date.now()}`;
    const result = await createInvoice.mutateAsync({
      invoice_number: invoiceNumber,
      title: job.title,
      client_id: job.client_id,
      job_id: job.id,
    });
    await incrementInvNum.mutateAsync();
    await updateJob.mutateAsync({ id: job.id, status: "invoiced" });
    navigate(`/invoices/${result.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job?")) return;
    await deleteJob.mutateAsync(job.id);
    navigate("/jobs");
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold tracking-tight">{job.title}</h1>
                <Badge className={`${statusStyles[job.status]} text-xs`} variant="secondary">
                  {job.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{job.job_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/jobs/${id}/edit`)}>
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>

        {/* Status Actions */}
        <Card className="shadow-warm">
          <CardContent className="p-4 flex gap-2">
            {job.status === "pending" && (
              <Button onClick={handleStart} className="gap-1.5" disabled={updateJob.isPending}>
                <Play className="h-4 w-4" /> Start Job
              </Button>
            )}
            {job.status === "in_progress" && (
              <>
                <Button onClick={handleComplete} className="gap-1.5" disabled={updateJob.isPending}>
                  <CheckCircle className="h-4 w-4" /> Mark Complete
                </Button>
                <Button variant="outline" onClick={handlePause} className="gap-1.5" disabled={updateJob.isPending}>
                  <Pause className="h-4 w-4" /> Put On Hold
                </Button>
              </>
            )}
            {job.status === "on_hold" && (
              <Button onClick={handleResume} className="gap-1.5" disabled={updateJob.isPending}>
                <RotateCcw className="h-4 w-4" /> Resume Job
              </Button>
            )}
            {job.status === "complete" && (
              <Button onClick={handleCreateInvoice} className="gap-1.5" disabled={createInvoice.isPending}>
                <FileText className="h-4 w-4" /> Create Invoice
              </Button>
            )}
            {job.status === "invoiced" && (
              <p className="text-sm text-muted-foreground py-2">This job has been invoiced.</p>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{client.first_name} {client.last_name}{client.company_name ? ` · ${client.company_name}` : ""}</span>
              </div>
            )}
            {job.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{job.address}</span>
              </div>
            )}
            {job.scheduled_start && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(job.scheduled_start), "MMM d, yyyy h:mm a")}
                  {job.scheduled_end && ` – ${format(new Date(job.scheduled_end), "h:mm a")}`}
                </span>
              </div>
            )}
            {job.description && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p>{job.description}</p>
              </div>
            )}
            {job.internal_notes && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs mb-1">Internal Notes</p>
                <p>{job.internal_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default JobDetail;
