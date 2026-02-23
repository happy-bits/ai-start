import { useInlineEdit } from '../../hooks/useInlineEdit';
import {
  cn,
  formErrorTextSmall,
  formInputBorderError,
  inlineEditableDisplayBase,
  inlineEditableEmpty,
  inlineEditableInputBase,
  inlineEditableTextEmail,
  inlineEditableTextNormal,
} from '../../utils/styles';

const LINKEDIN_REGEX =
  /^(https?:\/\/)?([\w.-]+\.)?linkedin\.com\/(in|pub|public-profile\/in|public-profile\/pub)\/[\w-]+/i;

interface InlineEditableProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: 'email' | 'tel' | 'text' | 'linkedin';
  placeholder?: string;
  className?: string;
  emptyText?: string;
  'aria-label'?: string;
}

export default function InlineEditable({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  emptyText = 'Click to edit',
  'aria-label': ariaLabel,
}: InlineEditableProps) {
  const validate = (val: string): string | null => {
    const trimmed = val.trim();

    if (trimmed === '') {
      return null; // Empty is valid (will be saved as null)
    }

    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return 'Invalid email format';
      }
    }

    if (type === 'tel') {
      // Basic phone validation - allow international format
      const phoneRegex = /^[\d\s+\-()]+$/;
      if (!phoneRegex.test(trimmed) || trimmed.length < 3) {
        return 'Invalid phone format';
      }
    }

    if (type === 'linkedin') {
      const toTest =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? trimmed
          : `https://${trimmed}`;
      if (!LINKEDIN_REGEX.test(toTest)) {
        return 'Invalid LinkedIn URL. Use format: linkedin.com/in/username';
      }
    }

    return null;
  };

  const transformValue = (trimmed: string): string | null => {
    if (trimmed === '') return null;
    if (type === 'linkedin') {
      return trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    }
    return trimmed;
  };

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
    validate,
    transformValue,
  });

  const inputType = type === 'linkedin' ? 'text' : type;

  if (isEditing) {
    return (
      <div className="min-w-0">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={inputType}
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

  const displayValue = value || '';
  const isEmpty = !displayValue;

  // Check if className contains a text color class (any class starting with "text-")
  const hasTextColor = /\btext-/.test(className);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'text-left w-full bg-transparent border-none p-0',
        inlineEditableDisplayBase,
        className,
        !hasTextColor &&
          (isEmpty
            ? inlineEditableEmpty
            : type === 'email'
              ? inlineEditableTextEmail
              : inlineEditableTextNormal),
      )}
      title={isEmpty ? emptyText : 'Click to edit'}
      aria-label={ariaLabel || placeholder || emptyText}
    >
      {isEmpty ? emptyText : displayValue}
    </button>
  );
}
