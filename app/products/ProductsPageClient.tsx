'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PRODUCTS } from '@/lib/products';
import { BG_PRIMARY, TEXT_MUTED, TEXT_PRIMARY, GOLD } from '@/lib/design-tokens';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductCard } from '@/components/products/ProductCard';

export default function ProductsPageClient() {
  return (
    <div className="min-h-screen" style={{ background: BG_PRIMARY }}>
      {/* Hero */}
      <ProductsHero />

      {/* Philosophy Statement */}
      <section className="px-6 pb-16 -mt-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl font-display"
            style={{ color: TEXT_PRIMARY }}
          >
            We are thinkers first and foremost.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg md:text-xl"
            style={{ color: TEXT_MUTED }}
          >
            But great ideas are meaningless without follow through.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg md:text-xl"
            style={{ color: TEXT_MUTED }}
          >
            So we build things that reduce the latency between{' '}
            <span className="font-display" style={{ color: GOLD }}>thought</span> and{' '}
            <span className="font-display" style={{ color: GOLD }}>execution</span>.
          </motion.p>
        </div>
      </section>

      {/* Products List */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {PRODUCTS.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-12"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {/* Logo */}
          <div className="md:flex-1">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-display" style={{ color: GOLD }}>
                33
              </span>
            </Link>
          </div>

          {/* Contact Link - Centered */}
          <div className="md:flex-1 text-center">
            <Link
              href="/contact"
              className="text-sm transition-colors hover:text-white"
              style={{ color: TEXT_MUTED }}
            >
              Get in Touch
            </Link>
          </div>

          {/* Copyright */}
          <div className="md:flex-1 md:text-right">
            <p className="text-sm" style={{ color: TEXT_MUTED }}>
              &copy; {new Date().getFullYear()} 33 Strategies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
