import { PipelineCard, type PipelineJob } from "./PipelineCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PipelineStage {
  key: string;
  label: string;
  status: string;
  color: string;
  headerBg: string;
}

interface PipelineColumnProps {
  stage: PipelineStage;
  jobs: PipelineJob[];
  nextStage: PipelineStage | null;
  onMoveToStage: (jobId: string, newStatus: string) => void;
  isMoving?: boolean;
}

export function PipelineColumn({ stage, jobs, nextStage, onMoveToStage, isMoving }: PipelineColumnProps) {
  return (
    <div className="flex flex-col min-w-0 rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      <div className={cn("px-3 py-2.5 flex items-center justify-between", stage.headerBg)}>
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
          <span className="font-medium text-sm">{stage.label}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-background/60">
          {jobs.length}
        </Badge>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-240px)] min-h-[120px]">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/60">
            No jobs
          </div>
        ) : (
          jobs.map((job) => (
            <PipelineCard
              key={job.id}
              job={job}
              nextStage={nextStage ? { label: nextStage.label, status: nextStage.status } : null}
              onMoveToStage={onMoveToStage}
              isMoving={isMoving}
            />
          ))
        )}
      </div>
    </div>
  );
}
