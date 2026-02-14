import { cn, errorMessageContainer } from '../../utils/styles';

interface ErrorMessageProps {
  error: string;
  className?: string;
}

export default function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  if (!error) return null;

  return <div className={cn(errorMessageContainer, className)}>{error}</div>;
}
