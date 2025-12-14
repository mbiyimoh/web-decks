'use client';

import React, { useState } from 'react';

// TypeScript interfaces
interface DetailItem {
  type: 'deliverable' | 'meeting';
  text: string;
}

interface ServiceItem {
  id: string;
  icon: React.FC;
  title: string;
  value: number;
  description: string;
  details?: DetailItem[];
}

interface DeliverableItem {
  id: string;
  icon: React.FC;
  title: string;
  description: string;
  timeframe: string;
  basePrice: number;
}

interface Phase2Options {
  businessConsulting: boolean;
  technicalSupport: boolean;
}

type CompanyStage = 'idea' | 'prototype' | 'revenue' | 'growth';

// Brand colors
const GOLD = '#d4a54a';
const GOLD_GLOW = 'rgba(212,165,74,0.3)';
const BG_PRIMARY = '#0a0a0f';
const BG_ELEVATED = '#0d0d14';

// Icon components
const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const FileText = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
  </svg>
);

const MessageCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const Lightbulb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
  </svg>
);

const TrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const Users = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const Brain = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
  </svg>
);

const MousePointer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
  </svg>
);

const Rocket = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
  </svg>
);

const ShoppingCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const Trash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const Calendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const Wrench = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
);

// Section label component per brand guidelines
const SectionLabel = ({ number, title }: { number: string; title: string }) => (
  <p
    className="text-xs font-medium tracking-[0.2em] uppercase mb-4 font-mono"
    style={{ color: GOLD }}
  >
    {number} — {title}
  </p>
);

// Glass card component per brand guidelines
const GlassCard = ({ children, glow = false, className = '', style = {} }: { children: React.ReactNode; glow?: boolean; className?: string; style?: React.CSSProperties }) => (
  <div
    className={`rounded-xl border backdrop-blur-sm ${className}`}
    style={{
      background: 'rgba(255,255,255,0.03)',
      borderColor: glow ? GOLD : 'rgba(255,255,255,0.08)',
      boxShadow: glow ? `0 0 40px ${GOLD_GLOW}` : 'none',
      ...style,
    }}
  >
    {children}
  </div>
);

// Detail tile component - replaces long bullet lists
const DetailTile = ({ icon: Icon, label, items, color }: {
  icon: React.FC;
  label: string;
  items: string[];
  color: string;
}) => (
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-3">
      <div className={`${color}`}>
        <Icon />
      </div>
      <span className="text-xs font-mono font-medium tracking-wide uppercase" style={{ color }}>{label}</span>
    </div>
    <div className="grid grid-cols-1 gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="text-sm text-zinc-400 pl-0">
          {item}
        </div>
      ))}
    </div>
  </div>
);

// Service card with add to cart
interface ServiceCardProps {
  item: ServiceItem;
  inCart: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  phase: number;
}

