import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  imported: number;
  skipped: number;
  errors: string[];
  dataType: string;
  onReset: () => void;
}

export function ImportSummary({ imported, skipped, errors, dataType, onReset }: Props) {
  const navigate = useNavigate();
  const total = imported + skipped + errors.length;

  return (
    <div className="space-y-6 text-center py-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-xl font-display font-bold">Import Complete</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Processed {total} {dataType} records
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{imported}</p>
          <p className="text-[10px] text-muted-foreground">Imported</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{skipped}</p>
          <p className="text-[10px] text-muted-foreground">Skipped</p>
        </div>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-red-700 dark:text-red-400">{errors.length}</p>
          <p className="text-[10px] text-muted-foreground">Errors</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="max-w-md mx-auto text-left p-3 rounded-lg bg-destructive/10 text-xs space-y-1 max-h-32 overflow-y-auto">
          {errors.slice(0, 10).map((err, i) => (
            <p key={i} className="text-destructive">{err}</p>
          ))}
          {errors.length > 10 && <p className="text-muted-foreground">...and {errors.length - 10} more</p>}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onReset}>Import More</Button>
        <Button onClick={() => navigate(dataType === 'clients' ? '/clients' : dataType === 'jobs' ? '/jobs' : '/services')}>
          View {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
        </Button>
      </div>
    </div>
  );
}
