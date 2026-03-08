import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { ColumnMapping, FieldDef } from "@/lib/columnMappings";

interface Props {
  mappings: ColumnMapping[];
  fields: FieldDef[];
  sampleRow: string[];
  onUpdateMapping: (index: number, field: string | null) => void;
}

export function ColumnMapper({ mappings, fields, sampleRow, onUpdateMapping }: Props) {
  const usedFields = new Set(mappings.map(m => m.mappedField).filter(Boolean));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-semibold">Map your columns</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We auto-detected some columns. Review and adjust the mapping below.
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {mappings.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.csvHeader}</p>
              <p className="text-xs text-muted-foreground truncate">
                e.g. "{sampleRow[m.csvIndex] || '—'}"
              </p>
            </div>
            <div className="shrink-0">
              {m.autoMapped && m.mappedField && (
                <Badge variant="secondary" className="text-[10px] gap-1 mr-2">
                  <CheckCircle2 className="h-3 w-3" /> Auto
                </Badge>
              )}
            </div>
            <Select
              value={m.mappedField || '_skip'}
              onValueChange={(v) => onUpdateMapping(i, v === '_skip' ? null : v)}
            >
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_skip">
                  <span className="text-muted-foreground">Skip this column</span>
                </SelectItem>
                {fields.map(f => (
                  <SelectItem
                    key={f.key}
                    value={f.key}
                    disabled={usedFields.has(f.key) && m.mappedField !== f.key}
                  >
                    {f.label} {f.required && '*'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Show unmapped required fields */}
      {fields.filter(f => f.required && !usedFields.has(f.key)).length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Required fields not mapped:</p>
            <p className="text-xs mt-0.5">
              {fields.filter(f => f.required && !usedFields.has(f.key)).map(f => f.label).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
