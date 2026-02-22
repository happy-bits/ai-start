interface RocketProps {
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  position?: { x: number; y: number };
}

export default function Rocket({ size = 'md', delay = 0, position }: RocketProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const animationDelay = delay * 100;

  return (
    <div
      className={`${sizeClasses[size]} relative animate-bounce`}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationDuration: '2s',
        left: position?.x ? `${position.x}%` : undefined,
        top: position?.y ? `${position.y}%` : undefined,
      }}
    >
      <svg
        className="w-full h-full text-warm-500 drop-shadow-lg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <title>Rocket</title>
        <path d="M4.5 16.5c-1-1.5-2-4-2-6.5s1-5 2-6.5" />
        <path d="M19.5 16.5c1-1.5 2-4 2-6.5s-1-5-2-6.5" />
        <path d="M12 2v20" />
        <path d="M12 2c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3" />
        <path d="M8 22h8" />
        <path d="M10 18h4" />
      </svg>
      {/* Flame trail */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-4 bg-gradient-to-t from-warm-600 via-warm-500 to-transparent opacity-75 blur-sm"
        style={{
          animationDelay: `${animationDelay}ms`,
        }}
      />
    </div>
  );
}
