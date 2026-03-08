import { useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, type ParsedCSV } from "@/lib/csvParser";
import {
  autoMapColumns, transformRow, findDuplicates, getFieldsForType,
  type ImportSource, type ImportDataType, type ColumnMapping
} from "@/lib/columnMappings";
import { SourceSelector } from "@/components/import/SourceSelector";
import { FileUploader } from "@/components/import/FileUploader";
import { ColumnMapper } from "@/components/import/ColumnMapper";
import { ImportPreview } from "@/components/import/ImportPreview";
import { ImportSummary } from "@/components/import/ImportSummary";

type Step = 'source' | 'upload' | 'map' | 'preview' | 'importing' | 'summary';

const STEP_ORDER: Step[] = ['source', 'upload', 'map', 'preview', 'importing', 'summary'];
const STEP_LABELS = ['Source', 'Upload', 'Map', 'Preview', 'Import', 'Done'];

const ImportData = () => {
  const [searchParams] = useSearchParams();
  const { user, team } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initialSource = (searchParams.get('source') as ImportSource) || null;
  const [step, setStep] = useState<Step>(initialSource ? 'upload' : 'source');
  const [source, setSource] = useState<ImportSource | null>(initialSource);
  const [dataType, setDataType] = useState<ImportDataType>('clients');
  const [csv, setCsv] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [duplicates, setDuplicates] = useState<Set<number>>(new Set());
  const [result, setResult] = useState({ imported: 0, skipped: 0, errors: [] as string[] });

  const fields = useMemo(() => getFieldsForType(dataType), [dataType]);
  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  const handleSourceSelect = (s: ImportSource) => {
    setSource(s);
    setStep('upload');
  };

  const handleFileLoaded = useCallback((_file: File, text: string) => {
    const parsed = parseCSV(text);
    setCsv(parsed);
    if (source) {
      const maps = autoMapColumns(parsed.headers, source, dataType);
      setMappings(maps);
    }
  }, [source, dataType]);

  const handleUpdateMapping = (index: number, field: string | null) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, mappedField: field, autoMapped: false } : m));
  };

  const handleProceedToPreview = async () => {
    if (!csv) return;
    const transformed = csv.rows.map(row => transformRow(row, mappings));
    // Filter out rows missing required fields
    const required = fields.filter(f => f.required).map(f => f.key);
    const valid = transformed.filter(r => required.every(k => r[k]));
    setRecords(valid);

    // Check duplicates for clients
    if (dataType === 'clients') {
      try {
        const { data: existing } = await supabase
          .from('clients')
          .select('email, first_name, last_name, phone')
          .eq('team_id', team.teamId!)
          .limit(1000);
        if (existing) {
          setDuplicates(findDuplicates(valid, existing));
        }
      } catch {
        // Proceed without duplicate detection
      }
    }
    setStep('preview');
  };

  const handleImport = async () => {
    if (!user || !team.teamId) return;
    setStep('importing');

    const toImport = records.filter((_, i) => !duplicates.has(i));
    let imported = 0;
    const errors: string[] = [];
    const batchSize = 100;

    for (let i = 0; i < toImport.length; i += batchSize) {
      const batch = toImport.slice(i, i + batchSize);

      if (dataType === 'clients') {
        const rows = batch.map(r => ({
          first_name: r.first_name,
          last_name: r.last_name,
          company_name: r.company_name || null,
          email: r.email || null,
          phone: r.phone || null,
          address_line1: r.address_line1 || null,
          address_line2: r.address_line2 || null,
          city: r.city || null,
          state: r.state || null,
          zip: r.zip || null,
          country: r.country || 'US',
          notes: r.notes || null,
          tags: r.tags ? r.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
          status: (['lead', 'active', 'archived'].includes(r.status?.toLowerCase()) ? r.status.toLowerCase() : 'active') as 'lead' | 'active' | 'archived',
          user_id: user.id,
          team_id: team.teamId,
        }));
        const { data, error } = await supabase.from('clients').insert(rows).select('id');
        if (error) errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        else imported += data.length;
      } else if (dataType === 'services') {
        const rows = batch.map(r => ({
          name: r.name,
          description: r.description || null,
          default_price: parseFloat(r.default_price) || 0,
          category: r.category || null,
          tax_rate: r.tax_rate ? parseFloat(r.tax_rate) : null,
          user_id: user.id,
          team_id: team.teamId,
        }));
        const { data, error } = await supabase.from('services_catalog').insert(rows).select('id');
        if (error) errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        else imported += data.length;
      } else if (dataType === 'jobs') {
        // For jobs, we skip client matching in this phase — just import as standalone
        const rows = batch.map(r => ({
          title: r.title,
          description: r.description || null,
          status: (['pending', 'in_progress', 'complete', 'invoiced', 'on_hold'].includes(r.status?.toLowerCase()) ? r.status.toLowerCase() : 'pending') as any,
          address: r.address || null,
          scheduled_start: r.scheduled_start || null,
          scheduled_end: r.scheduled_end || null,
          job_number: `J-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: user.id,
          team_id: team.teamId,
        }));
        const { data, error } = await supabase.from('jobs').insert(rows).select('id');
        if (error) errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        else imported += data.length;
      }
    }

    queryClient.invalidateQueries({ queryKey: [dataType] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    setResult({ imported, skipped: duplicates.size, errors });
    setStep('summary');
  };

  const handleReset = () => {
    setStep('source');
    setSource(null);
    setCsv(null);
    setMappings([]);
    setRecords([]);
    setDuplicates(new Set());
    setResult({ imported: 0, skipped: 0, errors: [] });
  };

  const canProceedFromUpload = csv && csv.rowCount > 0;
  const canProceedFromMap = fields.filter(f => f.required).every(f => mappings.some(m => m.mappedField === f.key));

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          {step !== 'source' && step !== 'summary' && step !== 'importing' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                const prev = STEP_ORDER[stepIndex - 1];
                if (prev) setStep(prev);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold tracking-tight">Import Data</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Migrate from Jobber, QuickBooks, or any CSV</p>
          </div>
        </div>

        {/* Progress indicator */}
        {step !== 'summary' && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {STEP_LABELS.map((label, i) => (
                <span key={label} className={i <= stepIndex ? 'text-primary' : ''}>{label}</span>
              ))}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <Card className="shadow-warm">
          <CardContent className="p-6">
            {step === 'source' && <SourceSelector onSelect={handleSourceSelect} />}

            {step === 'upload' && (
              <div className="space-y-5">
                <FileUploader dataType={dataType} onDataTypeChange={setDataType} onFileLoaded={handleFileLoaded} />
                <div className="flex justify-end">
                  <Button disabled={!canProceedFromUpload} onClick={() => setStep('map')} className="gap-1.5">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'map' && csv && (
              <div className="space-y-5">
                <ColumnMapper
                  mappings={mappings}
                  fields={fields}
                  sampleRow={csv.rows[0] || []}
                  onUpdateMapping={handleUpdateMapping}
                />
                <div className="flex justify-end">
                  <Button disabled={!canProceedFromMap} onClick={handleProceedToPreview} className="gap-1.5">
                    Preview <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-5">
                <ImportPreview
                  records={records}
                  fields={fields}
                  duplicateIndices={duplicates}
                  totalCount={records.length}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {records.length - duplicates.size} will be imported, {duplicates.size} duplicates skipped
                  </p>
                  <Button onClick={handleImport} className="gap-1.5">
                    Import {records.length - duplicates.size} Records
                  </Button>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="py-16 text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="font-medium">Importing your data…</p>
                <p className="text-sm text-muted-foreground">This may take a moment.</p>
              </div>
            )}

            {step === 'summary' && (
              <ImportSummary
                imported={result.imported}
                skipped={result.skipped}
                errors={result.errors}
                dataType={dataType}
                onReset={handleReset}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ImportData;
