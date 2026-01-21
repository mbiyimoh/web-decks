'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product, ProductBenefit, ProductMockup } from '@/lib/products';
import { BG_SURFACE, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM, GOLD } from '@/lib/design-tokens';
import { ProductStatusBadge } from './ProductStatusBadge';

// Icon components
function BenefitIcon({ icon }: { icon: ProductBenefit['icon'] }) {
  const iconProps = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: GOLD,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (icon) {
    case 'ai':
      return (
        <svg {...iconProps}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case 'link':
      return (
        <svg {...iconProps}>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...iconProps}>
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <path d="M12 19v4M8 23h8" />
        </svg>
      );
    case 'search':
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case 'users':
      return (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'target':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...iconProps}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...iconProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'brain':
      return (
        <svg {...iconProps}>
          <path d="M12 2a4 4 0 014 4v1a4 4 0 01-2 3.46V12a4 4 0 01-4 4 4 4 0 01-4-4v-1.54A4 4 0 014 7V6a4 4 0 014-4h4z" />
          <path d="M9 22v-4M15 22v-4M12 16v6" />
          <circle cx="9" cy="9" r="1" fill={GOLD} />
          <circle cx="15" cy="9" r="1" fill={GOLD} />
        </svg>
      );
    case 'context':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      );
    default:
      return null;
  }
}

// iPhone frame component - based on Flowbite device mockups
function IPhoneFrame({ label, imageSrc }: { label: string; imageSrc?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* iPhone frame - larger size for visibility */}
      <div
        className="relative border-[10px] rounded-[2.2rem]"
        style={{
          width: 180,
          height: 368,
          borderColor: '#1f1f23',
          backgroundColor: '#1f1f23',
        }}
      >
        {/* Left buttons */}
        <div
          className="absolute rounded-s-sm"
          style={{
            width: 4,
            height: 28,
            backgroundColor: '#1f1f23',
            left: -14,
            top: 75,
          }}
        />
        <div
          className="absolute rounded-s-sm"
          style={{
            width: 4,
            height: 48,
            backgroundColor: '#1f1f23',
            left: -14,
            top: 120,
          }}
        />
        <div
          className="absolute rounded-s-sm"
          style={{
            width: 4,
            height: 48,
            backgroundColor: '#1f1f23',
            left: -14,
            top: 180,
          }}
        />
        {/* Right button */}
        <div
          className="absolute rounded-e-sm"
          style={{
            width: 4,
            height: 64,
            backgroundColor: '#1f1f23',
            right: -14,
            top: 140,
          }}
        />
        {/* Screen area */}
        <div
          className="rounded-[1.5rem] overflow-hidden w-full h-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full z-10"
            style={{
              width: 54,
              height: 14,
              backgroundColor: '#1f1f23',
            }}
          />
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={label}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span
              className="text-[11px] font-mono"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Screenshot
            </span>
          )}
        </div>
      </div>
      <p
        className="text-[11px] text-center font-mono tracking-wide"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </p>
    </div>
  );
}

// MacBook frame component - based on Flowbite device mockups
function MacBookFrame({ label, imageSrc }: { label: string; imageSrc?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* MacBook screen */}
      <div
        className="relative border-[6px] rounded-t-xl"
        style={{
          width: 340,
          height: 212,
          borderColor: '#1f1f23',
          backgroundColor: '#1f1f23',
        }}
      >
        {/* Camera notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full z-10"
          style={{
            width: 8,
            height: 8,
            backgroundColor: '#2a2a2e',
            top: 6,
          }}
        />
        {/* Screen area */}
        <div
          className="rounded-md overflow-hidden w-full h-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={label}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span
              className="text-[12px] font-mono"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Screenshot
            </span>
          )}
        </div>
      </div>
      {/* MacBook base/keyboard */}
      <div
        className="relative rounded-b-xl"
        style={{
          width: 380,
          height: 14,
          backgroundColor: '#1f1f23',
          marginTop: -12,
        }}
      >
        {/* Trackpad notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-b-lg"
          style={{
            width: 60,
            height: 6,
            backgroundColor: '#2a2a2e',
            top: 0,
          }}
        />
      </div>
      <p
        className="text-[11px] text-center font-mono tracking-wide"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </p>
    </div>
  );
}

// Mockup component that renders the appropriate device frame
function MockupPlaceholder({ mockup }: { mockup: ProductMockup }) {
  if (mockup.type === 'desktop') {
    return <MacBookFrame label={mockup.label} imageSrc={mockup.imageSrc} />;
  }
  return <IPhoneFrame label={mockup.label} imageSrc={mockup.imageSrc} />;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const isExternal = !!product.externalUrl;
  const href = isExternal
    ? product.externalUrl!
    : `/contact?product=${product.contactFormProduct || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative rounded-2xl p-8 md:p-10 transition-all duration-300"
      style={{
        background: BG_SURFACE,
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 40px rgba(212,165,74,0.15), inset 0 0 0 1px rgba(212,165,74,0.2)`,
        }}
      />

      <div className="relative">
        {/* Header: Status badge + Product wordmark */}
        <div className="mb-6">
          <ProductStatusBadge status={product.status} />
          <p
            className="mt-4 text-sm font-mono font-semibold tracking-wide uppercase"
            style={{ color: TEXT_DIM }}
          >
            Alias:
          </p>
          <h3 className="mt-1 text-4xl md:text-5xl lg:text-6xl font-display">
            <span style={{ color: GOLD }}>{product.nameGold}</span>
            <span style={{ color: TEXT_PRIMARY }}> {product.nameWhite}</span>
          </h3>
        </div>

        {/* Tagline - Large impact statement */}
        <p
          className="text-xl md:text-2xl lg:text-3xl font-display leading-relaxed mb-8"
          style={{ color: TEXT_PRIMARY }}
        >
          {product.tagline}
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {product.benefits.map((benefit, i) => (
            <div
              key={i}
              className="p-5 rounded-xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="mb-4">
                <BenefitIcon icon={benefit.icon} />
              </div>
              <h4
                className="text-base font-semibold mb-2"
                style={{ color: TEXT_PRIMARY }}
              >
                {benefit.title}
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED }}>
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mockups Row - Centered, full width (hidden if no mockups) */}
        {product.mockups.length > 0 && (
          <div className="flex items-end justify-center gap-6 mb-8">
            {product.mockups.map((mockup, i) => (
              <MockupPlaceholder key={i} mockup={mockup} />
            ))}
          </div>
        )}

        {/* CTA - Full width on mobile, 40% centered on tablet/desktop */}
        <div className="flex justify-center">
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full md:w-[40%] py-4 rounded-lg font-semibold text-base transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: GOLD,
                color: '#0a0a0f',
              }}
            >
              {product.ctaLabel}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          ) : (
            <Link
              href={href}
              className="flex items-center justify-center gap-2 w-full md:w-[40%] py-4 rounded-lg font-semibold text-base transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'transparent',
                border: `1px solid ${GOLD}`,
                color: GOLD,
              }}
            >
              {product.ctaLabel}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
