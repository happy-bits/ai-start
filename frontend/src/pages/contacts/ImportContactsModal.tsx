import { useCallback, useEffect, useMemo, useState } from 'react';

import { useContacts, useCreateContactsBulk } from '../../api/contacts';
import type { Contact, CreateContactData } from '../../api/types';
import { Button, Card, ErrorMessage, LoadingSpinner, Select } from '../../components/ui';
import { parseCSV, suggestColumnMapping } from '../../utils/csv';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact(row: CreateContactData): string | null {
  if (!row.name?.trim()) return 'Name is required';
  if (row.email?.trim() && !EMAIL_REGEX.test(row.email.trim())) {
    return 'Invalid email format';
  }
  if (row.followUpDate?.trim() && !DATE_REGEX.test(row.followUpDate.trim())) {
    return 'Date must be YYYY-MM-DD';
  }
  return null;
}

function isDuplicate(row: CreateContactData, existing: Contact[]): boolean {
  const email = row.email?.trim().toLowerCase();
  const name = row.name?.trim().toLowerCase();
  const company = row.company?.trim().toLowerCase();

  return existing.some((c) => {
    const matchEmail = email && c.email?.toLowerCase() === email;
    const matchNameCompany =
      name &&
      c.name?.toLowerCase() === name &&
      (company ? c.company?.toLowerCase() === company : true);
    return matchEmail || matchNameCompany;
  });
}

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportContactsModal({ isOpen, onClose }: ImportContactsModalProps) {
  const { data: existingContacts = [] } = useContacts();
  const createBulk = useCreateContactsBulk();

  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const headers = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]);
  }, [rawRows]);

  const mappedContacts = useMemo((): (CreateContactData & { rowIndex: number })[] => {
    return rawRows.map((row, idx) => {
      const get = (field: string) => {
        const col = columnMapping[field];
        return (col && row[col]?.trim()) || '';
      };
      const contact: CreateContactData & { rowIndex: number } = {
        rowIndex: idx,
        name: get('name'),
        email: get('email') || undefined,
        phone: get('phone') || undefined,
        company: get('company') || undefined,
        linkedin: get('linkedin') || undefined,
        followUpDate: get('followUpDate') || undefined,
      };
      return contact;
    });
  }, [rawRows, columnMapping]);

  const previewData = useMemo(() => {
    return mappedContacts.map((c) => ({
      ...c,
      validationError: validateContact(c),
      isDuplicate: isDuplicate(c, existingContacts),
    }));
  }, [mappedContacts, existingContacts]);

  const selectedValidContacts = useMemo(() => {
    return previewData
      .filter((p) => selectedRows.has(p.rowIndex) && !p.validationError)
      .map(({ rowIndex, validationError, isDuplicate, ...c }) => c);
  }, [previewData, selectedRows]);

  const hasInvalidSelected = useMemo(() => {
    return previewData.some((p) => selectedRows.has(p.rowIndex) && p.validationError);
  }, [previewData, selectedRows]);

  // Auto-deselect invalid rows when validation runs
  useEffect(() => {
    setSelectedRows((prev) => {
      const toRemove = previewData.filter((p) => p.validationError && prev.has(p.rowIndex));
      if (toRemove.length === 0) return prev;
      const next = new Set(prev);
      for (const p of toRemove) next.delete(p.rowIndex);
      return next;
    });
  }, [previewData]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setError('File is empty or has no data rows');
          setFile(null);
          setRawRows([]);
          setColumnMapping({});
          setSelectedRows(new Set());
          return;
        }
        setRawRows(rows);
        setColumnMapping(suggestColumnMapping(Object.keys(rows[0])));
        setSelectedRows(new Set(rows.map((_, i) => i)));
        setFile(f);
      } catch (_err) {
        setError('Could not parse CSV file');
        setFile(null);
        setRawRows([]);
      }
    };
    reader.readAsText(f, 'UTF-8');
  }, []);

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    const validIndices = previewData.filter((p) => !p.validationError).map((p) => p.rowIndex);
    const allValidSelected = validIndices.every((i) => selectedRows.has(i));
    if (allValidSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(validIndices));
    }
  };

  const handleImport = async () => {
    setError('');
    if (selectedValidContacts.length === 0) {
      setError('Select at least one valid contact to import');
      return;
    }
    if (hasInvalidSelected) {
      setError('Some selected rows have validation errors. Deselect them or fix the data.');
      return;
    }

    try {
      await createBulk.mutateAsync(selectedValidContacts);
      onClose();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const reset = () => {
    setFile(null);
    setRawRows([]);
    setColumnMapping({});
    setSelectedRows(new Set());
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const fieldOptions = [
    { value: '', label: '(skip)' },
    ...headers.map((h) => ({ value: h, label: h })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-contacts-title"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" padding="none">
        <div className="p-6 border-b border-dark-700">
          <h2 id="import-contacts-title" className="text-xl font-semibold text-white">
            Import contacts
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            Upload a CSV file. Map columns to fields and choose which rows to import.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!file ? (
            <div className="space-y-4">
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Choose CSV file"
                />
                <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center cursor-pointer hover:border-warm-500/50 hover:bg-warm-500/5 transition-colors">
                  <span className="text-warm-400 font-medium">Choose CSV file</span>
                  <p className="text-dark-400 text-sm mt-1">or drag and drop</p>
                </div>
              </label>
              <ErrorMessage error={error} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-dark-400">
                  File: <span className="text-white">{file.name}</span> ({rawRows.length} rows)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setRawRows([]);
                    setColumnMapping({});
                    setSelectedRows(new Set());
                    setError('');
                  }}
                  className="text-sm text-dark-400 hover:text-white"
                  aria-label="Choose different file"
                >
                  Change file
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-3">Column mapping</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['name', 'email', 'phone', 'company', 'linkedin', 'followUpDate'].map(
                    (field) => (
                      <Select
                        key={field}
                        label={field === 'name' ? 'Name (required)' : field}
                        options={fieldOptions}
                        value={columnMapping[field] ?? ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                        aria-label={`Map column for ${field}`}
                      />
                    ),
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-3">Preview</h3>
                <div className="border border-dark-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm" aria-label="Import preview">
                    <thead className="bg-dark-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={
                              previewData.length > 0 &&
                              previewData.every(
                                (p) => p.validationError || selectedRows.has(p.rowIndex),
                              )
                            }
                            onChange={toggleAll}
                            aria-label="Select all valid rows"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">Name</th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">Email</th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">Company</th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium w-24">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`border-t border-dark-700 ${
                            row.validationError ? 'bg-red-500/5' : ''
                          } ${row.isDuplicate ? 'bg-amber-500/5' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.rowIndex)}
                              onChange={() => toggleRow(row.rowIndex)}
                              disabled={!!row.validationError}
                              aria-label={`Select row ${row.rowIndex + 1}: ${row.name || 'unnamed'}`}
                            />
                          </td>
                          <td className="px-3 py-2 text-white truncate max-w-[120px]">
                            {row.name || '—'}
                          </td>
                          <td className="px-3 py-2 text-dark-400 truncate max-w-[140px]">
                            {row.email || '—'}
                          </td>
                          <td className="px-3 py-2 text-dark-400 truncate max-w-[100px]">
                            {row.company || '—'}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {row.validationError && (
                              <span className="text-red-400" title={row.validationError}>
                                Invalid
                              </span>
                            )}
                            {!row.validationError && row.isDuplicate && (
                              <span className="text-amber-400">Duplicate</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ErrorMessage error={error} />
            </>
          )}
        </div>

        <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} aria-label="Cancel import">
            Cancel
          </Button>
          {file && (
            <Button
              onClick={handleImport}
              disabled={
                createBulk.isPending || selectedValidContacts.length === 0 || hasInvalidSelected
              }
              aria-label="Import selected contacts"
            >
              {createBulk.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                `Import ${selectedValidContacts.length} contact${selectedValidContacts.length !== 1 ? 's' : ''}`
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
