import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

interface UseInlineEditOptions<TValue> {
  value: TValue;
  onSave: (value: TValue) => Promise<void>;
  validate?: (value: string) => string | null;
  transformValue?: (value: string) => TValue;
  enableEnterToSave?: boolean;
  enableCmdEnterToSave?: boolean;
}

export function useInlineEdit<TValue extends string | null>({
  value,
  onSave,
  validate,
  transformValue,
  enableEnterToSave = true,
  enableCmdEnterToSave = false,
}: UseInlineEditOptions<TValue>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // Sync editValue when value prop changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  // Focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setError(null);
    // Reset editValue to empty string when clicking on empty field
    if (!value) {
      setEditValue('');
    }
  };

  const handleBlur = async () => {
    const trimmed = editValue.trim();

    // Validate if validator provided
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        // Keep editing mode open if there's an error
        return;
      }
    }

    setError(null);

    // Transform value if transformer provided
    const newValue = transformValue
      ? transformValue(trimmed)
      : ((trimmed === '' ? null : trimmed) as TValue);

    // Only save if value changed
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
        setIsEditing(false);
      } catch (_err) {
        // Revert on error
        setEditValue(value || '');
        setError('Failed to save');
        setIsEditing(true); // Keep editing mode on save error
      } finally {
        setIsSaving(false);
      }
    } else {
      // Value didn't change, just exit edit mode
      setIsEditing(false);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLElement>) => {
    if (enableCmdEnterToSave && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    } else if (enableEnterToSave && e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setError(null);
      setIsEditing(false);
    }
  };

  const handleChange = (newValue: string) => {
    setEditValue(newValue);
    setError(null); // Clear error on change
  };

  return {
    isEditing,
    editValue,
    isSaving,
    error,
    inputRef,
    handleClick,
    handleBlur,
    handleKeyDown,
    handleChange,
  };
}