const ServiceCard = ({ item, inCart, onAdd, onRemove }: ServiceCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;
  const price = item.value;

  const deliverables = item.details?.filter(d => d.type === 'deliverable').map(d => d.text) || [];
  const meetings = item.details?.filter(d => d.type === 'meeting').map(d => d.text) || [];

  return (
    <GlassCard className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,165,74,0.15)' }}
          >
            <div style={{ color: GOLD }}><Icon /></div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-display text-white">{item.title}</h3>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-display" style={{ color: GOLD }}>${price.toLocaleString()}</div>
              </div>
            </div>
            <p className="text-zinc-400 text-sm font-body">{item.description}</p>
          </div>
        </div>
      </div>

      {inCart ? (
        <button
          onClick={() => onRemove(item.id)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium font-body transition-all"
          style={{
            background: 'rgba(74,222,128,0.1)',
            color: '#4ade80',
            borderTop: '1px solid rgba(74,222,128,0.2)'
          }}
        >
          <Check />
          <span>Added to cart</span>
        </button>
      ) : (
        <button
          onClick={() => onAdd(item.id)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-white font-body transition-all"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212,165,74,0.1)';
            e.currentTarget.style.borderTopColor = 'rgba(212,165,74,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderTopColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <span>Add to cart</span>
          <span className="text-lg">+</span>
        </button>
      )}

      {item.details && (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-6 py-3 flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 font-mono tracking-wide uppercase"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            {isOpen ? <><span>Less details</span><ChevronUp /></> : <><span>More details</span><ChevronDown /></>}
          </button>
          {isOpen && (
            <div className="px-6 pb-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="grid md:grid-cols-2 gap-6">
                <DetailTile
                  icon={FileText}
                  label="Deliverables"
                  items={deliverables}
                  color="text-blue-400"
                />
                <DetailTile
                  icon={MessageCircle}
                  label="Consulting"
                  items={meetings}
                  color="text-green-400"
                />
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
};

// Deliverable option card
interface DeliverableCardProps {
  item: DeliverableItem;
  inCart: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

const DeliverableCard = ({ item, inCart, onAdd, onRemove }: DeliverableCardProps) => {
  const Icon = item.icon;

  return (
    <GlassCard glow={inCart} className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: inCart ? 'rgba(212,165,74,0.2)' : 'rgba(255,255,255,0.05)' }}
          >
            <div style={{ color: inCart ? GOLD : '#888' }}><Icon /></div>
          </div>
          {inCart && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#4ade80' }}>
              <Check />
            </div>
          )}
        </div>
        <h4 className="text-base font-display text-white mb-2">{item.title}</h4>
        <p className="text-xs text-zinc-500 mb-3 font-body">{item.description}</p>
        <div className="flex items-center justify-between text-sm pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-zinc-500 font-mono text-xs">{item.timeframe}</span>
          <span className="text-xl font-display" style={{ color: GOLD }}>${item.basePrice.toLocaleString()}</span>
        </div>
      </div>

      {inCart ? (
        <button
          onClick={() => onRemove(item.id)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium font-body"
          style={{
            background: 'rgba(74,222,128,0.1)',
            color: '#4ade80',
            borderTop: '1px solid rgba(74,222,128,0.2)'
          }}
        >
          <Check />
          <span>Selected</span>
        </button>
      ) : (
        <button
          onClick={() => onAdd(item.id)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 hover:text-white font-body transition-all"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212,165,74,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span>Select</span>
          <span className="text-lg">+</span>
        </button>
      )}
    </GlassCard>
  );
};

export default function PLYAProposal() {
  const [cart, setCart] = useState<(ServiceItem | DeliverableItem)[]>([]);
  const [viewMode, setViewMode] = useState<'shop' | 'cart'>('shop');
  const [equitySlider, setEquitySlider] = useState(0);
  const [companyStage, setCompanyStage] = useState<CompanyStage>('idea');
  const [phase2Options, setPhase2Options] = useState<Phase2Options>({
    businessConsulting: false,
    technicalSupport: false
  });

  const services: ServiceItem[] = [
    {
      id: 'thought',
      icon: Lightbulb,
      title: 'Developmental Thought Process & Business Development',
      value: 8000,
      description: 'Strategic thinking to crystallize your vision into an executable product concept, including comprehensive business development planning.',
      details: [
        { type: 'deliverable', text: 'Product vision documentation' },
        { type: 'deliverable', text: 'User journey maps' },
        { type: 'deliverable', text: 'Feature prioritization framework' },
        { type: 'deliverable', text: 'Business development strategy & roadmap' },
        { type: 'deliverable', text: 'Partnership & revenue model design' },
        { type: 'deliverable', text: 'Go-to-market strategy document' },
        { type: 'deliverable', text: 'Business model canvas' },
        { type: 'meeting', text: 'Product vision workshops' },
        { type: 'meeting', text: 'Technical feasibility sessions' },
        { type: 'meeting', text: 'Risk identification & mitigation planning' },
        { type: 'meeting', text: 'Business development strategy sessions' },
        { type: 'meeting', text: 'Business model refinement workshops' }
      ]
    },
    {
      id: 'validation',
      icon: TrendingUp,
      title: 'Market Validation',
      value: 3000,
      description: 'Competitive analysis, user research, and market positioning to validate product-market fit.',
      details: [
        { type: 'deliverable', text: 'Competitive landscape analysis report' },
        { type: 'deliverable', text: 'Market sizing & opportunity assessment' },
        { type: 'deliverable', text: 'Pricing strategy recommendations' },
        { type: 'deliverable', text: 'Early adopter profile & targeting plan' },
        { type: 'meeting', text: 'Target customer interviews' },
        { type: 'meeting', text: 'Market research review sessions' },
        { type: 'meeting', text: 'Competitive positioning workshops' }
      ]
    },
    {
      id: 'ai',
      icon: Brain,
      title: 'AI Expert Guidance',
      value: 4000,
      description: 'Technical architecture, AI capability assessment, and implementation strategy.',
      details: [
        { type: 'deliverable', text: 'AI capability assessment report' },
        { type: 'deliverable', text: 'Technical architecture documentation' },
        { type: 'deliverable', text: 'Model selection & evaluation framework' },
        { type: 'deliverable', text: 'Data pipeline design specifications' },
        { type: 'deliverable', text: 'Cost optimization strategy' },
        { type: 'meeting', text: 'Technical architecture review sessions' },
        { type: 'meeting', text: 'AI implementation planning' },
        { type: 'meeting', text: 'Performance & quality optimization consultations' }
      ]
    },
  ];

  const deliverables: DeliverableItem[] = [
    {
      id: 'deck',
      icon: FileText,
      title: 'Strategy Deck',
      description: 'Comprehensive presentation with full strategy, market analysis, and roadmap',
      timeframe: '33 days',
      basePrice: 2000,
    },
    {
      id: 'prototype',
      icon: MousePointer,
      title: 'Clickable Prototype',
      description: 'Interactive prototype demonstrating core user flows and key features',
      timeframe: '33 days',
      basePrice: 3000,
    },
    {
      id: 'mvp',
      icon: Rocket,
      title: 'Full MVP',
      description: 'Production-ready minimum viable product with deployment',
      timeframe: '45 days',
      basePrice: 5000,
    },
  ];

  const allItems = [...services, ...deliverables];

  const addToCart = (id: string) => {
    const item = allItems.find(i => i.id === id);
    if (item && !cart.find(c => c.id === id)) {
      setCart([...cart, item]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));
  const isInCart = (id: string) => cart.some(c => c.id === id);

  const calculateTotal = () => {
    const phase1Total = cart.reduce((sum, item) => sum + ('basePrice' in item ? item.basePrice : item.value), 0);
    const phase2Monthly = (phase2Options.businessConsulting ? 3000 : 0) + (phase2Options.technicalSupport ? 3000 : 0);

    const equityPct = equitySlider / 100;
    const cashPayment = phase1Total * (1 - equityPct);
    const equityPayment = phase1Total * equityPct;
    const equityPercent = (equityPayment / 10000) * 1;

    return {
      phase1Total,
      phase2Monthly,
      cashPayment,
      equityPayment,
      equityPercent: Math.min(equityPercent, 5)
    };
  };

  const getRecommendation = () => {
    const rec: Record<CompanyStage, { max: number; reasoning: string }> = {
      idea: { max: 3, reasoning: "Pre-product companies should preserve equity for future rounds" },
      prototype: { max: 2.5, reasoning: "Early-stage companies need flexibility for seed rounds" },
      revenue: { max: 2, reasoning: "Revenue-generating companies should minimize dilution" },
      growth: { max: 1.5, reasoning: "Growth-stage companies should prioritize cash" }
    };
    return rec[companyStage];
  };

  const totals = calculateTotal();
  const recommendation = getRecommendation();
  const hasPhase2 = phase2Options.businessConsulting || phase2Options.technicalSupport;

  if (viewMode === 'cart') {
    return (
      <div className="min-h-screen text-white font-body" style={{ background: BG_PRIMARY }}>
        {/* Background glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ background: GOLD }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 md:px-12 py-12">
          <button
            onClick={() => setViewMode('shop')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 font-body"
          >
            <ArrowLeft /><span className="text-sm">Back to proposal</span>
          </button>

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display mb-2">Your Cart</h1>
            <p className="text-zinc-400 font-body">{cart.length} {cart.length === 1 ? 'item' : 'items'} selected</p>
          </header>

          {cart.length === 0 ? (
            <GlassCard className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div className="text-zinc-500"><ShoppingCart /></div>
              </div>
              <p className="text-zinc-400 mb-4 font-body">Your cart is empty</p>
              <button
                onClick={() => setViewMode('shop')}
                className="px-6 py-3 text-white rounded-xl font-body font-medium"
                style={{ background: GOLD }}
              >
                Browse Services
              </button>
            </GlassCard>
          ) : (
            <>
              {/* Cart items */}
              <div className="mb-6">
                <SectionLabel number="01" title="Phase 1 — MVP Development" />
                <div className="space-y-3">
                  {cart.map(item => {
                    const Icon = item.icon;
                    const price = 'basePrice' in item ? item.basePrice : item.value;
                    return (
                      <GlassCard key={item.id} className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(212,165,74,0.15)' }}
                          >
                            <div style={{ color: GOLD }}><Icon /></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-display text-white mb-1">{item.title}</h3>
                            <p className="text-xs text-zinc-500 font-body">{item.description}</p>
                            {'timeframe' in item && <p className="text-xs text-zinc-600 mt-1 font-mono">{item.timeframe}</p>}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-display" style={{ color: GOLD }}>${price.toLocaleString()}</div>
                            <button onClick={() => removeFromCart(item.id)} className="text-zinc-500 hover:text-red-400">
                              <Trash />
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              </div>

              {/* Phase 2 options */}
              <div className="mb-8">
                <SectionLabel number="02" title="Phase 2 — Ongoing Support" />

                <div className="space-y-3">
                  {/* Business Consulting */}
                  <GlassCard className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(168,139,250,0.2)' }}
                          >
                            <div className="text-purple-400"><Users /></div>
                          </div>
                          <div>
                            <h4 className="text-lg font-display text-white mb-2">Ongoing Business Consulting</h4>
                            <p className="text-sm text-zinc-400 mb-4 font-body">Strategic guidance for growth and market adoption</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <DetailTile
                                icon={MessageCircle}
                                label="Sessions"
                                items={[
                                  'User growth strategy',
                                  'Feedback implementation',
                                  'Market expansion tactics',
                                  'Customer acquisition'
                                ]}
                                color="text-purple-400"
                              />
                              <DetailTile
                                icon={FileText}
                                label="Deliverables"
                                items={[
                                  'Monthly growth reports',
                                  'Strategic recommendations'
                                ]}
                                color="text-blue-400"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-xl font-display" style={{ color: GOLD }}>$3,000</div>
                          <div className="text-xs text-zinc-500 font-mono">/month</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setPhase2Options({...phase2Options, businessConsulting: !phase2Options.businessConsulting})}
                      className={`w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium font-body transition-all`}
                      style={{
                        background: phase2Options.businessConsulting ? 'rgba(168,139,250,0.15)' : 'transparent',
                        color: phase2Options.businessConsulting ? '#a78bfa' : '#888',
                        borderTop: `1px solid ${phase2Options.businessConsulting ? 'rgba(168,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`
                      }}
                    >
                      {phase2Options.businessConsulting ? (
                        <><Check /><span>Added to cart</span></>
                      ) : (
                        <><span>Add to cart</span><span className="text-lg">+</span></>
                      )}
                    </button>
                  </GlassCard>

                  {/* Technical Support */}
                  <GlassCard className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(96,165,250,0.2)' }}
                          >
                            <div className="text-blue-400"><Wrench /></div>
                          </div>
                          <div>
                            <h4 className="text-lg font-display text-white mb-2">Technical Support & AI Expertise</h4>
                            <p className="text-sm text-zinc-400 mb-4 font-body">Ongoing technical maintenance and AI optimization</p>
                            <div className="grid md:grid-cols-2 gap-4">
                              <DetailTile
                                icon={MessageCircle}
                                label="Sessions"
                                items={[
                                  'Change management',
                                  'Version upgrades',
                                  'User support',
                                  'AI optimization'
                                ]}
                                color="text-blue-400"
                              />
                              <DetailTile
                                icon={FileText}
                                label="Deliverables"
                                items={[
                                  'Monthly health reports',
                                  'Technical documentation'
                                ]}
                                color="text-green-400"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-xl font-display" style={{ color: GOLD }}>$3,000</div>
                          <div className="text-xs text-zinc-500 font-mono">/month</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setPhase2Options({...phase2Options, technicalSupport: !phase2Options.technicalSupport})}
                      className={`w-full px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium font-body transition-all`}
                      style={{
                        background: phase2Options.technicalSupport ? 'rgba(96,165,250,0.15)' : 'transparent',
                        color: phase2Options.technicalSupport ? '#60a5fa' : '#888',
                        borderTop: `1px solid ${phase2Options.technicalSupport ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`
                      }}
                    >
                      {phase2Options.technicalSupport ? (
                        <><Check /><span>Added to cart</span></>
                      ) : (
                        <><span>Add to cart</span><span className="text-lg">+</span></>
                      )}
                    </button>
                  </GlassCard>
                </div>
              </div>

              {/* Company stage selector */}
              <div className="mb-8">
                <SectionLabel number="03" title="Payment Structure" />
                <GlassCard className="p-6">
                  <label className="block text-sm font-medium text-white mb-3 font-body">Company Stage</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {([
                      { id: 'idea' as const, label: 'Idea Stage' },
                      { id: 'prototype' as const, label: 'Prototype' },
                      { id: 'revenue' as const, label: 'Has Revenue' },
                      { id: 'growth' as const, label: 'Growth' }
                    ]).map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => setCompanyStage(stage.id)}
                        className="px-4 py-3 rounded-lg text-sm font-medium font-body transition-all"
                        style={{
                          background: companyStage === stage.id ? GOLD : 'rgba(255,255,255,0.05)',
                          color: companyStage === stage.id ? '#000' : '#888'
                        }}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Payment structure slider */}
              <GlassCard className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-white font-body">Phase 1 Payment Structure</label>
                  <div className="text-sm text-zinc-400 font-mono">
                    {equitySlider === 0 ? '100% Cash' : equitySlider === 20 ? '20% Equity (Max)' : `${100-equitySlider}% Cash / ${equitySlider}% Equity`}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  value={equitySlider}
                  onChange={(e) => setEquitySlider(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ffffff ${(100-equitySlider)*5}%, ${GOLD} ${(100-equitySlider)*5}%)`
                  }}
                />

                <div className="flex justify-between mt-2 text-xs text-zinc-500 font-mono">
                  <span>All Cash</span>
                  <span>20% Equity (Maximum)</span>
                </div>

                {totals.equityPercent > 0 && (
                  <div
                    className="mt-4 p-3 rounded-lg"
                    style={{ background: 'rgba(212,165,74,0.1)', border: '1px solid rgba(212,165,74,0.2)' }}
                  >
                    <p className="text-xs text-zinc-300 font-body">
                      <span className="font-medium" style={{ color: GOLD }}>Equity estimate:</span> ~{totals.equityPercent.toFixed(2)}% for ${Math.round(totals.equityPayment).toLocaleString()} equity payment
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 font-body">Actual terms negotiated based on valuation</p>
                  </div>
                )}
              </GlassCard>

              {/* Equity recommendation */}
              <GlassCard className="p-5 mb-8" style={{ background: 'rgba(96,165,250,0.05)', borderColor: 'rgba(96,165,250,0.2)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(96,165,250,0.2)' }}
                  >
                    <div className="text-blue-400"><Lightbulb /></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-2 font-body">Recommendation for {companyStage} stage</p>
                    <p className="text-xs text-zinc-300 mb-2 font-body">
                      Max <span className="font-semibold text-blue-400">{recommendation.max}% equity</span> for projects of this scope. Maximum equity option is capped at 20%.
                    </p>
                    <p className="text-xs text-zinc-500 font-body">{recommendation.reasoning}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Total breakdown */}
              <GlassCard className="p-6 mb-8">
                <h3 className="text-lg font-display mb-4">Investment Summary</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-body">Phase 1 Subtotal</span>
                    <span className="text-white font-display">${totals.phase1Total.toLocaleString()}</span>
                  </div>

                  {equitySlider > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 font-body">Cash ({100-equitySlider}%)</span>
                        <span className="text-white font-display">${Math.round(totals.cashPayment).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 font-body">Equity ({equitySlider}%)</span>
                        <span className="font-display" style={{ color: GOLD }}>${Math.round(totals.equityPayment).toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  {hasPhase2 && (
                    <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-sm font-medium text-zinc-300 mb-2 font-body">Phase 2 Monthly Retainer:</div>
                      {phase2Options.businessConsulting && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400 font-body">Business Consulting</span>
                          <span className="text-purple-400 font-display">$3,000/mo</span>
                        </div>
                      )}
                      {phase2Options.technicalSupport && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400 font-body">Technical Support</span>
                          <span className="text-blue-400 font-display">$3,000/mo</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-zinc-400 font-medium font-body">Phase 2 Total</span>
                        <span className="text-white font-display">${totals.phase2Monthly.toLocaleString()}/mo</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-white font-body">Phase 1 Due at Start</span>
                    <span className="text-2xl font-display" style={{ color: GOLD }}>
                      ${Math.round(equitySlider === 0 ? totals.phase1Total : totals.cashPayment).toLocaleString()}
                    </span>
                  </div>
                  {equitySlider > 0 && (
                    <p className="text-xs text-zinc-500 text-right font-body">
                      + ~{totals.equityPercent.toFixed(2)}% equity (${Math.round(totals.equityPayment).toLocaleString()} value)
                    </p>
                  )}
                  {hasPhase2 && (
                    <p className="text-xs text-blue-400 text-right mt-1 font-body">
                      Phase 2: ${totals.phase2Monthly.toLocaleString()}/month starting after MVP delivery
                    </p>
                  )}
                </div>
              </GlassCard>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="flex-1 px-8 py-4 text-black font-semibold rounded-xl font-body transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #c49a42)` }}
                >
                  Request Proposal
                </button>
                <button
                  className="px-8 py-4 text-white font-semibold rounded-xl font-body transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Save for Later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-body" style={{ background: BG_PRIMARY }}>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${GOLD}, #c49a42);
          cursor: pointer;
          border: 2px solid ${BG_PRIMARY};
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${GOLD}, #c49a42);
          cursor: pointer;
          border: 2px solid ${BG_PRIMARY};
        }
      `}</style>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: GOLD }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 md:px-12 py-12">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display" style={{ color: GOLD }}>33</span>
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-mono">Strategies</span>
            </div>
            <button
              onClick={() => setViewMode('cart')}
              className="relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="text-zinc-400"><ShoppingCart /></div>
              {cart.length > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                  style={{ background: GOLD }}
                >
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-4">
            PLYA <span style={{ color: GOLD }}>Project Proposal</span>
          </h1>
          <p className="text-zinc-400 text-lg font-body leading-relaxed max-w-2xl">
            Build your custom engagement package for Phase 1 MVP development and optional Phase 2 ongoing support.
          </p>
        </header>

        {/* Project Overview */}
        <section className="mb-12">
          <SectionLabel number="00" title="About PLYA" />
          <GlassCard glow className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,165,74,0.2)' }}
              >
                <div style={{ color: GOLD }}><Rocket /></div>
              </div>
              <div>
                <h2 className="text-2xl font-display mb-3 text-white">AI-Powered Sports Platform</h2>
                <p className="text-zinc-300 text-sm font-body leading-relaxed">
                  PLYA is an AI-powered platform designed to revolutionize how athletes and sports enthusiasts connect,
                  train, and compete. The platform combines intelligent matchmaking, performance tracking, and community
                  building to create a comprehensive sports networking ecosystem.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ color: GOLD }}><Calendar /></div>
                  <span className="text-sm font-display" style={{ color: GOLD }}>Timeline</span>
                </div>
                <p className="text-xs text-zinc-400 font-body">33 days to MVP delivery</p>
              </div>
              <div
                className="rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ color: GOLD }}><Brain /></div>
                  <span className="text-sm font-display" style={{ color: GOLD }}>Approach</span>
                </div>
                <p className="text-xs text-zinc-400 font-body">AI-native development</p>
              </div>
              <div
                className="rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ color: GOLD }}><Users /></div>
                  <span className="text-sm font-display" style={{ color: GOLD }}>Target</span>
                </div>
                <p className="text-xs text-zinc-400 font-body">Athletes & sports communities</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Phase 1 Services */}
        <section className="mb-12">
          <SectionLabel number="01" title="MVP Development Services" />
          <p className="text-zinc-400 text-sm mb-6 font-body">Select the services you need for your 33-day sprint to MVP</p>
          <div className="space-y-4">
            {services.map(service => (
              <ServiceCard
                key={service.id}
                item={service}
                inCart={isInCart(service.id)}
                onAdd={addToCart}
                onRemove={removeFromCart}
                phase={1}
              />
            ))}
          </div>
        </section>

        {/* Deliverables */}
        <section className="mb-12">
          <SectionLabel number="02" title="Choose Your Deliverable" />
          <p className="text-zinc-400 text-sm mb-6 font-body">Select one deliverable option that best fits your needs</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deliverables.map(del => (
              <DeliverableCard
                key={del.id}
                item={del}
                inCart={isInCart(del.id)}
                onAdd={(id) => {
                  // Remove other deliverables first
                  deliverables.forEach(d => {
                    if (d.id !== id && isInCart(d.id)) {
                      removeFromCart(d.id);
                    }
                  });
                  addToCart(id);
                }}
                onRemove={removeFromCart}
              />
            ))}
          </div>
        </section>

        {cart.length > 0 && (
          <div
            className="fixed bottom-6 right-6 rounded-xl p-4 shadow-2xl"
            style={{
              background: BG_ELEVATED,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: `0 0 40px ${GOLD_GLOW}`
            }}
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1 font-mono">{cart.length} items</p>
                <p className="text-lg font-display" style={{ color: GOLD }}>${calculateTotal().phase1Total.toLocaleString()}</p>
              </div>
              <button
                onClick={() => setViewMode('cart')}
                className="px-6 py-3 text-black rounded-lg font-semibold font-body"
                style={{ background: GOLD }}
              >
                View Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
