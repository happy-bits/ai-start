import type { ReactNode } from 'react';
import { cn } from '../../utils/styles';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'blue';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-dark-700 text-dark-300',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
