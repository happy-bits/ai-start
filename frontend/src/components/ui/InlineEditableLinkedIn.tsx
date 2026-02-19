import { linkedinUrl } from '../../api/types';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import {
  cn,
  formErrorTextSmall,
  formInputBorderError,
  inlineEditableDisplayBase,
  inlineEditableEmpty,
  inlineEditableInputBase,
  inlineEditableTextNormal,
} from '../../utils/styles';

interface InlineEditableLinkedInProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  placeholder?: string;
  className?: string;
  emptyText?: string;
  'aria-label'?: string;
}

export default function InlineEditableLinkedIn({
  value,
  onSave,
  placeholder = 'username',
  className = '',
  emptyText = 'Add LinkedIn',
  'aria-label': ariaLabel,
}: InlineEditableLinkedInProps) {
  const {
    isEditing,
    editValue,
    isSaving,
    error,
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
      <div className="min-w-0">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder || emptyText}
          className={cn(
            'w-full',
            inlineEditableInputBase,
            error ? formInputBorderError : '',
            error ? 'focus:ring-red-500/50' : '',
            className,
          )}
          disabled={isSaving}
        />
        {error && <p className={cn('mt-1', formErrorTextSmall)}>{error}</p>}
      </div>
    );
  }

  const url = linkedinUrl(value);
  const isEmpty = !url;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'text-left flex-1 min-w-0 bg-transparent border-none p-0',
          inlineEditableDisplayBase,
          className,
          isEmpty ? inlineEditableEmpty : inlineEditableTextNormal,
        )}
        title={isEmpty ? emptyText : 'Click to edit'}
        aria-label={ariaLabel || placeholder || emptyText}
      >
        {isEmpty ? emptyText : <span className="text-warm-400 truncate block">{url}</span>}
      </button>
      {!isEmpty && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-dark-400 hover:text-warm-400 p-0.5"
          title="Open in new tab"
        >
          <span className="sr-only">Open in new tab</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <title>Open in new tab</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
