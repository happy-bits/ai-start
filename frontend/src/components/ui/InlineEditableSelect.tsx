import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import Badge from './Badge';

interface InlineEditableSelectProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  options: Array<{ value: string; label: string }>;
  className?: string;
  badgeVariant?: 'default' | 'warm';
}

export default function InlineEditableSelect({
  value,
  onSave,
  options,
  className = '',
  badgeVariant = 'warm',
}: InlineEditableSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (editValue !== value) {
      setIsSaving(true);
      try {
        await onSave(editValue);
        setIsEditing(false);
      } catch (err) {
        setEditValue(value);
        setIsEditing(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditValue(e.target.value);
    // Auto-save on change for select
    handleBlur();
  };

  const selectedOption = options.find((opt) => opt.value === value);

  if (isEditing) {
    // When editing, show select outside of badge context
    return (
      <select
        ref={selectRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`px-2 py-1 bg-dark-800 border border-warm-500 rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-warm-500/50 transition-all ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-dark-800 text-white">
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  // When not editing, wrap in Badge
  return (
    <Badge variant={badgeVariant}>
      <span
        onClick={handleClick}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        title="Click to edit"
      >
        {selectedOption?.label || value}
      </span>
    </Badge>
  );
}

