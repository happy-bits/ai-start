import { useInlineEdit } from '../../hooks/useInlineEdit';

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
    transformValue: (trimmed) => trimmed as string,
  });

  if (isEditing) {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="date"
        value={editValue}
        onChange={(e) => handleChange(e.target.value)}
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

