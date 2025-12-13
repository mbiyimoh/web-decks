import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Design System - 33 Strategies brand
const ds = {
  colors: {
    bg: '#0a0a0f',
    bgElevated: '#0d0d14',
    bgCard: 'rgba(255,255,255,0.03)',
    text: '#f5f5f5',
    textMuted: '#888',
    textDim: '#555',
    accent: '#d4a54a',
    accentGlow: 'rgba(212,165,74,0.3)',
    border: 'rgba(255,255,255,0.08)',
    green: '#4ade80',
    blue: '#60a5fa',
    purple: '#a78bfa',
    red: '#f87171',
  },
  fonts: {
    display: '"Instrument Serif", Georgia, serif',
    body: '"DM Sans", -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
};

// Abstract Icon Components - Refined geometric shapes
const Icons = {
  // Lock - closed state (scarce)
  Lock: ({ color = ds.colors.textDim, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="10" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  ),
  
  // Unlock - open state (abundant)
  Unlock: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="10" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  ),
  
  // Target - vision, focus
  Target: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  ),
  
  // Layers - foundation, building blocks
  Layers: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.4" />
      <path d="M2 12L12 17L22 12" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
      <path d="M2 17L12 22L22 17" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  
  // Sparkle - output, excellence
  Sparkle: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1" fill={color} opacity="0.5" />
      <circle cx="5" cy="19" r="1" fill={color} opacity="0.5" />
    </svg>
  ),
  
  // Infinity - compounding, endless
  Infinity: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 12C6 9.5 8 8 10 8C13 8 12 12 12 12C12 12 11 16 14 16C16 16 18 14.5 18 12C18 9.5 16 8 14 8C11 8 12 12 12 12C12 12 13 16 10 16C8 16 6 14.5 6 12Z" stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  
  // Document - files, content
  Document: ({ color = ds.colors.blue, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 2V8H20" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="8" y1="17" x2="14" y2="17" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  ),
  
  // Network - connections, relationships
  Network: ({ color = ds.colors.purple, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="5" cy="18" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="19" cy="18" r="2.5" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="7.5" x2="6.5" y2="15.5" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="7.5" x2="17.5" y2="15.5" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="7.5" y1="18" x2="16.5" y2="18" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  ),
  
  // Broadcast - marketing, reach
  Broadcast: ({ color = ds.colors.green, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M12 5V2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 22V19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 12H2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 12H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.05 7.05L4.93 4.93" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M19.07 19.07L16.95 16.95" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M16.95 7.05L19.07 4.93" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M4.93 19.07L7.05 16.95" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  
  // Bolt - transformation, energy
  Bolt: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  
  // Compass - direction, vision
  Compass: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity="0.3" />
      <path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  ),
  
  // Puzzle - integration, fit
  Puzzle: ({ color = ds.colors.accent, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 8V6C4 4.9 4.9 4 6 4H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 16V18C4 19.1 4.9 20 6 20H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 4H18C19.1 4 20 4.9 20 6V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 20H18C19.1 20 20 19.1 20 18V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  
  // Chart - analytics, generic
  Chart: ({ color = ds.colors.textDim, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="14" width="4" height="6" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="10" width="4" height="10" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="16" y="6" width="4" height="14" rx="1" stroke={color} strokeWidth="1.5" />
    </svg>
  ),
  
  // Diamond - value, premium
  Diamond: ({ color = ds.colors.green, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 2L7 12L12 22" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.4" />
      <path d="M12 2L17 12L12 22" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.4" />
    </svg>
  ),
};

// Components
const Section = ({ children, className = '', id }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 ${className}`}
      style={{ background: ds.colors.bg }}
    >
      {children}
    </motion.section>
  );
};

const RevealText = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-5%" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div 
      className="fixed top-0 left-0 right-0 h-1 origin-left z-50" 
      style={{ scaleX, background: ds.colors.accent }} 
    />
  );
};

const GlassCard = ({ children, className = '', glow = false }) => (
  <div
    className={`rounded-xl p-5 border ${className}`}
    style={{
      background: ds.colors.bgCard,
      borderColor: glow ? ds.colors.accent : ds.colors.border,
      backdropFilter: 'blur(12px)',
      boxShadow: glow ? `0 0 40px ${ds.colors.accentGlow}` : 'none',
    }}
  >
    {children}
  </div>
);

const AccentText = ({ children }) => (
  <span style={{ color: ds.colors.accent }}>{children}</span>
);

// REFINED VISUALIZATION: The Shift - Yesterday vs Today
const ShiftVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  return (
    <div ref={ref} className="w-full">
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 0.6, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="h-full">
            <div className="flex items-start justify-between mb-4">
              <p className="uppercase tracking-wider text-xs" style={{ color: ds.colors.textDim, fontFamily: ds.fonts.mono }}>YESTERDAY</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${ds.colors.textDim}15` }}>
                <Icons.Lock color={ds.colors.textDim} size={20} />
              </div>
            </div>
            <p className="text-lg mb-2" style={{ color: ds.colors.text }}>Great answers were <span style={{ color: ds.colors.textMuted }}>scarce</span></p>
            <p className="text-sm" style={{ color: ds.colors.textDim }}>
              Expertise was the bottleneck. Finding someone who knew how required time, money, access.
            </p>
            <div className="mt-6 pt-4 flex items-center gap-3" style={{ borderTop: `1px solid ${ds.colors.border}` }}>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background: ds.colors.textDim, opacity: 0.3 + i * 0.2 }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: ds.colors.textDim }}>Knowledge behind gatekeepers</span>
            </div>
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard glow className="h-full">
            <div className="flex items-start justify-between mb-4">
              <p className="uppercase tracking-wider text-xs" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>TODAY</p>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ds.colors.accentGlow }}>
                <Icons.Unlock color={ds.colors.accent} size={20} />
              </div>
            </div>
            <p className="text-lg mb-2" style={{ color: ds.colors.text }}>Great answers are <AccentText>abundant</AccentText></p>
            <p className="text-sm" style={{ color: ds.colors.textMuted }}>
              LLMs give everyone access to expertise on demand. The answer is no longer the bottleneck.
            </p>
            <div className="mt-6 pt-4 flex items-center gap-3" style={{ borderTop: `1px solid ${ds.colors.accent}30` }}>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i} 
                    className="w-2 h-2 rounded-full" 
                    style={{ background: ds.colors.accent }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: ds.colors.accent }}>Knowledge democratized</span>
            </div>
          </GlassCard>
        </motion.div>
      </div>
      
      <motion.div 
        className="text-center mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-lg" style={{ color: ds.colors.text }}>
          When everyone has the same answers, the differentiator becomes the <AccentText>quality of input</AccentText>.
        </p>
      </motion.div>
    </div>
  );
};

