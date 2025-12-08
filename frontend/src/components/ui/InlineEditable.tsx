import { useInlineEdit } from '../../hooks/useInlineEdit';
import {
  inlineEditableInputBase,
  inlineEditableDisplayBase,
  inlineEditableEmpty,
  inlineEditableTextNormal,
  inlineEditableTextEmail,
  formInputBorderError,
  formErrorTextSmall,
  cn,
} from '../../utils/styles';

interface InlineEditableProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: 'email' | 'tel' | 'text';
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
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(trimmed) || trimmed.length < 3) {
        return 'Invalid phone format';
      }
    }

    return null;
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
    transformValue: (trimmed) => (trimmed === '' ? null : trimmed),
  });

  if (isEditing) {
    return (
      <div className="min-w-0">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
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
            className
          )}
          disabled={isSaving}
        />
        {error && (
          <p className={cn('mt-1', formErrorTextSmall)}>
            {error}
          </p>
        )}
      </div>
    );
  }

  const displayValue = value || '';
  const isEmpty = !displayValue;

  // Check if className contains a text color class (any class starting with "text-")
  const hasTextColor = /\btext-/.test(className);

  return (
    <p
      onClick={handleClick}
      className={cn(
        inlineEditableDisplayBase,
        className,
        !hasTextColor && (isEmpty
          ? inlineEditableEmpty
          : type === 'email'
          ? inlineEditableTextEmail
          : inlineEditableTextNormal)
      )}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : displayValue}
    </p>
  );
}

