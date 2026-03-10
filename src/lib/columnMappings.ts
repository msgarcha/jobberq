/**
 * Smart column mapping engine for Jobber, QuickBooks, and generic CSV imports.
 */

export type ImportDataType = 'clients' | 'services' | 'jobs' | 'invoices';

export interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
}

export const CLIENT_FIELDS: FieldDef[] = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: true },
  { key: 'title', label: 'Title (Mr/Ms)' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address_line1', label: 'Address Line 1' },
  { key: 'address_line2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP' },
  { key: 'country', label: 'Country' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
  { key: 'status', label: 'Status' },
  { key: 'lead_source', label: 'Lead Source' },
  { key: 'created_date', label: 'Created Date' },
];

export const SERVICE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Service Name', required: true },
  { key: 'description', label: 'Description' },
  { key: 'default_price', label: 'Price' },
  { key: 'category', label: 'Category' },
  { key: 'tax_rate', label: 'Tax Rate' },
];

export const JOB_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Job Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'address', label: 'Address' },
  { key: 'scheduled_start', label: 'Scheduled Start' },
  { key: 'scheduled_end', label: 'Scheduled End' },
  { key: 'client_name', label: 'Client Name (for matching)' },
  { key: 'client_email', label: 'Client Email (for matching)' },
];

export const INVOICE_FIELDS: FieldDef[] = [
  { key: 'invoice_number', label: 'Invoice #', required: true },
  { key: 'client_name', label: 'Client Name' },
  { key: 'client_email', label: 'Client Email' },
  { key: 'client_phone', label: 'Client Phone' },
  { key: 'title', label: 'Subject' },
  { key: 'created_date', label: 'Created Date' },
  { key: 'issued_date', label: 'Issued Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'paid_date', label: 'Marked Paid Date' },
  { key: 'status', label: 'Status' },
  { key: 'line_items_raw', label: 'Line Items' },
  { key: 'subtotal', label: 'Pre-tax Total' },
  { key: 'total', label: 'Total' },
  { key: 'balance_due', label: 'Balance' },
  { key: 'tax_percent', label: 'Tax (%)' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'discount_amount', label: 'Discount' },
  { key: 'tax_amount', label: 'Tax Amount' },
  { key: 'tip', label: 'Tip' },
  { key: 'sent_to', label: 'Sent To' },
  { key: 'billing_street', label: 'Billing Street' },
  { key: 'billing_city', label: 'Billing City' },
  { key: 'billing_province', label: 'Billing Province' },
  { key: 'billing_zip', label: 'Billing ZIP' },
  { key: 'lead_source', label: 'Lead Source' },
  { key: 'viewed_date', label: 'Viewed in Client Hub' },
  { key: 'job_numbers', label: 'Job #s' },
  { key: 'days_to_paid', label: 'Days to Paid' },
];

export function getFieldsForType(type: ImportDataType): FieldDef[] {
  switch (type) {
    case 'clients': return CLIENT_FIELDS;
    case 'services': return SERVICE_FIELDS;
    case 'jobs': return JOB_FIELDS;
    case 'invoices': return INVOICE_FIELDS;
  }
}

// Known header → field mappings per platform
const JOBBER_CLIENT_MAP: Record<string, string> = {
  'first name': 'first_name',
  'last name': 'last_name',
  'title': 'title',
  'display name': '_full_name',
  'company': 'company_name',
  'company name': 'company_name',
  'email': 'email',
  'email address': 'email',
  'e-mails': 'email',
  'phone number': 'phone',
  'phone': 'phone',
  'main phone #s': 'phone',
  'mobile phone': 'phone',
  'mobile phone #s': 'phone',
  'home phone': 'phone',
  'home phone #s': 'phone',
  'work phone': 'phone',
  'work phone #s': 'phone',
  'street 1': 'address_line1',
  'street 2': 'address_line2',
  'street address': 'address_line1',
  'billing street 1': 'address_line1',
  'billing street 2': 'address_line2',
  'billing city': 'city',
  'billing state': 'state',
  'billing zip code': 'zip',
  'billing country': 'country',
  'city': 'city',
  'province': 'state',
  'state': 'state',
  'state/province': 'state',
  'postal code': 'zip',
  'zip code': 'zip',
  'zip': 'zip',
  'country': 'country',
  'notes': 'notes',
  'tags': 'tags',
  'status': 'status',
  'archived': '_archived',
  'created date': 'created_date',
  'lead source': 'lead_source',
  // Service property fields (prefixed for special handling)
  'service property name': '_prop_name',
  'service street 1': '_prop_street1',
  'service street 2': '_prop_street2',
  'service city': '_prop_city',
  'service state': '_prop_state',
  'service country': '_prop_country',
  'service zip code': '_prop_zip',
};

const QUICKBOOKS_CLIENT_MAP: Record<string, string> = {
  'customer': '_full_name',
  'display name': '_full_name',
  'first name': 'first_name',
  'last name': 'last_name',
  'company name': 'company_name',
  'company': 'company_name',
  'main email': 'email',
  'email': 'email',
  'main phone': 'phone',
  'phone': 'phone',
  'mobile': 'phone',
  'billing address line 1': 'address_line1',
  'billing street': 'address_line1',
  'billing address line 2': 'address_line2',
  'billing city': 'city',
  'billing state': 'state',
  'billing zip': 'zip',
  'billing postal code': 'zip',
  'billing country': 'country',
  'notes': 'notes',
};

// Generic fuzzy patterns
const GENERIC_PATTERNS: [RegExp, string][] = [
  [/^first[\s_-]?name$/i, 'first_name'],
  [/^last[\s_-]?name$/i, 'last_name'],
  [/^(company|business|organization)[\s_-]?(name)?$/i, 'company_name'],
  [/^e[\s_-]?mail/i, 'email'],
  [/^(phone|tel|mobile|cell)/i, 'phone'],
  [/^(address|street|addr)[\s_-]?(line)?[\s_-]?1?$/i, 'address_line1'],
  [/^(address|street|addr)[\s_-]?(line)?[\s_-]?2$/i, 'address_line2'],
  [/^city$/i, 'city'],
  [/^(state|province|region)$/i, 'state'],
  [/^(zip|postal|post[\s_-]?code)/i, 'zip'],
  [/^country$/i, 'country'],
  [/^(notes?|comments?|memo)$/i, 'notes'],
  [/^(tags?|labels?|categories?)$/i, 'tags'],
  [/^(status|type)$/i, 'status'],
  // Service fields
  [/^(service[\s_-]?)?name$/i, 'name'],
  [/^(desc|description)$/i, 'description'],
  [/^(price|rate|cost|amount|default[\s_-]?price)$/i, 'default_price'],
  [/^(cat|category|group)$/i, 'category'],
  [/^tax[\s_-]?(rate|%)?$/i, 'tax_rate'],
  // Job fields
  [/^(title|job[\s_-]?title|subject)$/i, 'title'],
  [/^(start|scheduled[\s_-]?start|start[\s_-]?date)$/i, 'scheduled_start'],
  [/^(end|scheduled[\s_-]?end|end[\s_-]?date)$/i, 'scheduled_end'],
  [/^(client[\s_-]?name|customer[\s_-]?name)$/i, 'client_name'],
  [/^(client[\s_-]?email|customer[\s_-]?email)$/i, 'client_email'],
];

export type ImportSource = 'jobber' | 'quickbooks' | 'csv';

export interface ColumnMapping {
  csvHeader: string;
  csvIndex: number;
  mappedField: string | null; // null = skip
  autoMapped: boolean;
}

export function autoMapColumns(
  headers: string[],
  source: ImportSource,
  dataType: ImportDataType
): ColumnMapping[] {
  const fields = getFieldsForType(dataType);
  const validKeys = new Set(fields.map(f => f.key));
  // Also allow special keys for QuickBooks/Jobber processing
  validKeys.add('_full_name');
  validKeys.add('_archived');
  validKeys.add('_prop_name');
  validKeys.add('_prop_street1');
  validKeys.add('_prop_street2');
  validKeys.add('_prop_city');
  validKeys.add('_prop_state');
  validKeys.add('_prop_country');
  validKeys.add('_prop_zip');

  const platformMap = source === 'jobber'
    ? JOBBER_CLIENT_MAP
    : source === 'quickbooks'
      ? QUICKBOOKS_CLIENT_MAP
      : {};

  const usedFields = new Set<string>();
  const mappings: ColumnMapping[] = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const lower = header.toLowerCase().trim();
    let mapped: string | null = null;
    let auto = false;

    // 1. Try platform-specific map
    if (platformMap[lower] && validKeys.has(platformMap[lower]) && !usedFields.has(platformMap[lower])) {
      mapped = platformMap[lower];
      auto = true;
    }

    // 2. Try generic patterns
    if (!mapped) {
      for (const [pattern, field] of GENERIC_PATTERNS) {
        if (pattern.test(lower) && validKeys.has(field) && !usedFields.has(field)) {
          mapped = field;
          auto = true;
          break;
        }
      }
    }

    if (mapped) usedFields.add(mapped);
    mappings.push({ csvHeader: header, csvIndex: i, mappedField: mapped, autoMapped: auto });
  }

  return mappings;
}

