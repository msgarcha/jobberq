/**
 * Client-side CSV parser with proper quote/comma handling.
 * No external dependencies.
 */

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export function parseCSV(text: string): ParsedCSV {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field.trim());
        if (current.some(c => c !== '')) lines.push(current);
        current = [];
        field = '';
        if (ch === '\r') i++; // skip \n in \r\n
      } else {
        field += ch;
      }
    }
  }

  // Last field
  current.push(field.trim());
  if (current.some(c => c !== '')) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [], rowCount: 0 };

  const headers = lines[0];
  const rows = lines.slice(1);

  // Normalize row lengths to match headers
  const normalized = rows.map(row => {
    if (row.length < headers.length) {
      return [...row, ...Array(headers.length - row.length).fill('')];
    }
    return row.slice(0, headers.length);
  });

  return { headers, rows: normalized, rowCount: normalized.length };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