// REFINED VISUALIZATION: Generic vs Thoughtful Contrast
const ContrastVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  return (
    <div ref={ref} className="w-full">
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="h-full">
            <p className="uppercase tracking-wider text-xs mb-4" style={{ color: ds.colors.textDim, fontFamily: ds.fonts.mono }}>GENERIC APPROACH</p>
            
            <div className="rounded-lg p-4 mb-4 border" style={{ background: ds.colors.bg, borderColor: ds.colors.border }}>
              <p className="text-sm" style={{ color: ds.colors.textMuted, fontFamily: ds.fonts.mono }}>"Build me an app kind of like Stripe"</p>
            </div>
            
            <p className="text-sm mb-4" style={{ color: ds.colors.textDim }}>
              The AI will produce something functional. It might even look decent. But it's generic — built from averages, lacking vision.
            </p>
            
            {/* Abstract representation of generic output */}
            <div className="flex justify-center gap-2 mb-4 py-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className="w-8 h-8 rounded" 
                  style={{ background: ds.colors.textDim, opacity: 0.15 }} 
                />
              ))}
            </div>
            
            <div className="pt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${ds.colors.border}` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: ds.colors.textDim }}></div>
              <p className="text-xs" style={{ color: ds.colors.textDim }}>Result: Functional commodity</p>
            </div>
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.35 }}
        >
          <GlassCard glow className="h-full">
            <p className="uppercase tracking-wider text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>THOUGHTFUL APPROACH</p>
            
            <div className="rounded-lg p-4 mb-4" style={{ background: `${ds.colors.accent}08`, border: `1px solid ${ds.colors.accent}30` }}>
              <p className="text-sm" style={{ color: ds.colors.text }}>
                "Here's my vision for payments in an AI-native world. The brand feels like X. The user journey prioritizes Y. We've researched Z..."
              </p>
            </div>
            
            <p className="text-sm mb-4" style={{ color: ds.colors.textMuted }}>
              Rich context, clear intent, specific expertise. The AI becomes an extension of your vision rather than a generic generator.
            </p>
            
            {/* Abstract representation of differentiated output */}
            <div className="flex justify-center items-end gap-2 mb-4 py-3">
              {[3, 5, 4, 6, 5].map((h, i) => (
                <motion.div 
                  key={i} 
                  className="w-8 rounded"
                  style={{ 
                    height: `${h * 6}px`, 
                    background: `linear-gradient(180deg, ${ds.colors.accent} 0%, ${ds.colors.accent}40 100%)`,
                    transformOrigin: 'bottom'
                  }}
                  initial={{ scaleY: 0 }}
                  animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                />
              ))}
            </div>
            
            <div className="pt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${ds.colors.accent}30` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: ds.colors.accent }}></div>
              <p className="text-xs" style={{ color: ds.colors.accent }}>Result: Differentiated, strategic output</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
      
      <motion.p 
        className="text-center mt-6 text-sm"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.5 }}
        style={{ color: ds.colors.textDim }}
      >
        Both use the same AI. The difference is entirely in what you bring to it.
      </motion.p>
    </div>
  );
};

