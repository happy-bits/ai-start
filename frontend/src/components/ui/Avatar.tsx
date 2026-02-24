import { cn } from '../../utils/styles';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  gradient?: 'blue';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

const gradientClasses = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
};

export default function Avatar({
  name,
  size = 'md',
  className = '',
  gradient = 'blue',
}: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        sizeClasses[size],
        gradientClasses[gradient],
        'rounded-full flex items-center justify-center text-white font-medium shrink-0',
        className,
      )}
    >
      {initial}
    </div>
  );
}
