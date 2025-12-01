import { type InputHTMLAttributes, forwardRef } from 'react';
import { formInputBase, formLabel, formErrorText, getFormInputBorder, cn } from '../../utils/styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className={formLabel}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(formInputBase, getFormInputBorder(!!error), className)}
          {...props}
        />
        {error && <p className={formErrorText}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