// REFINED VISUALIZATION: Interview Flow
const InterviewFlowVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const steps = [
    { num: "1", title: "Smart Interview", desc: "Our tools ask the right questions to understand your vision, goals, brand, and strategy.", Icon: Icons.Target, color: ds.colors.accent },
    { num: "2", title: "Knowledge Foundation", desc: "That context becomes a rich foundation that informs everything the AI produces.", Icon: Icons.Layers, color: ds.colors.blue },
    { num: "3", title: "Exceptional Output", desc: "Results that are uniquely yours — not generic AI output, but an extension of your thinking.", Icon: Icons.Sparkle, color: ds.colors.purple },
    { num: "+", title: "Compounding Value", desc: "Your knowledge foundation grows. Every future AI interaction benefits from what you've built.", Icon: Icons.Infinity, color: ds.colors.accent, highlight: true },
  ];
  
  return (
    <div ref={ref} className="w-full">
      {/* Connection line */}
      <div className="hidden md:block relative mb-4">
        <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${ds.colors.border} 10%, ${ds.colors.border} 90%, transparent 100%)` }} />
      </div>
      
      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <GlassCard className="h-full" glow={step.highlight}>
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ 
                    background: step.highlight ? ds.colors.accentGlow : `${step.color}15`,
                    border: `1.5px solid ${step.highlight ? ds.colors.accent : step.color}50`,
                    color: step.color,
                    fontFamily: ds.fonts.mono
                  }}
                >
                  {step.num}
                </div>
                <div className="w-8 h-8 flex items-center justify-center" style={{ opacity: 0.8 }}>
                  <step.Icon color={step.color} size={20} />
                </div>
              </div>
              <p className="font-medium text-sm mb-2" style={{ color: step.highlight ? ds.colors.accent : ds.colors.text }}>{step.title}</p>
              <p className="text-xs" style={{ color: ds.colors.textDim }}>{step.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-xs" style={{ color: ds.colors.textMuted }}>
          This is the 3-layer stack: <AccentText>Business Context</AccentText> → Data Connections → AI Apps. The context layer is what makes everything else work.
        </p>
      </motion.div>
    </div>
  );
};

// REFINED: Product Card Component
const ProductCard = ({ product, index, isInView }) => {
  const questions = product.questions || [];
  const IconComponent = product.Icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="h-full"
    >
      <GlassCard className="h-full" glow={product.highlight}>
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ 
              background: `${product.color}12`,
              border: `1px solid ${product.color}30`
            }}
          >
            <IconComponent color={product.color} size={22} />
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: product.color }}>{product.name}</p>
            <p className="text-xs" style={{ color: ds.colors.textDim }}>{product.tagline}</p>
          </div>
        </div>
        
        <p className="text-sm mb-4" style={{ color: ds.colors.textMuted }}>{product.description}</p>
        
        {questions.length > 0 && (
          <div className="rounded-lg p-3 mb-4" style={{ background: ds.colors.bg }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: product.color, fontFamily: ds.fonts.mono }}>THE INTERVIEW</p>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5" style={{ background: product.color }} />
                  <p className="text-xs" style={{ color: ds.colors.textMuted }}>{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${ds.colors.border}` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: product.color }} />
          <p className="text-xs" style={{ color: ds.colors.textDim }}>
            <span style={{ color: product.color }}>Result:</span> {product.result}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

