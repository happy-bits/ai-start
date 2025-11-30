import { useInlineEdit } from '../../hooks/useInlineEdit';

interface InlineEditableDateProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  className?: string;
  emptyText?: string;
}

export default function InlineEditableDate({
  value,
  onSave,
  className = '',
  emptyText = 'Add follow-up date',
}: InlineEditableDateProps) {
  const {
    isEditing,
    editValue,
    isSaving,
    inputRef,
    handleClick,
    handleBlur,
    handleKeyDown,
    handleChange,
  } = useInlineEdit({
    value,
    onSave,
    transformValue: (trimmed) => (trimmed === '' ? null : trimmed),
  });

  if (isEditing) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="date"
        value={editValue || ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`px-2 py-1 bg-dark-800 border border-warm-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-warm-500/50 transition-all ${className}`}
      />
    );
  }

  const isEmpty = !value;

  return (
    <span
      onClick={handleClick}
      className={`text-sm cursor-pointer hover:text-white transition-colors ${
        isEmpty ? 'text-dark-500 italic' : 'text-dark-400'
      } ${className}`}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : value}
    </span>
  );
}

