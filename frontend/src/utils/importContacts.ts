import type { CreateContactData } from '../api/types';

export const CONTACT_FIELDS = [
  'name',
  'email',
  'phone',
  'company',
  'linkedin',
  'followUpDate',
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export const CONTACT_FIELD_LABELS: Record<ContactField, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  linkedin: 'LinkedIn',
  followUpDate: 'Follow-up date',
};

// Header names that map to each field (lowercase for matching)
const HEADER_ALIASES: Record<ContactField, string[]> = {
  name: ['name', 'namn', 'contact', 'contact name', 'full name'],
  email: ['email', 'e-post', 'epost', 'e-mail', 'mail'],
  phone: ['phone', 'telefon', 'tel', 'mobile', 'mobil'],
  company: ['company', 'företag', 'organization', 'org', 'employer'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile'],
  followUpDate: ['follow up', 'follow-up', 'followup', 'date', 'datum', 'follow_up_date'],
};

const LINKEDIN_REGEX =
  /^(https?:\/\/)?([\w.-]+\.)?linkedin\.com\/(in|pub|public-profile\/in|public-profile\/pub)\/[\w-]+/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function autoDetectColumnMapping(headers: string[]): Partial<Record<ContactField, number>> {
  const mapping: Partial<Record<ContactField, number>> = {};
  const normalized = headers.map(normalizeHeader);

  for (const field of CONTACT_FIELDS) {
    const aliases = HEADER_ALIASES[field];
    const idx = normalized.findIndex((h) => aliases.some((a) => h.includes(a) || a.includes(h)));
    if (idx >= 0) mapping[field] = idx;
  }

  return mapping;
}

export function detectSeparator(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  const tabCount = (firstLine.match(/\t/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;

  if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) return '\t';
  if (semicolonCount >= commaCount && semicolonCount >= tabCount && semicolonCount > 0) return ';';
  return ',';
}

export function parsePastedData(
  text: string,
): { headers: string[]; rows: string[][]; separator: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const separator = detectSeparator(trimmed);
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length === 0) return null;

  const parseLine = (line: string) => {
    // Simple split - doesn't handle quoted commas
    return line.split(separator).map((c) => c.trim());
  };

  const rows = lines.map(parseLine);

  // First row as headers if it looks like headers (non-empty, similar length to others)
  const firstRow = rows[0] ?? [];
  const hasHeader =
    firstRow.some((c) => c.length > 0) &&
    (rows.length === 1 || firstRow.every((c) => !/^\d+$/.test(c) || c.length > 4));

  const headers = hasHeader ? firstRow : firstRow.map((_, i) => `Column ${i + 1}`);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return { headers, rows: dataRows, separator };
}

export interface ValidationError {
  row: number;
  field: ContactField;
  message: string;
}

export function validateContact(data: CreateContactData, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ row: rowIndex, field: 'name', message: 'Name is required' });
  }

  if (data.email != null && data.email !== '') {
    if (!EMAIL_REGEX.test(data.email)) {
      errors.push({ row: rowIndex, field: 'email', message: 'Invalid email format' });
    }
  }

  if (data.linkedin != null && data.linkedin !== '') {
    const trimmed = data.linkedin.trim();
    const withProtocol =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    if (!LINKEDIN_REGEX.test(withProtocol)) {
      errors.push({
        row: rowIndex,
        field: 'linkedin',
        message: 'Invalid LinkedIn URL. Use format: linkedin.com/in/username',
      });
    }
  }

  if (data.followUpDate != null && data.followUpDate !== '') {
    if (!DATE_REGEX.test(data.followUpDate)) {
      errors.push({
        row: rowIndex,
        field: 'followUpDate',
        message: 'Date must be YYYY-MM-DD format',
      });
    }
  }

  return errors;
}

export function buildContactsFromMapping(
  rows: string[][],
  mapping: Partial<Record<ContactField, number>>,
): CreateContactData[] {
  return rows.map((row) => {
    const get = (field: ContactField) => {
      const idx = mapping[field];
      if (idx == null || idx >= row.length) return null;
      const val = row[idx]?.trim();
      return val === '' ? null : val;
    };

    return {
      name: get('name') ?? '',
      email: get('email'),
      phone: get('phone'),
      company: get('company'),
      linkedin: get('linkedin'),
      followUpDate: get('followUpDate'),
    };
  });
}

export function isMappingComplete(mapping: Partial<Record<ContactField, number>>): boolean {
  return mapping.name != null;
}
