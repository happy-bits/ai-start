interface ErrorMessageProps {
  error: string;
  className?: string;
}

export default function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm ${className}`}>
      {error}
    </div>
  );
}

