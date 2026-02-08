'use client';

interface FloatingOrbsProps {
  reducedMotion?: boolean;
}

/**
 * FloatingOrbs - CSS-only floating orb effects
 * Positioned throughout the page for ambient depth.
 * Uses CSS animations for better mobile performance.
 */
export function FloatingOrbs({ reducedMotion }: FloatingOrbsProps) {
  const orbs = [
    { top: '45%', left: '15%', size: 80, delay: 0 },
    { top: '70%', right: '10%', size: 100, delay: 3 },
    { top: '85%', left: '25%', size: 60, delay: 5 },
  ];

  return (
    <>
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: orb.top,
            left: orb.left,
            right: orb.right,
            width: orb.size,
            height: orb.size,
            background:
              'radial-gradient(circle, rgba(212,165,74,0.08) 0%, transparent 70%)',
            filter: 'blur(25px)',
            animation: reducedMotion ? 'none' : `float 8s ease-in-out infinite`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </>
  );
}
