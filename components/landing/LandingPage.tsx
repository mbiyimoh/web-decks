'use client';

import { motion } from 'framer-motion';

// Geometric animation component - concentric rotating rings
function GeometricAnimation() {
  const rings = [
    { radius: 80, dots: 8, duration: 30, direction: 1 },
    { radius: 120, dots: 12, duration: 45, direction: -1 },
    { radius: 160, dots: 16, duration: 60, direction: 1 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <svg
        className="w-[400px] h-[400px] md:w-[600px] md:h-[600px]"
        viewBox="0 0 400 400"
      >
        {rings.map((ring, ringIndex) => (
          <motion.g
            key={ringIndex}
            style={{ originX: '200px', originY: '200px' }}
            animate={{ rotate: 360 * ring.direction }}
            transition={{
              duration: ring.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Ring circle */}
            <circle
              cx="200"
              cy="200"
              r={ring.radius}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
            {/* Dots on ring */}
            {Array.from({ length: ring.dots }).map((_, dotIndex) => {
              const angle = (dotIndex / ring.dots) * Math.PI * 2;
              const x = 200 + Math.cos(angle) * ring.radius;
              const y = 200 + Math.sin(angle) * ring.radius;
              return (
                <circle
                  key={dotIndex}
                  cx={x}
                  cy={y}
                  r={dotIndex % 4 === 0 ? 3 : 1.5}
                  fill={dotIndex % 4 === 0 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.15)'}
                />
              );
            })}
          </motion.g>
        ))}
        {/* Center glow */}
        <circle
          cx="200"
          cy="200"
          r="40"
          fill="url(#centerGlow)"
        />
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.1)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0)" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Geometric background animation */}
      <GeometricAnimation />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="mb-6"
        >
          <span className="text-7xl md:text-9xl font-bold font-display tracking-tight">
            33
          </span>
          <p className="text-zinc-400 uppercase tracking-[0.4em] text-sm md:text-base mt-2">
            Strategies
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-xl md:text-2xl text-zinc-300 leading-relaxed mb-12 font-light"
        >
          Build brilliant things with brilliant people.
        </motion.p>

        {/* Coming Soon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          className="inline-block"
        >
          <div className="px-6 py-3 bg-zinc-900/80 border border-zinc-800 rounded-full backdrop-blur-sm">
            <span className="text-amber-500 font-medium tracking-wide">
              Coming Soon
            </span>
          </div>
        </motion.div>

        {/* Contact link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12"
        >
          <a
            href="mailto:whatsgood@33strategies.ai"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            whatsgood@33strategies.ai
          </a>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute bottom-8 text-zinc-700 text-xs"
      >
        &copy; 2025 33 Strategies
      </motion.p>
    </div>
  );
}
