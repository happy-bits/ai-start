import { useMemo, useState } from 'react';
import { useImportContacts } from '../../api/contacts';
import type { CreateContactData } from '../../api/types';
import { Button, ErrorMessage, Modal } from '../../components/ui';
import {
  autoDetectColumnMapping,
  buildContactsFromMapping,
  CONTACT_FIELD_LABELS,
  CONTACT_FIELDS,
  type ContactField,
  detectSeparator,
  isMappingComplete,
  parsePastedData,
  type ValidationError,
  validateContact,
} from '../../utils/importContacts';
import { cn, formErrorText, formInputBase, formLabel } from '../../utils/styles';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportContactsModal({ isOpen, onClose }: ImportContactsModalProps) {
  const [pastedText, setPastedText] = useState('');
  const [mapping, setMapping] = useState<Partial<Record<ContactField, number>>>({});
  const [showMapping, setShowMapping] = useState(false);

  const importContacts = useImportContacts();

  const parsed = useMemo(() => parsePastedData(pastedText), [pastedText]);

  const { headers, rows, contacts, needsMapping, validationErrors } = useMemo(() => {
    if (!parsed) {
      return {
        headers: [] as string[],
        rows: [] as string[][],
        contacts: [] as CreateContactData[],
        needsMapping: false,
        validationErrors: [] as ValidationError[],
      };
    }

    const { headers: h, rows: r } = parsed;
    const autoMapping = autoDetectColumnMapping(h);
    const effectiveMapping = showMapping ? mapping : autoMapping;
    const contactsData = buildContactsFromMapping(r, effectiveMapping);

    const errors: ValidationError[] = [];
    for (let i = 0; i < contactsData.length; i++) {
      errors.push(...validateContact(contactsData[i], i + 1));
    }

    const complete = isMappingComplete(effectiveMapping);
    const hasValidNameColumn = contactsData.some((c) => c.name?.trim());

    return {
      headers: h,
      rows: r,
      contacts: contactsData,
      needsMapping: !complete || !hasValidNameColumn,
      validationErrors: errors,
    };
  }, [parsed, mapping, showMapping]);

  const canImport =
    contacts.length > 0 &&
    isMappingComplete(showMapping ? mapping : autoDetectColumnMapping(parsed?.headers ?? [])) &&
    validationErrors.length === 0 &&
    contacts.every((c) => c.name?.trim());

  const handlePasteChange = (value: string) => {
    setPastedText(value);
    const p = parsePastedData(value);
    if (p) {
      const auto = autoDetectColumnMapping(p.headers);
      setMapping(auto);
      setShowMapping(!isMappingComplete(auto));
    }
  };

  const handleImport = async () => {
    if (!canImport) return;
    try {
      await importContacts.mutateAsync(contacts);
      setPastedText('');
      setMapping({});
      setShowMapping(false);
      onClose();
    } catch {
      // Error shown via ErrorMessage
    }
  };

  const handleClose = () => {
    setPastedText('');
    setMapping({});
    setShowMapping(false);
    onClose();
  };

  const separator = pastedText ? detectSeparator(pastedText) : null;
  const separatorLabel = separator === '\t' ? 'Tab' : separator === ';' ? 'Semicolon' : 'Comma';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import contacts">
      <div className="space-y-6">
        <p className="text-dark-400 text-sm">
          Paste data from Excel or Google Sheets. Include a header row for automatic column mapping.
        </p>

        <div>
          <label htmlFor="import-paste" className={formLabel}>
            Pasted data
          </label>
          <textarea
            id="import-paste"
            value={pastedText}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder="Name&#10;John Doe&#10;Jane Smith"
            className={cn(formInputBase, 'min-h-[160px] resize-y font-mono text-sm')}
            rows={6}
          />
        </div>

        {parsed && (
          <>
            <div className="flex items-center gap-4 text-sm text-dark-400">
              <span>
                {rows.length} row{rows.length !== 1 ? 's' : ''} detected
              </span>
              {separator && <span>Separator: {separatorLabel}</span>}
            </div>

            {needsMapping || showMapping ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Column mapping</h3>
                  {!needsMapping && (
                    <Button variant="ghost" size="sm" onClick={() => setShowMapping(!showMapping)}>
                      {showMapping ? 'Use auto-detected' : 'Edit mapping'}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CONTACT_FIELDS.map((field) => (
                    <div key={field}>
                      <label htmlFor={`import-mapping-${field}`} className={formLabel}>
                        {CONTACT_FIELD_LABELS[field]}
                      </label>
                      <select
                        id={`import-mapping-${field}`}
                        value={mapping[field] != null ? String(mapping[field]) : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMapping((prev) => ({
                            ...prev,
                            [field]: v === '' ? undefined : Number(v),
                          }));
                        }}
                        className={cn(formInputBase, 'mt-1')}
                      >
                        <option value="">— Skip —</option>
                        {headers.map((h, i) => (
                          <option key={`col-${i}-${h ?? 'empty'}`} value={i}>
                            {h || `(empty)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {validationErrors.length > 0 && (
              <div className="space-y-2">
                <p className={formErrorText}>Fix the following errors before importing:</p>
                <ul className="space-y-1 text-sm text-red-400 max-h-32 overflow-y-auto">
                  {validationErrors.map((e) => (
                    <li key={`${e.row}-${e.field}-${e.message}`}>
                      Row {e.row}, {CONTACT_FIELD_LABELS[e.field]}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importContacts.isError && (
              <ErrorMessage
                error={
                  importContacts.error instanceof Error
                    ? importContacts.error.message
                    : 'Import failed'
                }
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!canImport || importContacts.isPending}>
                {importContacts.isPending
                  ? 'Importing…'
                  : `Import ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
