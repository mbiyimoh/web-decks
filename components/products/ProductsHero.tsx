'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GOLD, TEXT_PRIMARY, TEXT_MUTED } from '@/lib/design-tokens';

export function ProductsHero() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Animated geometric background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Rotating grid pattern */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            width="800"
            height="800"
            viewBox="0 0 800 800"
          >
            {/* Outer ring */}
            <motion.circle
              cx="400"
              cy="400"
              r="300"
              fill="none"
              stroke="rgba(212,165,74,0.08)"
              strokeWidth="1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            {/* Middle ring */}
            <motion.circle
              cx="400"
              cy="400"
              r="200"
              fill="none"
              stroke="rgba(212,165,74,0.06)"
              strokeWidth="1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
            />
            {/* Inner ring */}
            <motion.circle
              cx="400"
              cy="400"
              r="100"
              fill="none"
              stroke="rgba(212,165,74,0.04)"
              strokeWidth="1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
            />
            {/* Diagonal lines */}
            {[0, 45, 90, 135].map((angle, i) => (
              <motion.line
                key={angle}
                x1="400"
                y1="100"
                x2="400"
                y2="700"
                stroke="rgba(212,165,74,0.05)"
                strokeWidth="1"
                style={{ transformOrigin: '400px 400px' }}
                initial={{ rotate: angle, opacity: 0 }}
                animate={{ rotate: angle, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
              />
            ))}
          </svg>
        </motion.div>

        {/* Floating dots */}
        {[
          { x: '20%', y: '30%', delay: 0, duration: 4 },
          { x: '80%', y: '25%', delay: 0.5, duration: 5 },
          { x: '15%', y: '70%', delay: 1, duration: 4.5 },
          { x: '85%', y: '65%', delay: 1.5, duration: 3.5 },
          { x: '50%', y: '15%', delay: 0.8, duration: 4.2 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: dot.x,
              top: dot.y,
              background: GOLD,
              opacity: 0.3,
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl">
        {/* Logo link */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link href="/" className="inline-block">
            <span className="text-6xl font-display" style={{ color: GOLD }}>
              33
            </span>
          </Link>
        </motion.div>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xs font-mono tracking-[0.2em] uppercase mb-6"
          style={{ color: GOLD }}
        >
          Our Products
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-6xl font-display leading-tight mb-6"
          style={{ color: TEXT_PRIMARY }}
        >
          AI-first Tools Built For Operators
          <br />
          <span style={{ color: GOLD }}>By Operators</span>
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl max-w-2xl mx-auto"
          style={{ color: TEXT_MUTED }}
        >
          We build the tools we wish existed. Each product solves a real problem we&apos;ve faced
          ourselves.
        </motion.p>
      </div>
    </section>
  );
}
