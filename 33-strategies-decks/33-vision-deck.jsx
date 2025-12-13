import React, { useRef, useState, useEffect } from 'react';
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

// S-Curve Visualization (from previous deck)
const SCurveChart = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  
  const curvePath = "M 40 280 Q 80 275, 120 260 Q 180 230, 220 180 Q 260 120, 300 80 Q 340 50, 400 40 Q 460 35, 520 33 L 560 32";
  const valuePath = "M 40 295 L 100 293 L 160 290 L 220 285 Q 260 278, 290 265 Q 320 245, 350 210 Q 380 160, 410 90 Q 430 40, 450 -20";
  
  return (
    <div ref={ref} className="w-full">
      <svg viewBox="0 0 600 320" className="w-full h-auto">
        <defs>
          <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ds.colors.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ds.colors.accent} stopOpacity="1" />
          </linearGradient>
          <linearGradient id="valueGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={ds.colors.green} stopOpacity="0.3" />
            <stop offset="100%" stopColor={ds.colors.green} stopOpacity="1" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x="40" y="0" width="520" height="300" />
          </clipPath>
        </defs>
        
        {[80, 160, 240].map((y, i) => (
          <line key={i} x1="40" y1={y} x2="560" y2={y} stroke={ds.colors.border} strokeWidth="1" />
        ))}
        {[120, 200, 280, 360, 440, 520].map((x, i) => (
          <line key={i} x1={x} y1="20" x2={x} y2="300" stroke={ds.colors.border} strokeWidth="1" />
        ))}
        
        <line x1="290" y1="20" x2="290" y2="300" stroke={ds.colors.accent} strokeWidth="2" strokeDasharray="6,4" />
        <text x="290" y="315" fill={ds.colors.accent} fontSize="11" textAnchor="middle" fontFamily={ds.fonts.mono}>NOW</text>
        
        <motion.path
          d={curvePath}
          fill="none"
          stroke="url(#techGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        <g clipPath="url(#chartClip)">
          <motion.path
            d={valuePath}
            fill="none"
            stroke="url(#valueGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          />
        </g>
        
        <motion.rect x="380" y="25" width="180" height="40" rx="4" fill={ds.colors.accent} opacity="0.1"
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.1 } : { opacity: 0 }} transition={{ delay: 1 }} />
        <text x="470" y="50" fill={ds.colors.accent} fontSize="10" textAnchor="middle" fontFamily={ds.fonts.mono}>PLATEAU</text>
        
        <motion.g initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.2 }}>
          <circle cx="290" cy="265" r="8" fill={ds.colors.green} />
          <circle cx="290" cy="265" r="12" fill="none" stroke={ds.colors.green} strokeWidth="2" opacity="0.5" />
          <line x1="300" y1="255" x2="340" y2="230" stroke={ds.colors.green} strokeWidth="1" />
          <text x="345" y="225" fill={ds.colors.green} fontSize="10" fontFamily={ds.fonts.mono}>WE ARE HERE</text>
        </motion.g>
        
        <motion.rect x="290" y="40" width="120" height="225" rx="4" fill={ds.colors.green} opacity="0.06"
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.06 } : { opacity: 0 }} transition={{ delay: 1.4 }} />
        <motion.g initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.5 }}>
          <text x="350" y="140" fill={ds.colors.green} fontSize="11" textAnchor="middle" fontFamily={ds.fonts.mono}>THE</text>
          <text x="350" y="155" fill={ds.colors.green} fontSize="11" textAnchor="middle" fontFamily={ds.fonts.mono}>WAVE</text>
        </motion.g>
        
        <motion.path d="M 400 100 L 420 60 M 420 60 L 410 75 M 420 60 L 430 72" fill="none" stroke={ds.colors.green} strokeWidth="2" strokeLinecap="round"
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1.6 }} />
        
        <text x="550" y="50" fill={ds.colors.accent} fontSize="11" textAnchor="end" fontFamily={ds.fonts.body}>Technology</text>
        <text x="480" y="100" fill={ds.colors.green} fontSize="11" textAnchor="end" fontFamily={ds.fonts.body}>Value Creation</text>
        <text x="300" y="12" fill={ds.colors.textDim} fontSize="10" textAnchor="middle" fontFamily={ds.fonts.mono}>TIME →</text>
      </svg>
      
      <div className="flex justify-center gap-8 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded" style={{ background: ds.colors.accent }}></div>
          <span className="text-xs" style={{ color: ds.colors.textMuted }}>AI Technology (plateauing)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded" style={{ background: ds.colors.green }}></div>
          <span className="text-xs" style={{ color: ds.colors.textMuted }}>Value Creation (just starting)</span>
        </div>
      </div>
    </div>
  );
};

