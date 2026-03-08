import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineCard, type PipelineJob } from "./PipelineCard";
import type { PipelineStage } from "./PipelineColumn";

interface MobilePipelineStageProps {
  stage: PipelineStage;
  jobs: PipelineJob[];
  nextStage: PipelineStage | null;
  onMoveToStage: (jobId: string, newStatus: string) => void;
  isMoving?: boolean;
  defaultOpen?: boolean;
}

export function MobilePipelineStage({
  stage,
  jobs,
  nextStage,
  onMoveToStage,
  isMoving,
  defaultOpen = false,
}: MobilePipelineStageProps) {
  const [open, setOpen] = useState(defaultOpen || jobs.length > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between px-4 py-3.5 rounded-xl border border-border/50 transition-colors",
          stage.headerBg,
          open && "rounded-b-none"
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn("h-3 w-3 rounded-full", stage.color)} />
            <span className="font-semibold text-sm">{stage.label}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-background/60">
              {jobs.length}
            </Badge>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 p-3 bg-muted/20 border border-t-0 border-border/50 rounded-b-xl">
          {jobs.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground/60 py-4">No jobs in this stage</p>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
