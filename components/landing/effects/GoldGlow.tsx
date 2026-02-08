'use client';

/**
 * GoldGlow - CSS-only breathing glow effect
 * Mobile baseline effect that works without JavaScript animation overhead.
 * Respects prefers-reduced-motion via CSS media query.
 */
export function GoldGlow() {
  return (
    <>
      {/* Hero section glow */}
      <div
        className="absolute top-[30vh] left-1/2 -translate-x-1/2 w-[300px] h-[200px] md:w-[500px] md:h-[350px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(212,165,74,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'breathe 5s ease-in-out infinite',
        }}
      />

      {/* CTA section glow */}
      <div
        className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 w-[350px] h-[250px] md:w-[600px] md:h-[400px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(212,165,74,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'breathe 6s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />

      <style jsx>{`
        @keyframes breathe {
          0%,
          100% {
            opacity: 0.6;
            transform: translate(-50%, 0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.08);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