// REFINED: Products Grid Visual
const ProductsVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const products = [
    {
      name: "Conversational DocShare",
      tagline: "Chat-first document sharing",
      Icon: Icons.Document,
      color: ds.colors.blue,
      description: "Recipients engage with your content through conversation, not passive reading.",
      questions: [
        "Who is the audience for these documents?",
        "What tone should the AI use?",
        "What should it emphasize? Avoid?",
      ],
      result: "An AI profile trained to be your perfect messenger."
    },
    {
      name: "Better Networking",
      tagline: "Transform event connections",
      Icon: Icons.Network,
      color: ds.colors.purple,
      description: "AI-powered connection matching and meaningful engagement before, during, and after events.",
      questions: [
        "What are you hoping to get from this event?",
        "What's your current biggest challenge?",
        "What unique expertise do you bring?",
      ],
      result: "Rich profiles that power intelligent matching."
    },
    {
      name: "Marketing Automation",
      tagline: "Visual campaign orchestration",
      Icon: Icons.Broadcast,
      color: ds.colors.green,
      description: "Multi-channel campaigns with your brand identity baked into every piece of content.",
      questions: [
        "What's your brand voice and tone?",
        "What are your marketing goals?",
        "Who are your customer segments?",
      ],
      result: "Content that sounds like you, not generic AI.",
      highlight: true
    },
    {
      name: "30-Day Engagements",
      tagline: "Deep transformation",
      Icon: Icons.Bolt,
      color: ds.colors.accent,
      description: "The entire engagement IS the interview process. We immerse in your business.",
      questions: [
        "How does your business actually work?",
        "Where are the bottlenecks?",
        "What does your team need?",
      ],
      result: "One app + infrastructure to build 2-4 more on your own."
    },
  ];
  
  return (
    <div ref={ref} className="w-full">
      <div className="grid md:grid-cols-2 gap-5">
        {products.map((product, i) => (
          <ProductCard key={i} product={product} index={i} isInView={isInView} />
        ))}
      </div>
    </div>
  );
};

// REFINED: Two Modes Visual
const TwoModesVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  return (
    <div ref={ref} className="w-full">
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: `${ds.colors.textMuted}15`, border: `1.5px solid ${ds.colors.border}` }}>
                <span className="text-sm font-medium" style={{ color: ds.colors.textMuted, fontFamily: ds.fonts.mono }}>A</span>
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: ds.colors.text }}>Self-Serve Tools</p>
                <p className="text-xs" style={{ color: ds.colors.textDim }}>Interview built into the product</p>
              </div>
            </div>
            
            <p className="text-sm mb-4" style={{ color: ds.colors.textMuted }}>
              Some of our tools guide you through the interview process themselves. You iterate on your context, refine your foundation, get exceptional output.
            </p>
            
            {/* Abstract visual: self-guided flow */}
            <div className="flex items-center justify-center gap-2 py-4 mb-4">
              {[1, 2, 3, 4].map(i => (
                <React.Fragment key={i}>
                  <div className="w-6 h-6 rounded-md" style={{ background: `${ds.colors.textMuted}20`, border: `1px solid ${ds.colors.border}` }} />
                  {i < 4 && <div className="w-4 h-px" style={{ background: ds.colors.border }} />}
                </React.Fragment>
              ))}
            </div>
            
            <div className="rounded-lg p-3 mb-4" style={{ background: ds.colors.bg }}>
              <p className="text-xs mb-2" style={{ color: ds.colors.textDim, fontFamily: ds.fonts.mono }}>EXAMPLES</p>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>DocShare • Event profiles • Marketing strategy capture</p>
            </div>
            
            <p className="text-xs" style={{ color: ds.colors.textDim }}>
              The tool does the work of extracting context. You control the pace.
            </p>
          </GlassCard>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ delay: 0.35 }}
        >
          <GlassCard glow className="h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: ds.colors.accentGlow, border: `1.5px solid ${ds.colors.accent}` }}>
                <span className="text-sm font-medium" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>B</span>
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: ds.colors.accent }}>White-Glove Onboarding</p>
                <p className="text-xs" style={{ color: ds.colors.textDim }}>Interview with us directly</p>
              </div>
            </div>
            
            <p className="text-sm mb-4" style={{ color: ds.colors.textMuted }}>
              Some tools we believe require hands-on setup. We won't hand them to people who aren't willing to do the upfront work to make the output exceptional.
            </p>
            
            {/* Abstract visual: guided partnership */}
            <div className="flex items-center justify-center gap-3 py-4 mb-4">
              <div className="w-8 h-8 rounded-lg" style={{ background: ds.colors.accentGlow, border: `1px solid ${ds.colors.accent}` }} />
              <motion.div 
                className="flex gap-1"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ds.colors.accent }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ds.colors.accent, opacity: 0.6 }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: ds.colors.accent, opacity: 0.3 }} />
              </motion.div>
              <div className="w-8 h-8 rounded-lg" style={{ background: `${ds.colors.accent}15`, border: `1px solid ${ds.colors.accent}40` }} />
            </div>
            
            <div className="rounded-lg p-3 mb-4" style={{ background: `${ds.colors.accent}08`, border: `1px solid ${ds.colors.accent}20` }}>
              <p className="text-xs mb-2" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>EXAMPLES</p>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>Marketing automation setup • Complex integrations • Full 30-day engagements</p>
            </div>
            
            <p className="text-xs" style={{ color: ds.colors.textDim }}>
              We believe in thoughtful output. Some tools deserve more care.
            </p>
          </GlassCard>
        </motion.div>
      </div>
      
      <motion.p 
        className="text-center mt-6 text-sm"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.5 }}
        style={{ color: ds.colors.textMuted }}
      >
        Both paths lead to the same place: a rich foundation that makes AI work <AccentText>for you</AccentText>, not just for anyone.
      </motion.p>
    </div>
  );
};

