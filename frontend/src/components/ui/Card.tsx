import { type ReactNode } from 'react';
import { cn } from '../../utils/styles';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  as: Component = 'div',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <Component
      className={cn('bg-dark-900/80 backdrop-blur-sm border border-dark-700 rounded-xl shadow-xl', paddings[padding], className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </Component>
  );
}

