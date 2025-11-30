interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  gradient?: 'warm' | 'blue';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

const gradientClasses = {
  warm: 'bg-gradient-to-br from-warm-500 to-warm-600',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
};

export default function Avatar({ name, size = 'md', className = '', gradient = 'warm' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} ${gradientClasses[gradient]} rounded-full flex items-center justify-center text-white font-medium shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}

