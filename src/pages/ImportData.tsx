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

/** Parse Jobber date formats: "DD/MM/YYYY" or "YYYY-MM-DD" or "MM/DD/YYYY" */
function parseJobberDate(raw: string): string | null {
  if (!raw || raw === '-') return null;
  // Try DD/MM/YYYY (Jobber's format)
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
  }
  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  // "Mar 03, 2026" format
  const mdy = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (mdy) {
    const [, monthName, day, year] = mdy;
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const m = months[monthName.toLowerCase().slice(0, 3)];
    if (m) return `${year}-${m}-${day.padStart(2, '0')}T00:00:00Z`;
  }
  return null;
}

/** Parse Jobber date to just YYYY-MM-DD for date columns */
function parseJobberDateOnly(raw: string): string | null {
  const full = parseJobberDate(raw);
  return full ? full.slice(0, 10) : null;
}

/** Map Jobber invoice status to our enum */
function mapInvoiceStatus(raw: string): 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' {
  switch (raw?.toLowerCase()?.trim()) {
    case 'paid': return 'paid';
    case 'awaiting payment': return 'sent';
    case 'past due': return 'overdue';
    case 'bad debt': return 'overdue';
    case 'draft': return 'draft';
    default: return 'draft';
  }
}

/** Parse Jobber line items string like "Item A (1, $500), Item B (2, $100)" */
function parseLineItems(raw: string, taxRate: number): Array<{ description: string; quantity: number; unit_price: number; tax_rate: number; line_total: number }> {
  if (!raw || raw === '-') return [];
  const items: Array<{ description: string; quantity: number; unit_price: number; tax_rate: number; line_total: number }> = [];
  
  // Split by pattern: description (qty, $price)
  // We need to be careful because descriptions can contain commas
  const regex = /([^,]+?)\s*\((\d+),\s*\$([0-9,.]+)\)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const description = match[1].trim().replace(/^,\s*/, '');
    const quantity = parseInt(match[2], 10) || 1;
    const unit_price = parseFloat(match[3].replace(/,/g, '')) || 0;
    const line_total = quantity * unit_price;
    items.push({ description, quantity, unit_price, tax_rate: taxRate, line_total });
  }
  
  // If regex didn't match anything, treat whole string as one item
  if (items.length === 0 && raw.trim()) {
    items.push({ description: raw.trim(), quantity: 1, unit_price: 0, tax_rate: taxRate, line_total: 0 });
  }
  
  return items;
}

/** Extract tax rate from Jobber tax string like "GST (5.0%)" or "HST (13.0%)" */
function extractTaxRate(raw: string): number {
  if (!raw || raw === '-') return 0;
  const m = raw.match(/\((\d+\.?\d*)%\)/);
  return m ? parseFloat(m[1]) : 0;
}

interface MergedClient {
  record: Record<string, string>;
  properties: Array<{
    name: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  }>;
}

/** Merge CSV rows by client identity (first+last+email) — same client with multiple properties */
function mergeClientRows(records: Record<string, string>[]): MergedClient[] {
  const map = new Map<string, MergedClient>();

  for (const rec of records) {
    const key = `${(rec.first_name || '').toLowerCase()}|${(rec.last_name || '').toLowerCase()}|${(rec.email || '').toLowerCase()}`;
    
    const prop = extractProperty(rec);
    
    if (map.has(key)) {
      const existing = map.get(key)!;
      // Add property if it has data
      if (prop) existing.properties.push(prop);
      // Merge missing fields from later rows
      for (const [k, v] of Object.entries(rec)) {
        if (!k.startsWith('_prop_') && !existing.record[k] && v) {
          existing.record[k] = v;
        }
      }
    } else {
      map.set(key, {
        record: { ...rec },
        properties: prop ? [prop] : [],
      });
    }
  }

  return Array.from(map.values());
}