// REFINED: Questions vs Answers Visual
const QuestionsAnswersVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  return (
    <div ref={ref} className="w-full py-4">
      <svg viewBox="0 0 600 180" className="w-full h-auto">
        <defs>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ds.colors.accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={ds.colors.accent} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* Left side - Answers (dimmed) */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
          transition={{ delay: 0.2 }}
        >
          <rect x="30" y="30" width="160" height="120" rx="8" fill="none" stroke={ds.colors.border} strokeWidth="1" />
          <rect x="30" y="30" width="160" height="120" rx="8" fill={ds.colors.bgCard} />
          
          <text x="110" y="60" fill={ds.colors.textDim} fontSize="10" textAnchor="middle" fontFamily={ds.fonts.mono}>ANSWERS</text>
          
          {/* Abstract bars representing commoditized output */}
          <rect x="50" y="80" width="100" height="6" rx="2" fill={ds.colors.textDim} opacity="0.2" />
          <rect x="50" y="92" width="80" height="6" rx="2" fill={ds.colors.textDim} opacity="0.2" />
          <rect x="50" y="104" width="90" height="6" rx="2" fill={ds.colors.textDim} opacity="0.2" />
          <rect x="50" y="116" width="70" height="6" rx="2" fill={ds.colors.textDim} opacity="0.2" />
          
          <text x="110" y="145" fill={ds.colors.textDim} fontSize="9" textAnchor="middle">Everyone has access</text>
        </motion.g>
        
        {/* Center arrow */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.4 }}
        >
          <line x1="210" y1="90" x2="280" y2="90" stroke={ds.colors.accent} strokeWidth="1.5" strokeDasharray="4,4" />
          <polygon points="285,90 275,85 275,95" fill={ds.colors.accent} />
          <text x="245" y="78" fill={ds.colors.accent} fontSize="8" textAnchor="middle" fontFamily={ds.fonts.mono}>SHIFT</text>
        </motion.g>
        
        {/* Right side - Questions (highlighted) */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.5 }}
        >
          <rect x="300" y="20" width="270" height="140" rx="8" fill="none" stroke={ds.colors.accent} strokeWidth="1.5" />
          <rect x="300" y="20" width="270" height="140" rx="8" fill={ds.colors.bgCard} />
          <rect x="300" y="20" width="270" height="140" rx="8" fill="url(#accentGrad)" opacity="0.1" />
          
          <text x="435" y="50" fill={ds.colors.accent} fontSize="11" textAnchor="middle" fontFamily={ds.fonts.mono}>QUESTIONS</text>
          <text x="435" y="70" fill={ds.colors.text} fontSize="10" textAnchor="middle">The new differentiator</text>
          
          {/* Abstract representation of rich context */}
          <g>
            <circle cx="350" cy="105" r="12" fill="none" stroke={ds.colors.accent} strokeWidth="1" opacity="0.4" />
            <circle cx="350" cy="105" r="6" fill={ds.colors.accent} opacity="0.6" />
            <text x="350" y="130" fill={ds.colors.textMuted} fontSize="8" textAnchor="middle">Vision</text>
          </g>
          <g>
            <rect x="393" y="93" width="24" height="24" rx="4" fill="none" stroke={ds.colors.accent} strokeWidth="1" opacity="0.4" />
            <rect x="399" y="99" width="12" height="12" rx="2" fill={ds.colors.accent} opacity="0.6" />
            <text x="405" y="130" fill={ds.colors.textMuted} fontSize="8" textAnchor="middle">Context</text>
          </g>
          <g>
            <polygon points="460,93 472,105 460,117 448,105" fill="none" stroke={ds.colors.accent} strokeWidth="1" opacity="0.4" />
            <polygon points="460,98 466,105 460,112 454,105" fill={ds.colors.accent} opacity="0.6" />
            <text x="460" y="130" fill={ds.colors.textMuted} fontSize="8" textAnchor="middle">Intent</text>
          </g>
          <g>
            <path d="M502 105 L515 93 L528 105 L515 117 Z" fill="none" stroke={ds.colors.accent} strokeWidth="1" opacity="0.4" />
            <circle cx="515" cy="105" r="4" fill={ds.colors.accent} opacity="0.6" />
            <text x="515" y="130" fill={ds.colors.textMuted} fontSize="8" textAnchor="middle">Strategy</text>
          </g>
          
          <text x="435" y="152" fill={ds.colors.accent} fontSize="9" textAnchor="middle" fontFamily={ds.fonts.mono}>= Exceptional Output</text>
        </motion.g>
      </svg>
    </div>
  );
};

