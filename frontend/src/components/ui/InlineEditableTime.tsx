import { useInlineEdit } from '../../hooks/useInlineEdit';
import {
  inlineEditableInputBase,
  inlineEditableDisplayBase,
  inlineEditableEmpty,
  inlineEditableTextNormal,
  cn,
} from '../../utils/styles';

interface InlineEditableTimeProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  className?: string;
  emptyText?: string;
  'aria-label'?: string;
}

export default function InlineEditableTime({
  value,
  onSave,
  className = '',
  emptyText = 'Add time',
  'aria-label': ariaLabel,
}: InlineEditableTimeProps) {
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
        type="time"
        value={editValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        aria-label={ariaLabel || emptyText}
        className={cn(inlineEditableInputBase, className)}
      />
    );
  }

  const displayValue = value || '';
  const isEmpty = !displayValue;

  return (
    <span
      onClick={handleClick}
      className={cn(
        inlineEditableDisplayBase,
        isEmpty ? inlineEditableEmpty : inlineEditableTextNormal,
        className
      )}
      title={isEmpty ? emptyText : 'Click to edit'}
      aria-label={ariaLabel || emptyText}
      role="button"
    >
      {isEmpty ? emptyText : displayValue}
    </span>
  );
}

