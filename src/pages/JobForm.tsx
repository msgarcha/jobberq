import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSelector } from "@/components/ClientSelector";
import { AssigneeSelect } from "@/components/AssigneeSelect";
import { ArrowLeft, Save } from "lucide-react";
import { useJob, useCreateJob, useUpdateJob, useNextJobNumber, useIncrementJobNumber } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const prefillClient = searchParams.get("client");

  const { data: existingJob, isLoading: loadingJob } = useJob(isEdit ? id : undefined);
  const { data: nextNum } = useNextJobNumber();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const incrementNum = useIncrementJobNumber();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(user?.id || null);
  const [address, setAddress] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title || "");
      setDescription(existingJob.description || "");
      setClientId(existingJob.client_id);
      setAssignedTo((existingJob as any).assigned_to ?? null);
      setAddress(existingJob.address || "");
      setScheduledStart(existingJob.scheduled_start ? existingJob.scheduled_start.slice(0, 16) : "");
      setScheduledEnd(existingJob.scheduled_end ? existingJob.scheduled_end.slice(0, 16) : "");
      setInternalNotes(existingJob.internal_notes || "");
    }
  }, [existingJob]);

  // Prefill client when creating from a client page (?client=<id>)
  useEffect(() => {
    if (!isEdit && prefillClient) setClientId(prefillClient);
  }, [isEdit, prefillClient]);



  const handleSave = async () => {
    if (!title.trim()) return;

    if (isEdit) {
      await updateJob.mutateAsync({
        id: id!,
        title,
        description: description || null,
        client_id: clientId,
        assigned_to: assignedTo,
        address: address || null,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        internal_notes: internalNotes || null,
      } as any);
      navigate(`/jobs/${id}`);
    } else {
      const jobNumber = nextNum?.formatted || `J-${Date.now()}`;
      const result = await createJob.mutateAsync({
        title,
        description: description || null,
        client_id: clientId,
        assigned_to: assignedTo,
        address: address || null,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        internal_notes: internalNotes || null,
        job_number: jobNumber,
      } as any);
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
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto md:mx-0">
        <PageHeader
          onBack={() => navigate(isEdit ? `/jobs/${id}` : "/jobs")}
          title={isEdit ? "Edit Job" : "New Job"}
          description={!isEdit && nextNum ? nextNum.formatted : undefined}
        />

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-base">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Lawn Maintenance" className="h-11 rounded-lg md:h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <ClientSelector value={clientId} onChange={setClientId} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <AssigneeSelect value={assignedTo} onChange={setAssignedTo} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job description…" rows={3} className="rounded-lg resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Job site address" className="h-11 rounded-lg md:h-10" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle className="text-base">Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="h-11 rounded-lg text-left [&::-webkit-date-and-time-value]:text-left md:h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="h-11 rounded-lg text-left [&::-webkit-date-and-time-value]:text-left md:h-10"
                />
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

        {/* Form actions */}
        <div className="flex flex-col md:flex-row md:justify-end gap-3 pt-4 pb-2">

          <Button variant="outline" onClick={() => navigate(isEdit ? `/jobs/${id}` : "/jobs")} className="md:w-auto">Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || createJob.isPending || updateJob.isPending} className="gap-1.5 md:w-auto">
            <Save className="h-4 w-4" />
            {isEdit ? "Update Job" : "Create Job"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobForm;