// REFINED: Three Question Pillars
const QuestionPillars = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const pillars = [
    { label: "What experience do you want to create?", Icon: Icons.Compass },
    { label: "How do you want it to feel?", Icon: Icons.Sparkle },
    { label: "What gaps need to be filled?", Icon: Icons.Puzzle },
  ];
  
  return (
    <div ref={ref} className="flex justify-center gap-6 mt-8">
      {pillars.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex-1"
        >
          <GlassCard className="text-center h-full">
            <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ background: `${ds.colors.accent}15` }}>
              <item.Icon color={ds.colors.accent} size={20} />
            </div>
            <p className="text-xs" style={{ color: ds.colors.textMuted }}>{item.label}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

// REFINED: Why It Matters Comparison
const WhyItMattersVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const items = [
    { 
      title: "Generic AI", 
      desc: "Looks at what you've done. Produces averages. Could be anyone's.",
      Icon: Icons.Chart,
      color: ds.colors.textDim
    },
    { 
      title: "Our Products", 
      desc: "Understands what you want. Captures vision. Unmistakably yours.",
      Icon: Icons.Target,
      color: ds.colors.accent,
      highlight: true
    },
    { 
      title: "The Difference", 
      desc: "Not just data. Context, intent, strategy, brand. The richness of input.",
      Icon: Icons.Diamond,
      color: ds.colors.green
    },
  ];
  
  return (
    <div ref={ref} className="grid md:grid-cols-3 gap-4 mb-8">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        >
          <GlassCard glow={item.highlight} className="text-center h-full">
            <div 
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ 
                background: item.highlight ? ds.colors.accentGlow : `${item.color}12`,
                border: `1px solid ${item.highlight ? ds.colors.accent : item.color}30`
              }}
            >
              <item.Icon color={item.color} size={24} />
            </div>
            <p className="font-medium text-sm mb-2" style={{ color: item.color }}>{item.title}</p>
            <p className="text-xs" style={{ color: ds.colors.textMuted }}>{item.desc}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

