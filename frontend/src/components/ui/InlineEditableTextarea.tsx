import { useInlineEdit } from '../../hooks/useInlineEdit';
import {
  inlineEditableInputBase,
  inlineEditableDisplayBase,
  inlineEditableEmpty,
  inlineEditableTextareaDisplay,
  cn,
} from '../../utils/styles';

interface InlineEditableTextareaProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  className?: string;
  emptyText?: string;
  rows?: number;
  'aria-label'?: string;
}

export default function InlineEditableTextarea({
  value,
  onSave,
  className = '',
  emptyText = 'Click to add notes',
  rows = 3,
  'aria-label': ariaLabel,
}: InlineEditableTextareaProps) {
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
    enableEnterToSave: false,
    enableCmdEnterToSave: true,
  });

  if (isEditing) {
    return (
      <div className="min-w-0">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          rows={rows}
          aria-label={ariaLabel || emptyText}
          className={cn('w-full', inlineEditableInputBase, 'placeholder-dark-500 resize-none', className)}
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
      className={cn(
        inlineEditableDisplayBase,
        'whitespace-pre-wrap',
        isEmpty ? inlineEditableEmpty : inlineEditableTextareaDisplay,
        className
      )}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : displayValue}
    </p>
  );
}

