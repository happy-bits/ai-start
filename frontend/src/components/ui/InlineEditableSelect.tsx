import { useRef } from 'react';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import Badge from './Badge';
import { inlineEditableInputBase, cn } from '../../utils/styles';

interface InlineEditableSelectProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  options: Array<{ value: string; label: string }>;
  className?: string;
  badgeVariant?: 'default' | 'warm';
  'aria-label'?: string;
}

export default function InlineEditableSelect({
  value,
  onSave,
  options,
  className = '',
  badgeVariant = 'warm',
  'aria-label': ariaLabel,
}: InlineEditableSelectProps) {
  const isSavingFromChangeRef = useRef(false);
  
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
    const newValue = e.target.value.trim();
    
    // Prevent onBlur from also saving
    isSavingFromChangeRef.current = true;
    
    // Update local state
    handleChange(newValue);
    
    // Auto-save on change for select - save directly with the new value
    if (newValue !== value) {
      try {
        await onSave(newValue);
        // The value prop will update via React Query, and handleBlur will exit edit mode
        // We need to wait a bit for the prop to update, then call handleBlur to exit edit mode
        setTimeout(() => {
          isSavingFromChangeRef.current = false;
          // Force exit edit mode by calling handleBlur
          // At this point value prop should be updated, so handleBlur will just exit
          handleBlur();
        }, 100);
      } catch (err) {
        isSavingFromChangeRef.current = false;
        // Revert on error
        handleChange(value || '');
      }
    } else {
      isSavingFromChangeRef.current = false;
      handleBlur();
    }
  };

  const handleSelectBlur = async () => {
    // Don't save if we're already saving from onChange
    if (isSavingFromChangeRef.current) {
      return;
    }
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
        onBlur={handleSelectBlur}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        aria-label={ariaLabel || 'Select option'}
        className={cn(inlineEditableInputBase, 'text-xs', className)}
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