// Main Deck Component
export default function QuestionAdvantageDeck() {
  return (
    <div className="text-white min-h-screen overflow-x-hidden relative" style={{ fontFamily: ds.fonts.body, background: ds.colors.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>
      
      <ProgressBar />

      {/* SLIDE 1: Title */}
      <Section id="title" className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: ds.colors.accent }} />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-6" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>THE QUESTION ADVANTAGE</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6" style={{ fontFamily: ds.fonts.display }}>
              In a World of <AccentText>Infinite Answers</AccentText>,<br />
              the Winners Ask <AccentText>Better Questions</AccentText>
            </h1>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-lg md:text-xl mb-12" style={{ color: ds.colors.textMuted }}>
              How 33 Strategies products and engagements extract the rich context<br />
              that makes AI outputs exceptional.
            </p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <GlassCard className="inline-block px-8 py-4">
              <p className="text-xl" style={{ fontFamily: ds.fonts.display }}>
                <AccentText>33</AccentText> Strategies
              </p>
            </GlassCard>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 2: The New Reality */}
      <Section id="reality">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>01 — The New Reality</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              The answer is no longer the <AccentText>bottleneck.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>LLMs have democratized access to expertise. The game has fundamentally changed.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <ShiftVisual />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 3: The Insight */}
      <Section id="insight">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>02 — The Insight</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Same tool. <AccentText>Vastly different results.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>The quality of AI output is directly proportional to the richness of human input.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <ContrastVisual />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 4: Questions > Answers */}
      <Section id="questions">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>03 — The Shift</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              The differentiator is who can ask <AccentText>better questions.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>Vision. Context. Intent. Strategy. Brand identity. These are what separate exceptional from generic.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard className="py-4">
              <QuestionsAnswersVisual />
            </GlassCard>
          </RevealText>
          
          <RevealText delay={0.3}>
            <QuestionPillars />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 5: Our Differentiator */}
      <Section id="differentiator">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>04 — Our Differentiator</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Thoughtful, intentional <AccentText>interview processes.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <GlassCard glow className="mb-8">
              <p className="text-lg text-center" style={{ color: ds.colors.text }}>
                Every 33 Strategies product and engagement is designed around<br />
                <AccentText>extracting rich context through thoughtful, intentional questions.</AccentText>
              </p>
            </GlassCard>
          </RevealText>
          
          <RevealText delay={0.2}>
            <InterviewFlowVisual />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 6: The Products */}
      <Section id="products">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>05 — How It Manifests</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Every product. <AccentText>Every engagement.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>The interview process is built into everything we do.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <ProductsVisual />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 7: Two Ways */}
      <Section id="modes">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>06 — Two Ways to Work With Us</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Self-serve <span style={{ color: ds.colors.textMuted }}>or</span> <AccentText>white-glove.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>Different paths to the same destination: a rich foundation that makes AI exceptional.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <TwoModesVisual />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 8: Why It Matters */}
      <Section id="why">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>07 — Why It Matters</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Google can scrape your past work.<br />
              <AccentText>We capture your intent.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>That's why our output will always be better than generic AI tools.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <WhyItMattersVisual />
          </RevealText>
          
          <RevealText delay={0.3}>
            <GlassCard className="text-center">
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>
                "You'll see Google and others put tools out there for this. But our thing — what makes us different — 
                is the <AccentText>thoughtfulness we put into the input</AccentText>. If we have your vision, goals, and brand identity captured, 
                your output will be way better than what Google gives you, even if they can scrape your past work."
              </p>
            </GlassCard>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 9: Close */}
      <Section id="close" className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-15" style={{ background: ds.colors.accent }} />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <RevealText>
            <h2 className="text-4xl md:text-5xl mb-8" style={{ fontFamily: ds.fonts.display }}>
              Better <AccentText>questions</AccentText>.<br />
              Better <AccentText>context</AccentText>.<br />
              Better <AccentText>results</AccentText>.
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <GlassCard glow className="mb-10">
              <p className="text-lg" style={{ color: ds.colors.textMuted }}>
                In a world where AI gives everyone the same capabilities, we help you bring the 
                <AccentText> richness of input</AccentText> that makes your output exceptional.
              </p>
            </GlassCard>
          </RevealText>
          
          <RevealText delay={0.25}>
            <div className="inline-block px-8 py-4 rounded-xl"
              style={{ background: ds.colors.bgCard, border: `1px solid ${ds.colors.accent}`, boxShadow: `0 0 60px ${ds.colors.accentGlow}` }}>
              <p className="text-2xl" style={{ fontFamily: ds.fonts.display }}>
                <AccentText>33</AccentText> Strategies
              </p>
            </div>
          </RevealText>
          
          <RevealText delay={0.35}>
            <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${ds.colors.border}` }}>
              <p style={{ color: ds.colors.textDim }} className="text-sm">Mbiyimoh Ghogomu</p>
              <p style={{ color: ds.colors.textDim }} className="text-xs mt-1">beems@33strategies.com</p>
            </div>
          </RevealText>
        </div>
      </Section>
    </div>
  );
}
