import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export interface PipelineJob {
  id: string;
  title: string;
  job_number: string;
  status: string;
  address?: string | null;
  scheduled_start?: string | null;
  clients?: { first_name: string; last_name: string; company_name?: string | null } | null;
}

interface PipelineCardProps {
  job: PipelineJob;
  nextStage?: { label: string; status: string } | null;
  onMoveToStage: (jobId: string, newStatus: string) => void;
  isMoving?: boolean;
}

export function PipelineCard({ job, nextStage, onMoveToStage, isMoving }: PipelineCardProps) {
  const navigate = useNavigate();
  const client = job.clients;
  const clientName = client ? `${client.first_name} ${client.last_name}` : null;

  return (
    <Card
      className="shadow-sm hover:shadow-md transition-all cursor-pointer group border-border/60"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{job.title}</p>
            <p className="text-[11px] text-muted-foreground">{job.job_number}</p>
          </div>
        </div>

        {clientName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{clientName}</span>
          </div>
        )}

        {job.address && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>
        )}

        {job.scheduled_start && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{format(new Date(job.scheduled_start), "MMM d, yyyy")}</span>
          </div>
        )}

        {nextStage && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-1 mt-1"
            disabled={isMoving}
            onClick={(e) => {
              e.stopPropagation();
              onMoveToStage(job.id, nextStage.status);
            }}
          >
            Move to {nextStage.label}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
