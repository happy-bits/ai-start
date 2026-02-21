/**
 * Parse CSV text into array of row objects.
 * Handles comma and tab separators, quoted fields.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length === 0) return [];

  const rows: Record<string, string>[] = [];
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        current += char;
      }
    } else if (char === ',' || char === '\t') {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/** Common column name variants for auto-mapping */
export const COLUMN_ALIASES: Record<string, string[]> = {
  name: ['name', 'namn', 'contact', 'contact name', 'full name'],
  email: ['email', 'e-post', 'e-postadress', 'mail'],
  phone: ['phone', 'telefon', 'tel', 'mobile', 'mobil'],
  company: ['company', 'företag', 'organization', 'organisation'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile'],
  followUpDate: ['follow up date', 'followup', 'följupp', 'följ upp', 'follow_up_date'],
};

export function suggestColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const used = new Set<string>();

  for (const field of Object.keys(COLUMN_ALIASES)) {
    const aliases = COLUMN_ALIASES[field];
    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      if (aliases.some((a) => normalized.includes(a) || normalized === a)) {
        mapping[field] = header;
        used.add(header);
        break;
      }
    }
  }

  return mapping;
}
