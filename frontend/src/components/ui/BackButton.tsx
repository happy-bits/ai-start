import { Link } from 'react-router-dom';

interface BackButtonProps {
  to: string;
  className?: string;
}

export default function BackButton({ to, className = '' }: BackButtonProps) {
  return (
    <Link
      to={to}
      className={`p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors ${className}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}

