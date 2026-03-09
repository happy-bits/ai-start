import { useCallback, useEffect, useMemo, useState } from 'react';

import { type BulkContactData, useContacts, useCreateContactsBulk } from '../../api/contacts';
import type { Contact, CreateContactData, InteractionType } from '../../api/types';
import { INTERACTION_TYPE_OPTIONS } from '../../api/types';
import { Button, Card, ErrorMessage, LoadingSpinner } from '../../components/ui';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ImportInteraction {
  type: string; // Allow any string since JSON may contain invalid types
  date: string;
  time?: string | null;
  notes?: string | null;
}

const VALID_INTERACTION_TYPES: InteractionType[] = [
  'call',
  'meeting',
  'email',
  'video_call',
  'note',
  'linkedin',
  'sms',
];

interface ImportContactData extends Omit<BulkContactData, 'interactions'> {
  interactions?: ImportInteraction[];
}

interface ImportContactWithValidation extends ImportContactData {
  rowIndex: number;
  validationError: string | null;
  interactionErrors: Array<{ index: number; error: string }>;
  isDuplicate: boolean;
}

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

function validateInteraction(interaction: ImportInteraction): string | null {
  if (!interaction.type) return 'Type is required';
  if (!VALID_INTERACTION_TYPES.includes(interaction.type as InteractionType)) {
    return `Invalid interaction type: ${interaction.type}`;
  }
  if (!interaction.date) return 'Date is required';
  if (!DATE_REGEX.test(interaction.date)) {
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
  const [rawContacts, setRawContacts] = useState<ImportContactData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const previewData = useMemo((): ImportContactWithValidation[] => {
    return rawContacts.map((contact, idx) => {
      const contactError = validateContact(contact);
      const interactionErrors: Array<{ index: number; error: string }> = [];

      if (contact.interactions) {
        contact.interactions.forEach((interaction, i) => {
          const err = validateInteraction(interaction);
          if (err) {
            interactionErrors.push({ index: i, error: err });
          }
        });
      }

      // If there are interaction errors, mark the contact as invalid
      const hasInteractionErrors = interactionErrors.length > 0;
      const finalValidationError =
        contactError || (hasInteractionErrors ? interactionErrors[0].error : null);

      return {
        ...contact,
        rowIndex: idx,
        validationError: finalValidationError,
        interactionErrors,
        isDuplicate: !finalValidationError ? isDuplicate(contact, existingContacts) : false,
      };
    });
  }, [rawContacts, existingContacts]);

  const selectedValidContacts = useMemo((): BulkContactData[] => {
    return previewData
      .filter(
        (p) =>
          selectedRows.has(p.rowIndex) && !p.validationError && p.interactionErrors.length === 0,
      )
      .map(({ rowIndex, validationError, interactionErrors, isDuplicate, ...c }) => ({
        name: c.name,
        email: c.email ?? null,
        phone: c.phone ?? null,
        company: c.company ?? null,
        linkedin: c.linkedin ?? null,
        followUpDate: c.followUpDate ?? null,
        interactions: c.interactions
          ?.filter((interaction) =>
            VALID_INTERACTION_TYPES.includes(interaction.type as InteractionType),
          )
          .map((interaction) => ({
            type: interaction.type as InteractionType,
            date: interaction.date,
            time: interaction.time ?? null,
            notes: interaction.notes ?? null,
          })),
      }));
  }, [previewData, selectedRows]);

  const hasInvalidSelected = useMemo(() => {
    return previewData.some(
      (p) => selectedRows.has(p.rowIndex) && (p.validationError || p.interactionErrors.length > 0),
    );
  }, [previewData, selectedRows]);

  const totalInteractions = useMemo(() => {
    return selectedValidContacts.reduce(
      (sum, contact) => sum + (contact.interactions?.length ?? 0),
      0,
    );
  }, [selectedValidContacts]);

  // Auto-deselect invalid rows when validation runs
  useEffect(() => {
    setSelectedRows((prev) => {
      const toRemove = previewData.filter(
        (p) => (p.validationError || p.interactionErrors.length > 0) && prev.has(p.rowIndex),
      );
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
        const data = JSON.parse(text);

        if (!data.contacts || !Array.isArray(data.contacts)) {
          setError('JSON must contain a "contacts" array');
          setFile(null);
          setRawContacts([]);
          setSelectedRows(new Set());
          return;
        }

        if (data.contacts.length === 0) {
          setError('File is empty or has no contacts');
          setFile(null);
          setRawContacts([]);
          setSelectedRows(new Set());
          return;
        }

        setRawContacts(data.contacts);
        setSelectedRows(new Set(data.contacts.map((_: unknown, i: number) => i)));
        setFile(f);
      } catch (_err) {
        setError('Could not parse JSON file. Make sure it is valid JSON.');
        setFile(null);
        setRawContacts([]);
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
    const validIndices = previewData
      .filter((p) => !p.validationError && p.interactionErrors.length === 0)
      .map((p) => p.rowIndex);
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
    setRawContacts([]);
    setSelectedRows(new Set());
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const getInteractionTypeLabel = (type: string): string => {
    if (VALID_INTERACTION_TYPES.includes(type as InteractionType)) {
      return INTERACTION_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || type;
    }
    return type; // Return the invalid type as-is
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-contacts-title"
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" padding="none">
        <div className="p-6 border-b border-dark-700">
          <h2 id="import-contacts-title" className="text-xl font-semibold text-white">
            Import contacts
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            Upload a JSON file with contacts and optional interactions. Format:{' '}
            <code className="text-warm-400">{'{"contacts": [...]}'}</code>
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!file ? (
            <div className="space-y-4">
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Choose JSON file"
                />
                <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center cursor-pointer hover:border-warm-500/50 hover:bg-warm-500/5 transition-colors">
                  <span className="text-warm-400 font-medium">Choose JSON file</span>
                  <p className="text-dark-400 text-sm mt-1">or drag and drop</p>
                </div>
              </label>
              <ErrorMessage error={error} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-dark-400">
                  File: <span className="text-white">{file.name}</span> ({rawContacts.length}{' '}
                  contacts)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setRawContacts([]);
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
                <h3 className="text-sm font-medium text-white mb-3">Preview</h3>
                <div className="border border-dark-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-sm" aria-label="Import preview">
                    <thead className="bg-dark-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={
                              previewData.length > 0 &&
                              previewData
                                .filter(
                                  (p) => !p.validationError && p.interactionErrors.length === 0,
                                )
                                .every((p) => selectedRows.has(p.rowIndex))
                            }
                            onChange={toggleAll}
                            aria-label="Select all valid rows"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">Name</th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">Email</th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">Company</th>
                        <th className="px-3 py-2 text-left text-dark-400 font-medium">
                          Interactions
                        </th>
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
                            row.validationError || row.interactionErrors.length > 0
                              ? 'bg-red-500/5'
                              : ''
                          } ${row.isDuplicate ? 'bg-amber-500/5' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.rowIndex)}
                              onChange={() => toggleRow(row.rowIndex)}
                              disabled={!!row.validationError || row.interactionErrors.length > 0}
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
                          <td className="px-3 py-2 text-dark-400 text-xs">
                            {row.interactions && row.interactions.length > 0 ? (
                              <div className="space-y-1">
                                {row.interactions.map((interaction, idx) => {
                                  const hasError = row.interactionErrors.some(
                                    (e) => e.index === idx,
                                  );
                                  // Use combination of type, date, and index as key since interactions can be duplicated
                                  const interactionKey = `${interaction.type}-${interaction.date}-${idx}`;
                                  return (
                                    <div
                                      key={interactionKey}
                                      className={hasError ? 'text-red-400' : 'text-dark-300'}
                                      title={
                                        hasError
                                          ? row.interactionErrors.find((e) => e.index === idx)
                                              ?.error
                                          : `${getInteractionTypeLabel(interaction.type)} - ${interaction.date}`
                                      }
                                    >
                                      {hasError ? '⚠' : '✓'}{' '}
                                      {getInteractionTypeLabel(interaction.type)}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {row.validationError && (
                              <span className="text-red-400" title={row.validationError}>
                                Invalid
                              </span>
                            )}
                            {!row.validationError && row.interactionErrors.length > 0 && (
                              <span className="text-red-400" title="Invalid interactions">
                                Invalid
                              </span>
                            )}
                            {!row.validationError &&
                              row.interactionErrors.length === 0 &&
                              row.isDuplicate && <span className="text-amber-400">Duplicate</span>}
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
                `Import ${selectedValidContacts.length} contact${selectedValidContacts.length !== 1 ? 's' : ''}${
                  totalInteractions > 0
                    ? ` with ${totalInteractions} interaction${totalInteractions !== 1 ? 's' : ''}`
                    : ''
                }`
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