// Commoditization Visual (from previous deck)
const CommoditizationVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const products = [
    { name: "Product A", delay: 0 },
    { name: "Product B", delay: 0.1 },
    { name: "Product C", delay: 0.2 },
    { name: "Your Product", delay: 0.3, highlight: true },
    { name: "Product D", delay: 0.4 },
  ];
  
  return (
    <div ref={ref} className="w-full">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: ds.colors.bgCard, border: `1px solid ${ds.colors.border}` }}>
          <span style={{ color: ds.colors.textMuted }}>One prompt later...</span>
        </div>
      </div>
      
      <div className="flex justify-center items-end gap-3">
        {products.map((p, i) => (
          <motion.div key={i} className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: p.delay, duration: 0.4 }}>
            <div className="w-16 h-20 rounded-lg flex items-center justify-center mb-2"
              style={{ background: p.highlight ? ds.colors.accentGlow : ds.colors.bgCard, border: `1px solid ${p.highlight ? ds.colors.accent : ds.colors.border}` }}>
              <span className="text-2xl">📦</span>
            </div>
            <span className="text-xs text-center" style={{ color: p.highlight ? ds.colors.accent : ds.colors.textDim }}>{p.name}</span>
          </motion.div>
        ))}
      </div>
      
      <motion.div className="text-center mt-6" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.6 }}>
        <p className="text-lg" style={{ color: ds.colors.text }}>All <AccentText>identical</AccentText>. Who wins?</p>
      </motion.div>
    </div>
  );
};