function extractProperty(rec: Record<string, string>) {
  const name = rec['_prop_name'];
  const street1 = rec['_prop_street1'];
  if (!name && !street1) return null;
  return {
    name: name || 'Service Property',
    address_line1: street1 || undefined,
    address_line2: rec['_prop_street2'] || undefined,
    city: rec['_prop_city'] || undefined,
    state: rec['_prop_state'] || undefined,
    country: rec['_prop_country'] || undefined,
    zip: rec['_prop_zip'] || undefined,
  };
}

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

    // Check duplicate invoices by invoice_number
    if (dataType === 'invoices') {
      try {
        const { data: existing } = await supabase
          .from('invoices')
          .select('invoice_number')
          .eq('team_id', team.teamId!)
          .limit(5000);
        if (existing) {
          const existingNums = new Set(existing.map(i => i.invoice_number));
          const dups = new Set<number>();
          valid.forEach((r, i) => {
            if (existingNums.has(r.invoice_number)) dups.add(i);
          });
          setDuplicates(dups);
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

    if (dataType === 'clients') {
      // Merge duplicate rows within the CSV (same client, different properties)
      const merged = mergeClientRows(toImport);

      for (let i = 0; i < merged.length; i += batchSize) {
        const batch = merged.slice(i, i + batchSize);
        const rows = batch.map(m => {
          const r = m.record;
          const isArchived = r['_archived']?.toLowerCase() === 'true' || r['_archived'] === 'Yes';
          const parsedDate = parseJobberDate(r.created_date);
          return {
            first_name: r.first_name,
            last_name: r.last_name,
            title: r.title || null,
            company_name: r.company_name || null,
            email: r.email || null,
            phone: r.phone || null,
            address_line1: r.address_line1 || null,
            address_line2: r.address_line2 || null,
            city: r.city || null,
            state: r.state || null,
            zip: r.zip || null,
            country: r.country || 'Canada',
            notes: r.notes || null,
            tags: r.tags ? r.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
            status: (isArchived ? 'archived' : (['lead', 'active', 'archived'].includes(r.status?.toLowerCase()) ? r.status.toLowerCase() : 'active')) as 'lead' | 'active' | 'archived',
            lead_source: r.lead_source || null,
            ...(parsedDate ? { created_at: parsedDate } : {}),
            user_id: user.id,
            team_id: team.teamId,
          };
        });

        const { data, error } = await supabase.from('clients').insert(rows).select('id');
        if (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          imported += data.length;

          // Create properties for each client
          const propertyRows: any[] = [];
          data.forEach((client, idx) => {
            const m = batch[idx];
            for (const prop of m.properties) {
              propertyRows.push({
                client_id: client.id,
                name: prop.name,
                address_line1: prop.address_line1 || null,
                address_line2: prop.address_line2 || null,
                city: prop.city || null,
                state: prop.state || null,
                country: prop.country || 'Canada',
                zip: prop.zip || null,
                user_id: user.id,
                team_id: team.teamId,
              });
            }
          });

          if (propertyRows.length > 0) {
            const { error: propError } = await supabase.from('properties').insert(propertyRows);
            if (propError) errors.push(`Properties: ${propError.message}`);
          }
        }
      }
    } else if (dataType === 'services') {
      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
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
      }
    } else if (dataType === 'jobs') {
      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
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
    } else if (dataType === 'invoices') {
      // Step 1: Fetch existing clients for matching
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id, email, first_name, last_name, phone, company_name')
        .eq('team_id', team.teamId!)
        .limit(5000);
      const clients = existingClients || [];

      // Step 2: Check existing invoice numbers to skip duplicates
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('team_id', team.teamId!)
        .limit(5000);
      const existingInvNumbers = new Set((existingInvoices || []).map(i => i.invoice_number));

      // Build client lookup maps
      const clientByEmail = new Map<string, string>();
      const clientByName = new Map<string, string>();
      for (const c of clients) {
        if (c.email) clientByEmail.set(c.email.toLowerCase(), c.id);
        clientByName.set(`${c.first_name.toLowerCase()}|${c.last_name.toLowerCase()}`, c.id);
        if (c.company_name) clientByName.set(c.company_name.toLowerCase(), c.id);
      }

      // Helper to find or create client
      const findOrCreateClient = async (rec: Record<string, string>): Promise<string | null> => {
        const email = rec.client_email?.toLowerCase();
        if (email && clientByEmail.has(email)) return clientByEmail.get(email)!;
        
        // Try matching by name (Jobber "Client name" may be "Company Name" or "Mr. First Last")
        const clientName = rec.client_name || '';
        // Remove title prefixes
        const cleanName = clientName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '').trim();
        const nameParts = cleanName.split(/\s+/);
        
        // Try company name match
        if (clientByName.has(cleanName.toLowerCase())) return clientByName.get(cleanName.toLowerCase())!;
        
        // Try first+last name match
        if (nameParts.length >= 2) {
          const first = nameParts[0].toLowerCase();
          const last = nameParts.slice(1).join(' ').toLowerCase();
          const key = `${first}|${last}`;
          if (clientByName.has(key)) return clientByName.get(key)!;
        }

        // Auto-create client
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const { data: newClient, error } = await supabase.from('clients').insert({
          first_name: firstName,
          last_name: lastName || 'Client',
          email: rec.client_email || null,
          phone: rec.client_phone || null,
          company_name: nameParts.length === 1 ? cleanName : null,
          address_line1: rec.billing_street || null,
          city: rec.billing_city || null,
          state: rec.billing_province || null,
          zip: rec.billing_zip || null,
          country: 'Canada',
          lead_source: rec.lead_source || null,
          status: 'active' as const,
          user_id: user.id,
          team_id: team.teamId,
        }).select('id').single();
        
        if (error || !newClient) return null;
        
        // Cache the new client
        if (email) clientByEmail.set(email, newClient.id);
        clientByName.set(`${firstName.toLowerCase()}|${(lastName || 'client').toLowerCase()}`, newClient.id);
        if (nameParts.length === 1) clientByName.set(cleanName.toLowerCase(), newClient.id);
        
        return newClient.id;
      };

      let maxInvoiceNumber = 0;

      // Process invoices one at a time to handle client creation properly
      for (const rec of toImport) {
        const invNum = rec.invoice_number;
        if (!invNum || existingInvNumbers.has(invNum)) {
          continue; // Skip duplicates
        }

        const clientId = await findOrCreateClient(rec);
        const taxRate = extractTaxRate(rec.tax_percent);
        const status = mapInvoiceStatus(rec.status);
        const subtotal = parseFloat(rec.subtotal) || 0;
        const total = parseFloat(rec.total) || 0;
        const balanceDue = parseFloat(rec.balance_due) || 0;
        const taxAmount = parseFloat(rec.tax_amount) || 0;
        const discountAmount = parseFloat(rec.discount_amount) || 0;
        const deposit = parseFloat(rec.deposit) || 0;
        const amountPaid = total - balanceDue;

        const createdDate = parseJobberDate(rec.created_date);
        const issuedDate = parseJobberDate(rec.issued_date);
        const dueDate = parseJobberDateOnly(rec.due_date);
        const paidDate = parseJobberDate(rec.paid_date);
        const viewedDate = parseJobberDate(rec.viewed_date);

        // Build internal notes with deposit info
        let internalNotes = '';
        if (deposit > 0) internalNotes += `Deposit: $${deposit}`;
        if (rec.tip && parseFloat(rec.tip) > 0) internalNotes += `${internalNotes ? ', ' : ''}Tip: $${rec.tip}`;
        if (rec.job_numbers && rec.job_numbers !== '-' && rec.job_numbers.trim()) internalNotes += `${internalNotes ? ', ' : ''}Jobber Job #s: ${rec.job_numbers}`;

        // Extract numeric part for tracking max
        const numPart = parseInt(invNum.replace(/\D/g, ''), 10);
        if (!isNaN(numPart) && numPart > maxInvoiceNumber) maxInvoiceNumber = numPart;

        const { data: invoice, error: invError } = await supabase.from('invoices').insert({
          invoice_number: invNum,
          client_id: clientId,
          title: rec.title || null,
          status,
          subtotal,
          total,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          amount_paid: amountPaid,
          balance_due: balanceDue,
          due_date: dueDate,
          sent_at: issuedDate,
          paid_at: paidDate,
          viewed_at: viewedDate,
          internal_notes: internalNotes || null,
          payment_terms: null,
          ...(createdDate ? { created_at: createdDate } : {}),
          user_id: user.id,
          team_id: team.teamId,
        }).select('id').single();

        if (invError) {
          errors.push(`Invoice ${invNum}: ${invError.message}`);
          continue;
        }

        imported++;
        existingInvNumbers.add(invNum);

        // Parse and insert line items
        const lineItems = parseLineItems(rec.line_items_raw, taxRate);
        if (lineItems.length > 0 && invoice) {
          const lineRows = lineItems.map((item, idx) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            line_total: item.line_total,
            sort_order: idx,
            user_id: user.id,
            team_id: team.teamId,
          }));
          const { error: lineError } = await supabase.from('invoice_line_items').insert(lineRows);
          if (lineError) errors.push(`Line items for ${invNum}: ${lineError.message}`);
        }
      }

      // Update next_invoice_number in company_settings
      if (maxInvoiceNumber > 0) {
        const { data: settings } = await supabase
          .from('company_settings')
          .select('id, next_invoice_number')
          .eq('team_id', team.teamId!)
          .maybeSingle();
        if (settings && (settings.next_invoice_number || 0) <= maxInvoiceNumber) {
          await supabase.from('company_settings')
            .update({ next_invoice_number: maxInvoiceNumber + 1 })
            .eq('id', settings.id);
        }
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
