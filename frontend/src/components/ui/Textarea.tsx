import { forwardRef, type TextareaHTMLAttributes } from 'react';
import {
  cn,
  formErrorText,
  formInputBase,
  formLabel,
  getFormInputBorder,
} from '../../utils/styles';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={textareaId} className={formLabel}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(formInputBase, getFormInputBorder(!!error), 'resize-none', className)}
          {...props}
        />
        {error && <p className={formErrorText}>{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
