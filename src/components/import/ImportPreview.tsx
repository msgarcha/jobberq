import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FieldDef } from "@/lib/columnMappings";

interface Props {
  records: Record<string, string>[];
  fields: FieldDef[];
  duplicateIndices: Set<number>;
  totalCount: number;
}

export function ImportPreview({ records, fields, duplicateIndices, totalCount }: Props) {
  const preview = records.slice(0, 5);
  const mappedFields = fields.filter(f => preview.some(r => r[f.key]));
  const dupCount = duplicateIndices.size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-semibold">Preview import</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Showing first {preview.length} of {totalCount} records.
          {dupCount > 0 && (
            <span className="text-amber-600 font-medium"> {dupCount} potential duplicate{dupCount !== 1 ? 's' : ''} detected.</span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              {mappedFields.map(f => (
                <TableHead key={f.key} className="text-xs whitespace-nowrap">{f.label}</TableHead>
              ))}
              <TableHead className="w-20">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((rec, i) => (
              <TableRow key={i} className={duplicateIndices.has(i) ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                {mappedFields.map(f => (
                  <TableCell key={f.key} className="text-xs max-w-[200px] truncate">
                    {rec[f.key] || <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                ))}
                <TableCell>
                  {duplicateIndices.has(i) ? (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Duplicate</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Ready</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
