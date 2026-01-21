'use client';

import Link from 'next/link';
import { PRODUCTS } from '@/lib/products';
import { BG_PRIMARY, TEXT_MUTED, GOLD } from '@/lib/design-tokens';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductCard } from '@/components/products/ProductCard';

export default function ProductsPageClient() {
  return (
    <div className="min-h-screen" style={{ background: BG_PRIMARY }}>
      {/* Hero */}
      <ProductsHero />

      {/* Products List */}
      <section className="px-6 pb-20">
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
