import type { ReactNode } from 'react';
import { cn } from '../../utils/styles';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <output className={cn('p-8 text-center block', className)} aria-label={title}>
      <div
        className="w-16 h-16 mx-auto rounded-full bg-dark-800 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-dark-400 text-sm mb-4">{message}</p>
      {action && action}
    </output>
  );
}
