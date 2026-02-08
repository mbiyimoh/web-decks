'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { GOLD } from '@/lib/design-tokens';
import { PRODUCTS, type Product } from '@/lib/products';
import { ProductMiniCard } from '../components/ProductMiniCard';
import { SectionLabel } from '../components/SectionLabel';

interface ProductsPreviewSectionProps {
  reducedMotion?: boolean;
}

// Featured products for landing page preview
const FEATURED_PRODUCT_IDS = ['better-contacts', 'marketing-automation', 'talking-docs'];

export function ProductsPreviewSection({ reducedMotion }: ProductsPreviewSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  // Map to preserve intended order from FEATURED_PRODUCT_IDS
  const featuredProducts = FEATURED_PRODUCT_IDS.map((id) =>
    PRODUCTS.find((p) => p.id === id)
  ).filter((p): p is Product => p !== undefined);

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.1,
        delayChildren: reducedMotion ? 0 : 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.6, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 20 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : delay },
  });

  return (
    <section ref={ref} className="py-16 md:py-24 lg:py-32 px-6 md:px-12 lg:px-16">
      <div className="max-w-5xl mx-auto">
        <SectionLabel
          number="04"
          title="The Products"
          reducedMotion={reducedMotion}
        />

        <motion.p
          {...fadeUp(0.1)}
          className="text-base md:text-lg text-zinc-400 mb-10 md:mb-12 max-w-2xl font-body"
        >
          Tools born from our own workflows — included with every engagement.
        </motion.p>

        {/* Product cards grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-8 md:mb-10"
        >
          {featuredProducts.map((product) => (
            <motion.div key={product.id} variants={item}>
              <ProductMiniCard product={product} reducedMotion={reducedMotion} />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA to products page */}
        <motion.div {...fadeUp(0.4)} className="text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
            style={{ color: GOLD }}
          >
            <span>Explore all products</span>
            <span>&rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
