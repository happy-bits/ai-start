import { useInlineEdit } from '../../hooks/useInlineEdit';

interface InlineEditableProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: 'email' | 'tel' | 'text';
  placeholder?: string;
  className?: string;
  emptyText?: string;
}

export default function InlineEditable({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  emptyText = 'Click to edit',
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
          className={`w-full px-2 py-1 bg-dark-800 border rounded text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-warm-500 focus:ring-warm-500/50'
          } ${className}`}
          disabled={isSaving}
        />
        {error && (
          <p className="mt-1 text-xs text-red-400">
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
      className={`text-sm cursor-pointer hover:text-white transition-colors ${className} ${
        !hasTextColor
          ? isEmpty
            ? 'text-dark-500 italic'
            : type === 'email'
            ? 'text-dark-300'
            : 'text-dark-400'
          : ''
      }`}
      title={isEmpty ? emptyText : 'Click to edit'}
    >
      {isEmpty ? emptyText : displayValue}
    </p>
  );
}

