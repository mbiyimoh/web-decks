'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BG_PRIMARY, GOLD } from '@/lib/design-tokens';

export default function ComingSoon() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: BG_PRIMARY }}
    >
      {/* Subtle gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 400,
          background: `radial-gradient(ellipse, ${GOLD}08 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        className="relative z-10 text-center max-w-xl"
      >
        {/* Logo / Brand */}
        <h1
          className="text-3xl md:text-4xl font-display mb-6"
          style={{ color: GOLD }}
        >
          33 Strategies
        </h1>

        {/* Coming soon message */}
        <p className="text-xl md:text-2xl text-white font-display mb-4">
          Something new is coming.
        </p>
        <p className="text-base md:text-lg text-zinc-400 font-body mb-10">
          We&apos;re building AI systems that learn how you think.
        </p>

        {/* CTA */}
        <Link
          href="/contact"
          className="inline-block px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{
            backgroundColor: GOLD,
            color: BG_PRIMARY,
          }}
        >
          Get in touch
        </Link>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-zinc-700 text-xs font-body">
          &copy; 2026 33 Strategies
        </p>
      </div>
    </div>
  );
}
