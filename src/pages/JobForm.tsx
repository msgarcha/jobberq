import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSelector } from "@/components/ClientSelector";
import { ArrowLeft, Save } from "lucide-react";
import { useJob, useCreateJob, useUpdateJob, useNextJobNumber, useIncrementJobNumber } from "@/hooks/useJobs";

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingJob, isLoading: loadingJob } = useJob(isEdit ? id : undefined);
  const { data: nextNum } = useNextJobNumber();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const incrementNum = useIncrementJobNumber();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title || "");
      setDescription(existingJob.description || "");
      setClientId(existingJob.client_id);
      setAddress(existingJob.address || "");
      setScheduledStart(existingJob.scheduled_start ? existingJob.scheduled_start.slice(0, 16) : "");
      setScheduledEnd(existingJob.scheduled_end ? existingJob.scheduled_end.slice(0, 16) : "");
      setInternalNotes(existingJob.internal_notes || "");
    }
  }, [existingJob]);

  const handleSave = async () => {
    if (!title.trim()) return;

    if (isEdit) {
      await updateJob.mutateAsync({
        id: id!,
        title,
        description: description || null,
        client_id: clientId,
        address: address || null,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        internal_notes: internalNotes || null,
      });
      navigate(`/jobs/${id}`);
    } else {
      const jobNumber = nextNum?.formatted || `J-${Date.now()}`;
      const result = await createJob.mutateAsync({
        title,
        description: description || null,
        client_id: clientId,
        address: address || null,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        internal_notes: internalNotes || null,
        job_number: jobNumber,
      });
      await incrementNum.mutateAsync();
      navigate(`/jobs/${result.id}`);
    }
  };

  if (isEdit && loadingJob) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/jobs/${id}` : "/jobs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              {isEdit ? "Edit Job" : "New Job"}
            </h1>
            {!isEdit && nextNum && (
              <p className="text-muted-foreground text-sm mt-0.5">{nextNum.formatted}</p>
            )}
          </div>
        </div>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-base">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Lawn Maintenance" />
            </div>
            <div>
              <Label>Client</Label>
              <ClientSelector value={clientId} onChange={setClientId} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job description…" rows={3} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Job site address" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-base">Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start</Label>
                <Input type="datetime-local" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="datetime-local" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-base">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Notes for your team…" rows={3} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(isEdit ? `/jobs/${id}` : "/jobs")}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || createJob.isPending || updateJob.isPending} className="gap-1.5">
            <Save className="h-4 w-4" />
            {isEdit ? "Update Job" : "Create Job"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobForm;
