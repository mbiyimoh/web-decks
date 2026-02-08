'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GOLD, BG_SURFACE } from '@/lib/design-tokens';
import type { Product } from '@/lib/products';

interface ProductMiniCardProps {
  product: Product;
  reducedMotion?: boolean;
}

/**
 * ProductMiniCard - Compact product preview card
 * Shows product name, tagline, and status badge.
 * Links to external URL or contact form.
 */
export function ProductMiniCard({ product, reducedMotion }: ProductMiniCardProps) {
  const href = product.externalUrl || `/contact?product=${product.id}`;
  const isExternal = !!product.externalUrl;

  const statusColors = {
    available: { bg: '#22c55e20', text: '#22c55e', label: 'AVAILABLE' },
    beta: { bg: `${GOLD}20`, text: GOLD, label: 'BETA' },
    'by-request': { bg: '#3b82f620', text: '#60a5fa', label: 'BY REQUEST' },
  };

  const status = statusColors[product.status];

  return (
    <motion.div
      className="rounded-2xl p-5 md:p-6 h-full flex flex-col group cursor-pointer transition-all duration-300"
      style={{
        backgroundColor: BG_SURFACE,
        border: '1px solid #27272a',
      }}
      whileHover={
        reducedMotion
          ? {}
          : {
              y: -4,
              borderColor: `${GOLD}40`,
              boxShadow: `0 0 30px ${GOLD}08`,
            }
      }
    >
      <Link
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="flex flex-col h-full"
      >
        {/* Product name */}
        <h3 className="text-lg font-display text-white mb-2">
          <span style={{ color: GOLD }}>{product.nameGold}</span>
          <span className="text-white">{product.nameWhite}</span>
        </h3>

        {/* Divider */}
        <div
          className="w-8 h-px mb-3"
          style={{ backgroundColor: `${GOLD}30` }}
        />

        {/* Tagline */}
        <p className="text-sm text-zinc-400 leading-relaxed flex-1 mb-4 font-body">
          {product.tagline}
        </p>

        {/* Status badge */}
        <div
          className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full w-fit"
          style={{
            backgroundColor: status.bg,
            color: status.text,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: status.text }}
          />
          {status.label}
        </div>
      </Link>
    </motion.div>
  );
}
