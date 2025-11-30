import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`p-8 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto rounded-full bg-dark-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-dark-400 text-sm mb-4">{message}</p>
      {action && action}
    </div>
  );
}