// Talent Magnet Visual - Refined with abstract geometric shapes
const TalentMagnetVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const traits = [
    { label: "Vision", desc: "See what doesn't exist yet", color: ds.colors.accent },
    { label: "Execution", desc: "Will to make it real", color: ds.colors.green },
    { label: "Creativity", desc: "Think differently", color: ds.colors.purple },
    { label: "Persistence", desc: "Won't quit", color: ds.colors.blue },
  ];
  
  const centerX = 200;
  const centerY = 140;
  const centerRadius = 48;
  const outerRadius = 28;
  const orbitRadius = 105;
  
  // Clean geometric icons
  const TraitIcon = ({ type, color }) => {
    switch(type) {
      case 'Vision': // Radiating point - looking outward
        return (
          <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round">
            <circle cx="0" cy="0" r="3" fill={color} />
            {[0, 60, 120, 180, 240, 300].map(angle => {
              const rad = angle * Math.PI / 180;
              return (
                <line 
                  key={angle}
                  x1={Math.cos(rad) * 6} y1={Math.sin(rad) * 6}
                  x2={Math.cos(rad) * 11} y2={Math.sin(rad) * 11}
                />
              );
            })}
          </g>
        );
      case 'Execution': // Forward chevrons
        return (
          <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="-6,-7 1,0 -6,7" />
            <polyline points="1,-7 8,0 1,7" />
          </g>
        );
      case 'Creativity': // Interconnected nodes
        return (
          <g stroke={color} strokeWidth="1.5" fill="none">
            <circle cx="-5" cy="-3" r="5" />
            <circle cx="5" cy="-3" r="5" />
            <circle cx="0" cy="5" r="5" />
          </g>
        );
      case 'Persistence': // Rising bars
        return (
          <g fill={color}>
            <rect x="-9" y="2" width="4" height="8" rx="1" />
            <rect x="-2" y="-2" width="4" height="12" rx="1" />
            <rect x="5" y="-6" width="4" height="16" rx="1" />
          </g>
        );
      default:
        return null;
    }
  };
  
  return (
    <div ref={ref} className="w-full">
      <svg viewBox="0 0 400 280" className="w-full h-auto">
        {/* Background orbital rings */}
        {[1, 2, 3].map(i => (
          <motion.circle
            key={i}
            cx={centerX} cy={centerY} r={centerRadius + i * 28}
            fill="none" stroke={ds.colors.border} strokeWidth="1"
            strokeDasharray={i === 2 ? "4,4" : "none"}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.4 - i * 0.1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
          />
        ))}
        
        {/* Subtle pulsing field */}
        <motion.circle
          cx={centerX} cy={centerY} r={centerRadius}
          fill="none" stroke={ds.colors.accent} strokeWidth="1"
          initial={{ opacity: 0, scale: 1 }}
          animate={isInView ? { 
            opacity: [0.3, 0.1, 0.3],
            scale: [1, 1.8, 1]
          } : { opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        />
        
        {/* Gradient definitions for connection lines */}
        <defs>
          {traits.map((trait, i) => (
            <linearGradient key={`grad-${i}`} id={`magnetGrad${i}`} gradientUnits="userSpaceOnUse"
              x1={centerX} y1={centerY}
              x2={centerX + Math.cos((i * 90 - 45) * Math.PI / 180) * orbitRadius}
              y2={centerY + Math.sin((i * 90 - 45) * Math.PI / 180) * orbitRadius}>
              <stop offset="0%" stopColor={ds.colors.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={trait.color} stopOpacity="0.15" />
            </linearGradient>
          ))}
        </defs>
        
        {/* Connection lines - subtle gradients */}
        {traits.map((trait, i) => {
          const angle = (i * 90 - 45) * (Math.PI / 180);
          const outerX = centerX + Math.cos(angle) * orbitRadius;
          const outerY = centerY + Math.sin(angle) * orbitRadius;
          
          const dx = outerX - centerX;
          const dy = outerY - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          
          const startX = centerX + nx * (centerRadius + 4);
          const startY = centerY + ny * (centerRadius + 4);
          const endX = outerX - nx * (outerRadius + 4);
          const endY = outerY - ny * (outerRadius + 4);
          
          return (
            <motion.line 
              key={`line-${i}`}
              x1={startX} y1={startY} x2={endX} y2={endY}
              stroke={`url(#magnetGrad${i})`} strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }} 
            />
          );
        })}
        
        {/* Trait nodes */}
        {traits.map((trait, i) => {
          const angle = (i * 90 - 45) * (Math.PI / 180);
          const x = centerX + Math.cos(angle) * orbitRadius;
          const y = centerY + Math.sin(angle) * orbitRadius;
          
          return (
            <motion.g 
              key={`node-${i}`}
              initial={{ scale: 0, opacity: 0 }} 
              animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
            >
              {/* Soft glow */}
              <circle cx={x} cy={y} r={outerRadius + 6} fill={`${trait.color}08`} />
              {/* Main circle */}
              <circle cx={x} cy={y} r={outerRadius} fill={ds.colors.bg} stroke={trait.color} strokeWidth="2" />
              {/* Icon centered */}
              <g transform={`translate(${x}, ${y})`}>
                <TraitIcon type={trait.label} color={trait.color} />
              </g>
            </motion.g>
          );
        })}
        
        {/* Central magnet */}
        <motion.g 
          initial={{ scale: 0 }} 
          animate={isInView ? { scale: 1 } : { scale: 0 }} 
          transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180 }}
        >
          {/* Outer glow */}
          <circle cx={centerX} cy={centerY} r={centerRadius + 10} fill={ds.colors.accentGlow} opacity="0.5" />
          {/* Main circle */}
          <circle cx={centerX} cy={centerY} r={centerRadius} fill={ds.colors.bg} stroke={ds.colors.accent} strokeWidth="2.5" />
          {/* Inner fill */}
          <circle cx={centerX} cy={centerY} r={centerRadius - 2} fill={ds.colors.accentGlow} opacity="0.6" />
          {/* Text */}
          <text x={centerX} y={centerY + 12} fill={ds.colors.accent} fontSize="36" textAnchor="middle" fontFamily={ds.fonts.display}>33</text>
        </motion.g>
        
        {/* Animated dots flowing inward */}
        {traits.map((trait, i) => {
          const angle = (i * 90 - 45) * (Math.PI / 180);
          const outerX = centerX + Math.cos(angle) * orbitRadius;
          const outerY = centerY + Math.sin(angle) * orbitRadius;
          
          const dx = centerX - outerX;
          const dy = centerY - outerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          
          const dotStartX = outerX + nx * (outerRadius + 8);
          const dotStartY = outerY + ny * (outerRadius + 8);
          const dotEndX = centerX - nx * (centerRadius + 8);
          const dotEndY = centerY - ny * (centerRadius + 8);
          
          return (
            <motion.circle
              key={`dot-${i}`}
              r="2.5"
              fill={trait.color}
              initial={{ cx: dotStartX, cy: dotStartY, opacity: 0 }}
              animate={isInView ? {
                cx: [dotStartX, dotEndX],
                cy: [dotStartY, dotEndY],
                opacity: [0, 0.8, 0.8, 0],
              } : {}}
              transition={{ 
                duration: 2.5, 
                delay: 1.5 + i * 0.4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </svg>
      
      {/* Clean legend */}
      <div className="flex justify-center gap-10 mt-4">
        {traits.map((trait, i) => (
          <motion.div 
            key={i} 
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.9 + i * 0.1 }}
          >
            <p className="text-xs font-medium mb-0.5" style={{ color: trait.color }}>{trait.label}</p>
            <p className="text-xs" style={{ color: ds.colors.textDim }}>{trait.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Delivery Modes Visual - Refined with geometric icons
const DeliveryModesVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.2 }}>
        <GlassCard glow className="h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ds.colors.accentGlow }}>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <g stroke={ds.colors.accent} strokeWidth="1.5" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="2" />
                  <circle cx="10" cy="10" r="3" fill={ds.colors.accent} />
                  <line x1="10" y1="2" x2="10" y2="5" />
                  <line x1="10" y1="15" x2="10" y2="18" />
                  <line x1="2" y1="10" x2="5" y2="10" />
                  <line x1="15" y1="10" x2="18" y2="10" />
                </g>
              </svg>
            </div>
            <div>
              <p className="font-medium" style={{ color: ds.colors.accent }}>Products</p>
              <p className="text-xs" style={{ color: ds.colors.textDim }}>Killer tools for ourselves and others</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <span style={{ color: ds.colors.accent }}>→</span>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>Products that extract depth and enable thoughtful operation</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: ds.colors.accent }}>→</span>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>Give smart people leverage to do more with less</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: ds.colors.accent }}>→</span>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>Built for ourselves first, then others want them too</p>
            </div>
          </div>
          
          <div className="rounded-lg p-3" style={{ background: ds.colors.bg }}>
            <p className="text-xs" style={{ color: ds.colors.textDim }}>
              "We use everything we build."
            </p>
          </div>
        </GlassCard>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ delay: 0.35 }}>
        <GlassCard className="h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <g stroke={ds.colors.purple} strokeWidth="1.5" fill="none" strokeLinecap="round">
                  <circle cx="10" cy="6" r="4" />
                  <path d="M 3 18 Q 3 12 10 12 Q 17 12 17 18" />
                  <line x1="10" y1="1" x2="10" y2="3" stroke={ds.colors.purple} strokeWidth="2" />
                </g>
              </svg>
            </div>
            <div>
              <p className="font-medium" style={{ color: ds.colors.purple }}>Engagements</p>
              <p className="text-xs" style={{ color: ds.colors.textDim }}>Teaching others to think</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <span style={{ color: ds.colors.purple }}>→</span>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>30-day transformations that build capability, not dependency</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: ds.colors.purple }}>→</span>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>Teams learn to bring thoughtful input to every AI interaction</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: ds.colors.purple }}>→</span>
              <p className="text-sm" style={{ color: ds.colors.textMuted }}>First app delivered, then they build 3 more on their own</p>
            </div>
          </div>
          
          <div className="rounded-lg p-3" style={{ background: ds.colors.bg }}>
            <p className="text-xs" style={{ color: ds.colors.textDim }}>
              "We don't just build for you. We teach you to think."
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

