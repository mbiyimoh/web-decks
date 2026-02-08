'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GOLD, BG_PRIMARY } from '@/lib/design-tokens';

/**
 * Nav - Navigation bar with hide-on-scroll behavior
 * Hides when scrolling down, shows when scrolling up.
 * Fixed position with backdrop blur.
 */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 100 && y > lastScroll.current);
      lastScroll.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: `${BG_PRIMARY}ee`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-display">
            <span style={{ color: GOLD }}>33</span>
            <span className="text-white ml-1">Strategies</span>
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm text-zinc-500 hidden md:inline hover:text-zinc-300 transition-colors"
          >
            Products
          </Link>
          <a
            href="#cta"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ border: `1px solid ${GOLD}60`, color: GOLD }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${GOLD}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Start a Conversation
          </a>
        </div>
      </div>
      {/* Bottom border gradient */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`,
        }}
      />
    </motion.nav>
  );
}
