import { useState, useEffect, useRef, type KeyboardEvent } from 'react';

interface InlineEditableDateProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}

export default function InlineEditableDate({
  value,
  onSave,
  className = '',
}: InlineEditableDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
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

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`px-2 py-1 bg-dark-800 border border-warm-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-warm-500/50 transition-all ${className}`}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`text-sm cursor-pointer hover:text-white transition-colors text-dark-400 ${className}`}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