// Operator Toolkit Visual - Pure SVG with refined geometric shapes
const OperatorToolkitVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const tools = [
    { name: "Marketing", desc: "Campaigns that run themselves", color: ds.colors.purple },
    { name: "Docs", desc: "Navigate complexity", color: ds.colors.blue },
    { name: "Analytics", desc: "Insights without analysts", color: ds.colors.green },
    { name: "And more", desc: "Built as needed", color: ds.colors.textMuted },
  ];
  
  const centerX = 200;
  const operatorY = 50;
  
  return (
    <div ref={ref} className="w-full">
      {/* SVG for operator and connecting line */}
      <svg viewBox="0 0 400 160" className="w-full h-auto">
        {/* Operator circle with glow */}
        <motion.g 
          initial={{ scale: 0, opacity: 0 }} 
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Glow */}
          <circle cx={centerX} cy={operatorY} r="42" fill={ds.colors.accentGlow} />
          {/* Main circle */}
          <circle cx={centerX} cy={operatorY} r="36" fill={ds.colors.bg} stroke={ds.colors.accent} strokeWidth="2.5" />
          {/* Abstract person icon */}
          <circle cx={centerX} cy={operatorY - 8} r="8" fill={ds.colors.accent} />
          <path d={`M ${centerX - 14} ${operatorY + 18} Q ${centerX - 14} ${operatorY + 4} ${centerX} ${operatorY + 4} Q ${centerX + 14} ${operatorY + 4} ${centerX + 14} ${operatorY + 18}`} fill={ds.colors.accent} />
        </motion.g>
        
        {/* Label below operator */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          <rect x={centerX - 50} y={operatorY + 42} width="100" height="20" rx="10" fill={ds.colors.accent} />
          <text x={centerX} y={operatorY + 56} fill={ds.colors.bg} fontSize="9" textAnchor="middle" fontFamily={ds.fonts.mono}>ONE OPERATOR</text>
        </motion.g>
        
        {/* Connecting line and text */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.4 }}
        >
          <line x1={centerX} y1={operatorY + 65} x2={centerX} y2="130" stroke={ds.colors.border} strokeWidth="1.5" />
          <text x={centerX} y="118" fill={ds.colors.textDim} fontSize="10" textAnchor="middle" fontFamily={ds.fonts.body}>runs entire business with</text>
          {/* Arrow */}
          <path d={`M ${centerX - 6} 138 L ${centerX} 148 L ${centerX + 6} 138`} fill="none" stroke={ds.colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </svg>
      
      {/* Tool cards as HTML for better text handling */}
      <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto mt-2">
        {tools.map((tool, i) => {
          const isLast = i === 3;
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="rounded-lg p-3 text-center"
              style={{ 
                background: ds.colors.bg, 
                border: `1.5px solid ${tool.color}`,
                borderOpacity: isLast ? 0.4 : 1,
              }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-2">
                <svg width="32" height="32" viewBox="0 0 32 32">
                  {i === 0 && ( // Marketing - broadcast
                    <g stroke={tool.color} strokeWidth="1.5" fill="none" transform="translate(16, 16)">
                      <circle cx="0" cy="0" r="3" fill={tool.color} />
                      <path d="M 0 0 L 8 -6 M 0 0 L 10 0 M 0 0 L 8 6" strokeLinecap="round" />
                      <circle cx="8" cy="-6" r="2" fill={tool.color} opacity="0.6" />
                      <circle cx="10" cy="0" r="2" fill={tool.color} opacity="0.6" />
                      <circle cx="8" cy="6" r="2" fill={tool.color} opacity="0.6" />
                    </g>
                  )}
                  {i === 1 && ( // Docs - layered pages
                    <g stroke={tool.color} fill="none" transform="translate(16, 16)">
                      <rect x="-4" y="-10" width="12" height="15" rx="2" strokeWidth="1" opacity="0.4" />
                      <rect x="-6" y="-7" width="12" height="15" rx="2" strokeWidth="1.5" opacity="0.7" />
                      <rect x="-8" y="-4" width="12" height="15" rx="2" strokeWidth="1.5" />
                      <line x1="-5" y1="2" x2="1" y2="2" strokeWidth="1.5" />
                      <line x1="-5" y1="5" x2="-1" y2="5" strokeWidth="1.5" />
                    </g>
                  )}
                  {i === 2 && ( // Analytics - chart
                    <g stroke={tool.color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(16, 16)">
                      <line x1="-10" y1="8" x2="-10" y2="-8" />
                      <line x1="-10" y1="8" x2="10" y2="8" />
                      <path d="M -6 4 L -1 -1 L 4 2 L 9 -6" strokeWidth="2" />
                      <circle cx="9" cy="-6" r="2" fill={tool.color} />
                    </g>
                  )}
                  {i === 3 && ( // And more - plus in dashed circle
                    <g stroke={tool.color} strokeWidth="1.5" fill="none" strokeLinecap="round" transform="translate(16, 16)">
                      <circle cx="0" cy="0" r="9" strokeDasharray="4,3" />
                      <line x1="0" y1="-4" x2="0" y2="4" />
                      <line x1="-4" y1="0" x2="4" y2="0" />
                    </g>
                  )}
                </svg>
              </div>
              {/* Name */}
              <p className="text-xs font-medium mb-1" style={{ color: tool.color, fontFamily: ds.fonts.mono }}>
                {tool.name}
              </p>
              {/* Description */}
              <p className="text-xs leading-tight" style={{ color: ds.colors.textDim, fontSize: '10px' }}>
                {tool.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
      
      {/* Bottom note */}
      <motion.p 
        className="text-center mt-6 text-xs"
        style={{ color: ds.colors.textMuted }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1 }}
      >
        Build brilliant things with brilliant people.
      </motion.p>
    </div>
  );
};

// Flywheel Visual - Refined with geometric icons
const FlywheelVisual = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const stages = [
    { label: "Smart people join" },
    { label: "Build operator tools" },
    { label: "Run more businesses" },
    { label: "Attract more talent" },
  ];
  
  // Geometric icons for each stage
  const StageIcon = ({ index, color }) => {
    switch(index) {
      case 0: // Smart people - connected nodes (network)
        return (
          <g stroke={color} strokeWidth="1.5" fill="none">
            <circle cx="0" cy="-4" r="4" fill={color} />
            <circle cx="-6" cy="4" r="3" />
            <circle cx="6" cy="4" r="3" />
            <line x1="0" y1="0" x2="-4" y2="2" />
            <line x1="0" y1="0" x2="4" y2="2" />
          </g>
        );
      case 1: // Build tools - wrench/gear shape
        return (
          <g stroke={color} strokeWidth="1.5" fill="none">
            <circle cx="0" cy="0" r="6" />
            <circle cx="0" cy="0" r="2" fill={color} />
            {[0, 60, 120, 180, 240, 300].map(angle => {
              const rad = angle * Math.PI / 180;
              return <line key={angle} x1={Math.cos(rad) * 6} y1={Math.sin(rad) * 6} x2={Math.cos(rad) * 9} y2={Math.sin(rad) * 9} />;
            })}
          </g>
        );
      case 2: // Run businesses - ascending arrow
        return (
          <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M -8 6 L 0 -6 L 8 6" />
            <line x1="0" y1="-6" x2="0" y2="8" />
          </g>
        );
      case 3: // Attract talent - magnet/pull
        return (
          <g stroke={color} strokeWidth="1.5" fill="none">
            <path d="M -6 -6 L -6 4 Q -6 8 0 8 Q 6 8 6 4 L 6 -6" />
            <line x1="-6" y1="-2" x2="-6" y2="-6" stroke={color} strokeWidth="3" />
            <line x1="6" y1="-2" x2="6" y2="-6" stroke={color} strokeWidth="3" />
          </g>
        );
      default:
        return null;
    }
  };
  
  return (
    <div ref={ref} className="w-full">
      <svg viewBox="0 0 400 300" className="w-full h-auto">
        {/* Center */}
        <motion.g initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : { scale: 0 }} transition={{ duration: 0.4 }}>
          <circle cx="200" cy="150" r="38" fill={ds.colors.bg} stroke={ds.colors.accent} strokeWidth="2" />
          <circle cx="200" cy="150" r="32" fill={ds.colors.accentGlow} />
          <text x="200" y="148" fill={ds.colors.accent} fontSize="22" textAnchor="middle" fontFamily={ds.fonts.display}>∞</text>
          <text x="200" y="164" fill={ds.colors.textDim} fontSize="8" textAnchor="middle" fontFamily={ds.fonts.mono}>COMPOUNDS</text>
        </motion.g>
        
        {/* Rotating dashed circle */}
        <motion.circle cx="200" cy="150" r="75" fill="none" stroke={ds.colors.border} strokeWidth="1" strokeDasharray="6,6"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '200px 150px' }}
        />
        
        {/* Stage nodes */}
        {stages.map((stage, i) => {
          const angle = (i * 90 - 90) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 115;
          const y = 150 + Math.sin(angle) * 100;
          const colors = [ds.colors.blue, ds.colors.purple, ds.colors.green, ds.colors.accent];
          const color = colors[i];
          
          return (
            <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}>
              {/* Card */}
              <rect x={x - 52} y={y - 22} width="104" height="44" rx="8" fill={ds.colors.bg} stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
              {/* Icon */}
              <g transform={`translate(${x - 32}, ${y})`}>
                <StageIcon index={i} color={color} />
              </g>
              {/* Label */}
              <text x={x + 8} y={y + 4} fill={ds.colors.text} fontSize="9" fontFamily={ds.fonts.body}>{stage.label}</text>
            </motion.g>
          );
        })}
        
        {/* Curved arrows between stages */}
        <motion.g initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 1 }}>
          <defs>
            <marker id="flyArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill={ds.colors.accent} opacity="0.5" />
            </marker>
          </defs>
          {[0, 1, 2, 3].map(i => {
            const startAngle = (i * 90 - 45) * (Math.PI / 180);
            const endAngle = (i * 90 + 45) * (Math.PI / 180);
            const r = 88;
            const x1 = 200 + Math.cos(startAngle) * r;
            const y1 = 150 + Math.sin(startAngle) * (r * 0.85);
            const x2 = 200 + Math.cos(endAngle) * r;
            const y2 = 150 + Math.sin(endAngle) * (r * 0.85);
            
            return (
              <path key={i} d={`M ${x1} ${y1} A ${r} ${r * 0.85} 0 0 1 ${x2} ${y2}`} 
                fill="none" stroke={ds.colors.accent} strokeWidth="1.5" strokeOpacity="0.4" markerEnd="url(#flyArrow)" />
            );
          })}
        </motion.g>
      </svg>
    </div>
  );
};

