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
}

export default function InlineEditableTime({
  value,
  onSave,
  className = '',
  emptyText = 'Add time',
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
    >
      {isEmpty ? emptyText : displayValue}
    </span>
  );
}

