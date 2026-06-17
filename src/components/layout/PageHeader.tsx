import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** String renders a styled h1; pass a node to compose a title with a badge etc. */
  title: ReactNode;
  description?: ReactNode;
  /** Action buttons rendered on the right (desktop) / below the title (mobile). */
  actions?: ReactNode;
  /** Optional back button handler shown to the left of the title. */
  onBack?: () => void;
  /** When true, actions stretch full-width on mobile (e.g. a primary "Create" button). */
  stretchActions?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  onBack,
  stretchActions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg -ml-2 shrink-0"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="min-w-0">
          {typeof title === "string" ? (
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight leading-tight break-words">
              {title}
            </h1>
          ) : (
            title
          )}
          {typeof description === "string" ? (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          ) : (
            description
          )}
        </div>
      </div>

      {actions && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 shrink-0",
            stretchActions && "w-full sm:w-auto"
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