// Academy Funnel Visual (from previous deck)
const AcademyFunnel = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  const stages = [
    { label: "City Programs", count: "1000s", width: "100%", desc: "Austin → SF → NYC → Chicago, then Douala, Lagos, Nairobi...", color: ds.colors.textMuted },
    { label: "33 Workforce", count: "100s", width: "70%", desc: "Top performers join as contractors", color: ds.colors.blue },
    { label: "Summer Intensive", count: "50", width: "45%", desc: "Elite global cohort", color: ds.colors.purple },
    { label: "Venture Studio", count: "10-20", width: "25%", desc: "Launch their companies", color: ds.colors.accent },
  ];
  
  return (
    <div ref={ref} className="w-full max-w-xl mx-auto">
      {stages.map((stage, i) => (
        <motion.div key={i} className="mb-3" initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: i * 0.15, duration: 0.4 }}>
          <div className="rounded-xl p-4 relative overflow-hidden"
            style={{ width: stage.width, marginLeft: 'auto', marginRight: 'auto', background: ds.colors.bgCard, border: `1px solid ${i === 3 ? ds.colors.accent : ds.colors.border}` }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium mb-1" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-xs" style={{ color: ds.colors.textDim }}>{stage.desc}</p>
              </div>
              <div className="text-right px-3 py-1 rounded-full text-xs" style={{ background: `${stage.color}20`, color: stage.color }}>{stage.count}</div>
            </div>
          </div>
          {i < stages.length - 1 && <div className="flex justify-center py-1"><span style={{ color: ds.colors.textDim }}>↓</span></div>}
        </motion.div>
      ))}
    </div>
  );
};

