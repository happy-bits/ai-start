import { useState, useEffect, useRef, type KeyboardEvent } from 'react';

interface InlineEditableTextareaProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  className?: string;
  emptyText?: string;
  rows?: number;
}

export default function InlineEditableTextarea({
  value,
  onSave,
  className = '',
  emptyText = 'Click to add notes',
  rows = 3,
}: InlineEditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
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

  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      await handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="min-w-0">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          rows={rows}
          className={`w-full px-2 py-1 bg-dark-800 border border-warm-500 rounded text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-warm-500/50 transition-all resize-none ${className}`}
          placeholder={emptyText}
        />
        <p className="mt-1 text-xs text-dark-500">
          Press Cmd/Ctrl+Enter to save, Escape to cancel
        </p>
      </div>
    );
  }

  const displayValue = value || '';
  const isEmpty = !displayValue;

  return (
    <p
      onClick={handleClick}
      className={`text-sm cursor-pointer hover:text-white transition-colors whitespace-pre-wrap ${
        isEmpty ? 'text-dark-500 italic' : 'text-dark-300'
      } ${className}`}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : displayValue}
    </p>
  );
}

