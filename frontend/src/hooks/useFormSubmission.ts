import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../utils';

interface UseFormSubmissionOptions<TData, TResponse> {
  onSubmit: (data: TData) => Promise<TResponse>;
  onSuccess?: (response: TResponse) => void | string; // Return string to navigate, void to call callback
  onSuccessCallback?: () => void; // Optional callback function (for embedded forms)
  validate?: (data: TData) => string | null; // Return error message or null
}

export function useFormSubmission<TData, TResponse>({
  onSubmit,
  onSuccess,
  onSuccessCallback,
  validate,
}: UseFormSubmissionOptions<TData, TResponse>) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent, data: TData) => {
    e.preventDefault();
    setError('');

    // Validate if validator provided
    if (validate) {
      const validationError = validate(data);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await onSubmit(data);
      const navigatePath = onSuccess ? onSuccess(response) : undefined;
      if (navigatePath) {
        navigate(navigatePath);
      } else if (onSuccessCallback) {
        // Call callback if no navigation path returned
        onSuccessCallback();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    error,
    isSubmitting,
    handleSubmit,
  };
}

