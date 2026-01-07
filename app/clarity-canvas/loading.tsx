'use client';

import { motion } from 'framer-motion';

const GOLD = '#d4a54a';

export default function ClarityCanvasLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        {/* Animated spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-t-transparent"
          style={{ borderColor: `${GOLD} transparent ${GOLD} ${GOLD}` }}
        />

        {/* Loading text */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-zinc-400 text-sm"
        >
          Loading your canvas...
        </motion.p>
      </motion.div>
    </div>
  );
}