export default function ThirtyThreeVisionDeck() {
  return (
    <div className="text-white min-h-screen overflow-x-hidden relative" style={{ fontFamily: ds.fonts.body, background: ds.colors.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>
      
      <ProgressBar />

      {/* SLIDE 1: Title */}
      <Section id="title" className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: ds.colors.accent }} />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>The Bigger Picture</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6" style={{ fontFamily: ds.fonts.display }}>
              <AccentText>33</AccentText> Strategies
            </h1>
          </RevealText>
          
          <RevealText delay={0.2}>
            <p className="text-xl md:text-2xl mb-12" style={{ color: ds.colors.textMuted }}>
              Ride the wave. Build the infrastructure.<br />
              <AccentText>Create generational opportunity.</AccentText>
            </p>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="flex justify-center gap-8">
              {[
                { num: "10+", label: "Year opportunity" },
                { num: "∞", label: "Leverage" },
                { num: "🌍", label: "Global reach" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold" style={{ color: ds.colors.accent }}>{stat.num}</p>
                  <p className="text-xs" style={{ color: ds.colors.textDim }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 2: The Thesis */}
      <Section id="thesis">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>01 — The Thesis</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Technology is plateauing. <AccentText>Value creation is just starting.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>We're at the bottom of a parabolic curve. The wave is just forming.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard><SCurveChart /></GlassCard>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-center mt-6 text-lg" style={{ color: ds.colors.text }}>
              Philosophy: <AccentText>Surf the wave. Don't marry the beach.</AccentText>
            </p>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 3: The Problem */}
      <Section id="problem">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>02 — The Problem</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              When anyone can build anything, <AccentText>products become commodities.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>One prompt later, your product is replicated. Commitment to a single thing is dangerous.</p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard className="py-10"><CommoditizationVisual /></GlassCard>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 4: The Magnet (NEW CONTENT) */}
      <Section id="magnet">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>03 — The Real Differentiator</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Become a magnet for <AccentText>brilliant people.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-4" style={{ color: ds.colors.textMuted }}>
              The winners in this new AI future are the smart, creative, persistent people with vision and the willingness to chase it down and make it real.
            </p>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              Our differentiator: <AccentText>find them and cultivate them</AccentText>. Future talent is skillset-agnostic. What matters is the mind, not the resume.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard className="py-6"><TalentMagnetVisual /></GlassCard>
          </RevealText>
          
          <RevealText delay={0.3}>
            <p className="text-center mt-6 text-sm" style={{ color: ds.colors.text }}>
              People looking for <AccentText>AI superpowers</AccentText> to execute on their incredible ideas.
            </p>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 5: The Work (Products + Engagements) */}
      <Section id="work">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>04 — The Work</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Build badass products. <AccentText>Teach others to think.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              Smart people ride the wave with us in two ways:
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <DeliveryModesVisual />
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 6: The Accelerant (Operator Toolkit - NEW CONTENT) */}
      <Section id="accelerant">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>05 — The Accelerant</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Tools that let <AccentText>one person</AccentText> run an entire business.
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              We're building a suite of products that maximize the leverage of the smart, creative, persistent person with a vision. 
              Tools you can <AccentText>trust</AccentText> to thoughtfully own important parts of your business.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard className="py-6"><OperatorToolkitVisual /></GlassCard>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="mt-6 p-4 rounded-lg text-center" style={{ background: ds.colors.bgCard, border: `1px solid ${ds.colors.border}` }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>The Vision</p>
              <p className="text-sm" style={{ color: ds.colors.text }}>
                An <AccentText>AI operating system</AccentText>: different tools and suites, all in service of enabling fewer and fewer people—ultimately just one—to operate a business or even multiple businesses thoughtfully and intentionally.
              </p>
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 7: The Flywheel (NEW) */}
      <Section id="flywheel">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>06 — The Flywheel</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              Smart people building smart tools that <AccentText>compound.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              The accelerant: we build tools that make it easier to build more killer businesses. 
              Those businesses attract more smart people. They build more tools. And so it goes.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard className="py-6"><FlywheelVisual /></GlassCard>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 8: The Equalizer */}
      <Section id="equalizer">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>07 — The Insight</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              AI doesn't care <AccentText>where you're from.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              You're coding in natural language now. The barriers are collapsing.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <GlassCard glow className="mb-6">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg mb-4" style={{ color: ds.colors.text }}>
                    A hungry, creative kid with a laptop in <AccentText>Douala</AccentText> can now 
                    compete with anyone in <AccentText>San Francisco</AccentText>.
                  </p>
                  <p className="text-sm" style={{ color: ds.colors.textMuted }}>
                    The talent was always there. The tools weren't. Now they are.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
                        style={{ background: ds.colors.bgCard, border: `1px solid ${ds.colors.border}` }}>
                        <span className="text-2xl">🌍</span>
                      </div>
                      <p className="text-xs" style={{ color: ds.colors.textDim }}>Anywhere</p>
                    </div>
                    <div style={{ color: ds.colors.accent }} className="text-2xl">=</div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
                        style={{ background: ds.colors.accentGlow, border: `1px solid ${ds.colors.accent}` }}>
                        <span className="text-2xl">🚀</span>
                      </div>
                      <p className="text-xs" style={{ color: ds.colors.textDim }}>Everywhere</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </RevealText>
          
          <RevealText delay={0.3}>
            <div className="flex justify-center gap-6">
              {[
                { before: "Learn to code", after: "Think clearly", icon: "🧠" },
                { before: "CS degree", after: "Curiosity + laptop", icon: "💻" },
                { before: "Silicon Valley", after: "Internet connection", icon: "🌐" },
              ].map((item, i) => (
                <GlassCard key={i} className="text-center flex-1">
                  <span className="text-xl mb-2 block">{item.icon}</span>
                  <p className="text-xs line-through mb-1" style={{ color: ds.colors.textDim }}>{item.before}</p>
                  <p className="text-sm font-medium" style={{ color: ds.colors.accent }}>{item.after}</p>
                </GlassCard>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 9: 33 Academy */}
      <Section id="academy">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>08 — The Academy</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              <AccentText>33</AccentText> Academy
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              Find hungry, creative young adults. Teach them to build. Create generational wealth opportunity.
            </p>
          </RevealText>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <RevealText delay={0.2}>
              <GlassCard className="h-full">
                <p className="text-sm mb-4" style={{ color: ds.colors.accent }}>Selection Criteria</p>
                <div className="space-y-3">
                  {[
                    { icon: "🧠", label: "Raw intellectual horsepower" },
                    { icon: "💡", label: "Creative problem-solving" },
                    { icon: "🔥", label: "Hustle + growth mindset" },
                    { icon: "🎯", label: "Ages 18-25" },
                    { icon: "⭐", label: "Elite potential, limited access" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span className="text-sm" style={{ color: ds.colors.textMuted }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </RevealText>
            
            <RevealText delay={0.25}>
              <GlassCard glow className="h-full">
                <p className="text-sm mb-4" style={{ color: ds.colors.accent }}>The Grand Challenge</p>
                <p className="text-sm mb-4" style={{ color: ds.colors.textMuted }}>
                  "Build something cool that demonstrates your skills."
                </p>
                <div className="rounded-lg p-4" style={{ background: ds.colors.bg }}>
                  <p className="text-xs" style={{ color: ds.colors.textDim }}>
                    We'll point you at resources. Teach yourself Bolt, Claude, Cursor. Show us what you can figure out. That's the test.
                  </p>
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${ds.colors.border}` }}>
                  <p className="text-xs" style={{ color: ds.colors.textMuted }}>
                    Phase 1: US cities. Phase 2: Douala, Lagos, Nairobi, and beyond.
                  </p>
                </div>
              </GlassCard>
            </RevealText>
          </div>
          
          <RevealText delay={0.3}>
            <GlassCard>
              <p className="text-sm mb-4" style={{ color: ds.colors.accent }}>Beyond Technical Skills</p>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { title: "AI Implementation", desc: "How to think and build", color: ds.colors.accent },
                  { title: "Philosophy", desc: "First principles. Clear thinking.", color: ds.colors.purple },
                  { title: "Financial Literacy", desc: "Assets, equity, leverage.", color: ds.colors.green },
                  { title: "Self-Mastery", desc: "Confidence. Introspection.", color: ds.colors.blue },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="font-medium text-sm mb-1" style={{ color: item.color }}>{item.title}</p>
                    <p className="text-xs" style={{ color: ds.colors.textDim }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 10: The System */}
      <Section id="funnel">
        <div className="max-w-4xl mx-auto">
          <RevealText>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ color: ds.colors.accent, fontFamily: ds.fonts.mono }}>09 — The System</p>
          </RevealText>
          
          <RevealText delay={0.1}>
            <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: ds.fonts.display }}>
              From talent to <AccentText>founders.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <p className="text-sm mb-8" style={{ color: ds.colors.textMuted }}>
              A complete pipeline: identify, train, employ, fund, launch.
            </p>
          </RevealText>
          
          <RevealText delay={0.2}>
            <AcademyFunnel />
          </RevealText>
          
          <RevealText delay={0.4}>
            <div className="flex justify-center gap-4 mt-8">
              {[
                { label: "Companies sponsor", desc: "First pick at talent" },
                { label: "Partners fund", desc: "Program operations" },
                { label: "Grads create", desc: "Venture portfolio" },
              ].map((item, i) => (
                <GlassCard key={i} className="text-center flex-1 max-w-40">
                  <p className="text-xs font-medium" style={{ color: ds.colors.accent }}>{item.label}</p>
                  <p className="text-xs" style={{ color: ds.colors.textDim }}>{item.desc}</p>
                </GlassCard>
              ))}
            </div>
          </RevealText>
        </div>
      </Section>

      {/* SLIDE 11: Close */}
      <Section id="close" className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20" style={{ background: ds.colors.accent }} />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <RevealText>
            <h2 className="text-4xl md:text-5xl mb-8" style={{ fontFamily: ds.fonts.display }}>
              Build beautiful things<br />
              with brilliant people.<br />
              <AccentText>Open doors everywhere.</AccentText>
            </h2>
          </RevealText>
          
          <RevealText delay={0.15}>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { phase: "The Work", action: "Smart people building thoughtful, compelling things together" },
                { phase: "The Business", action: "Ride the wave, build operator tools that compound" },
                { phase: "The Mission", action: "Create paths from Douala to anywhere" },
              ].map((item, i) => (
                <GlassCard key={i} glow={i === 2}>
                  <p className="text-xs mb-2" style={{ color: ds.colors.accent }}>{item.phase}</p>
                  <p className="text-sm" style={{ color: ds.colors.textMuted }}>{item.action}</p>
                </GlassCard>
              ))}
            </div>
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