/**
 * Transform a CSV row using the column mappings into a record object.
 */
export function transformRow(
  row: string[],
  mappings: ColumnMapping[]
): Record<string, string> {
  const record: Record<string, string> = {};

  for (const m of mappings) {
    if (m.mappedField && row[m.csvIndex] !== undefined) {
      const value = row[m.csvIndex].trim();
      if (value) {
        if (m.mappedField === '_full_name') {
          // Split "First Last" into first_name and last_name
          const parts = value.split(/\s+/);
          record['first_name'] = record['first_name'] || parts[0] || '';
          record['last_name'] = record['last_name'] || parts.slice(1).join(' ') || '';
        } else {
          record[m.mappedField] = value;
        }
      }
    }
  }

  return record;
}

/**
 * Check for duplicate clients by email or name+phone.
 */
export function findDuplicates(
  newRecords: Record<string, string>[],
  existing: { email?: string | null; first_name: string; last_name: string; phone?: string | null }[]
): Set<number> {
  const duplicateIndices = new Set<number>();
  const existingEmails = new Set(existing.map(e => e.email?.toLowerCase()).filter(Boolean));
  const existingNamePhones = new Set(
    existing.map(e => `${e.first_name.toLowerCase()}|${e.last_name.toLowerCase()}|${(e.phone || '').replace(/\D/g, '')}`)
  );

  newRecords.forEach((rec, i) => {
    if (rec.email && existingEmails.has(rec.email.toLowerCase())) {
      duplicateIndices.add(i);
      return;
    }
    const namePhone = `${(rec.first_name || '').toLowerCase()}|${(rec.last_name || '').toLowerCase()}|${(rec.phone || '').replace(/\D/g, '')}`;
    if (rec.first_name && rec.last_name && existingNamePhones.has(namePhone)) {
      duplicateIndices.add(i);
    }
  });

  return duplicateIndices;
}
