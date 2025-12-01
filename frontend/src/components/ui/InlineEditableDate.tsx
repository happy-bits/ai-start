import { useInlineEdit } from '../../hooks/useInlineEdit';
import {
  inlineEditableInputBase,
  inlineEditableDisplayBase,
  inlineEditableEmpty,
  inlineEditableTextNormal,
  cn,
} from '../../utils/styles';

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
        className={cn(inlineEditableInputBase, className)}
      />
    );
  }

  const isEmpty = !value;

  return (
    <span
      onClick={handleClick}
      className={cn(
        inlineEditableDisplayBase,
        isEmpty ? inlineEditableEmpty : inlineEditableTextNormal,
        className
      )}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : value}
    </span>
  );
}

