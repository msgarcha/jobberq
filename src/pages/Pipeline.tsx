import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJobs, useUpdateJob } from "@/hooks/useJobs";
import { useIsMobile } from "@/hooks/use-mobile";
import { PipelineColumn, type PipelineStage } from "@/components/pipeline/PipelineColumn";
import { MobilePipelineStage } from "@/components/pipeline/MobilePipelineStage";

const STAGES: PipelineStage[] = [
  { key: "new", label: "New", status: "pending", color: "bg-status-warning", headerBg: "bg-status-warning/10" },
  { key: "in_progress", label: "In Progress", status: "in_progress", color: "bg-status-info", headerBg: "bg-status-info/10" },
  { key: "on_hold", label: "On Hold", status: "on_hold", color: "bg-[hsl(30,70%,55%)]", headerBg: "bg-[hsl(30,70%,55%)]/10" },
  { key: "invoiced", label: "Invoice Created", status: "invoiced", color: "bg-primary", headerBg: "bg-primary/10" },
  { key: "complete", label: "Finished", status: "complete", color: "bg-status-success", headerBg: "bg-status-success/10" },
];

const Pipeline = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: jobs, isLoading } = useJobs();
  const updateJob = useUpdateJob();

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    STAGES.forEach((s) => (map[s.status] = []));
    jobs?.forEach((job) => {
      if (map[job.status]) {
        map[job.status].push(job);
      } else {
        // fallback: put unknown statuses into pending
        map["pending"]?.push(job);
      }
    });
    return map;
  }, [jobs]);

  const handleMoveToStage = async (jobId: string, newStatus: string) => {
    const extra: Record<string, any> = {};
    if (newStatus === "complete") extra.completed_at = new Date().toISOString();
    if (newStatus === "in_progress") extra.scheduled_start = new Date().toISOString();
    await updateJob.mutateAsync({ id: jobId, status: newStatus as any, ...extra });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Pipeline</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{jobs?.length ?? 0} total jobs</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm" onClick={() => navigate("/jobs/new")}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading pipeline…</div>
        ) : isMobile ? (
          /* ── Mobile: collapsible stages ── */
          <div className="space-y-2">
            {STAGES.map((stage, idx) => (
              <MobilePipelineStage
                key={stage.key}
                stage={stage}
                jobs={grouped[stage.status] || []}
                nextStage={idx < STAGES.length - 1 ? STAGES[idx + 1] : null}
                onMoveToStage={handleMoveToStage}
                isMoving={updateJob.isPending}
                defaultOpen={idx < 2}
              />
            ))}
          </div>
        ) : (
          /* ── Desktop: horizontal kanban ── */
          <div className="grid grid-cols-5 gap-3">
            {STAGES.map((stage, idx) => (
              <PipelineColumn
                key={stage.key}
                stage={stage}
                jobs={grouped[stage.status] || []}
                nextStage={idx < STAGES.length - 1 ? STAGES[idx + 1] : null}
                onMoveToStage={handleMoveToStage}
                isMoving={updateJob.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pipeline;
