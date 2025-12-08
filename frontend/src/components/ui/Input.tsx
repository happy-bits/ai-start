import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { formInputBase, formLabel, formErrorText, getFormInputBorder, cn } from '../../utils/styles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || generatedId;
    const errorId = `${inputId}-error`;

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
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(formInputBase, getFormInputBorder(!!error), className)}
          {...props}
        />
        {error && (
          <p id={errorId} className={formErrorText} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

