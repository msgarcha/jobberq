import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, ArrowRight } from "lucide-react";
import type { ImportSource } from "@/lib/columnMappings";

const sources: { id: ImportSource | 'other'; label: string; description: string; color: string }[] = [
  { id: 'jobber', label: 'Jobber', description: 'Import clients, services & jobs from Jobber CSV exports', color: 'hsl(var(--primary))' },
  { id: 'quickbooks', label: 'QuickBooks', description: 'Import customer lists from QuickBooks CSV/Excel exports', color: 'hsl(142 71% 45%)' },
  { id: 'csv', label: 'Generic CSV', description: 'Import from any CSV file — we\'ll auto-detect your columns', color: 'hsl(var(--muted-foreground))' },
];

interface Props {
  onSelect: (source: ImportSource) => void;
}

export function SourceSelector({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-semibold">Where are you importing from?</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose your source platform for the best auto-mapping experience.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {sources.map(s => (
          <Card
            key={s.id}
            className="cursor-pointer hover:shadow-warm-md transition-all group border-2 border-transparent hover:border-primary/30"
            onClick={() => onSelect(s.id === 'other' ? 'csv' : s.id)}
          >
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <FileSpreadsheet className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
