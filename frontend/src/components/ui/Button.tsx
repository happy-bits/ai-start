import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  'aria-label'?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-400 hover:to-warm-500 text-white shadow-lg shadow-warm-500/25 focus:ring-warm-500',
    secondary:
      'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600 focus:ring-dark-500',
    danger:
      'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 focus:ring-red-500',
    ghost:
      'hover:bg-dark-700 text-dark-300 hover:text-white focus:ring-dark-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
}

