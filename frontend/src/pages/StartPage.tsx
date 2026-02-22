import Rocket from '../components/Rocket';

export default function StartPage() {
  // Generate many rocket positions
  const rockets = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: (['sm', 'md', 'lg'] as const)[i % 3],
    delay: i % 10,
    position: {
      x: (i * 17.3) % 100,
      y: (i * 23.7) % 100,
    },
  }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-dark-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-warm-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-warm-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warm-400/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Welcome to KeepWarm</h1>
          <p className="text-xl text-dark-400">Many rockets are launching! 🚀</p>
        </div>

        {/* Rockets container */}
        <div className="relative w-full max-w-6xl h-[600px]">
          {rockets.map((rocket) => (
            <div
              key={rocket.id}
              className="absolute"
              style={{
                left: `${rocket.position.x}%`,
                top: `${rocket.position.y}%`,
              }}
            >
              <Rocket size={rocket.size} delay={rocket.delay} />
            </div>
          ))}
        </div>

        {/* Additional decorative rockets */}
        <div className="mt-16 flex gap-8 flex-wrap justify-center">
          {Array.from({ length: 20 }, (_, i) => (
            <Rocket key={`extra-${i}`} size="sm" delay={i % 5} />
          ))}
        </div>
      </div>
    </div>
  );
}
