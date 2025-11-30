import { useInlineEdit } from '../../hooks/useInlineEdit';
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

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e.target.value);
    // Auto-save on change for select
    await handleBlur();
  };

  const selectedOption = options.find((opt) => opt.value === value);

  if (isEditing) {
    // When editing, show select outside of badge context
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={editValue}
        onChange={handleSelectChange}
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

