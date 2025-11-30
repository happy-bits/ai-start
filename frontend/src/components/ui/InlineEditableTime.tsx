import { useState, useEffect, useRef, type KeyboardEvent } from 'react';

interface InlineEditableTimeProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  className?: string;
  emptyText?: string;
}

export default function InlineEditableTime({
  value,
  onSave,
  className = '',
  emptyText = 'Add time',
}: InlineEditableTimeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = async () => {
    const trimmed = editValue.trim();
    const newValue = trimmed === '' ? null : trimmed;
    
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
        setIsEditing(false);
      } catch (err) {
        setEditValue(value || '');
        setIsEditing(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="time"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`px-2 py-1 bg-dark-800 border border-warm-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-warm-500/50 transition-all ${className}`}
      />
    );
  }

  const displayValue = value || '';
  const isEmpty = !displayValue;

  return (
    <span
      onClick={handleClick}
      className={`text-sm cursor-pointer hover:text-white transition-colors ${
        isEmpty ? 'text-dark-500 italic' : 'text-dark-400'
      } ${className}`}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : displayValue}
    </span>
  );
}

