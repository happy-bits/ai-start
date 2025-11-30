import { useState, useEffect, useRef, type KeyboardEvent } from 'react';

interface InlineEditableProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: 'email' | 'tel' | 'text';
  placeholder?: string;
  className?: string;
  emptyText?: string;
}

export default function InlineEditable({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  emptyText = 'Click to edit',
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const validate = (val: string): string | null => {
    const trimmed = val.trim();
    
    if (trimmed === '') {
      return null; // Empty is valid (will be saved as null)
    }

    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return 'Invalid email format';
      }
    }

    if (type === 'tel') {
      // Basic phone validation - allow international format
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(trimmed) || trimmed.length < 3) {
        return 'Invalid phone format';
      }
    }

    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setError(null);
  };

  const handleBlur = async () => {
    const trimmed = editValue.trim();
    const validationError = validate(editValue);

    if (validationError) {
      setError(validationError);
      // Keep editing mode open if there's an error, but allow user to click away
      // They can press Escape to cancel or fix the error
      return;
    }

    setError(null);

    // Only save if value changed
    const newValue = trimmed === '' ? null : trimmed;
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
        setIsEditing(false);
      } catch (err) {
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

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setError(null);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="min-w-0">
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setError(null); // Clear error on change
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-2 py-1 bg-dark-800 border rounded text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-warm-500 focus:ring-warm-500/50'
          } ${className}`}
          disabled={isSaving}
        />
        {error && (
          <p className="mt-1 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }

  const displayValue = value || '';
  const isEmpty = !displayValue;

  return (
    <p
      onClick={handleClick}
      className={`text-sm cursor-pointer hover:text-white transition-colors ${
        isEmpty
          ? 'text-dark-500 italic'
          : type === 'email'
          ? 'text-dark-300'
          : 'text-dark-400'
      } ${className}`}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : displayValue}
    </p>
  );
}

