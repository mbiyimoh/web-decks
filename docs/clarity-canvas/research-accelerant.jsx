import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

const colors = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceDim: '#0d0d0d',
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  goldGlow: 'rgba(212, 168, 75, 0.3)',
  green: '#4ADE80',
  greenGlow: 'rgba(74, 222, 128, 0.3)',
  yellow: '#FBBF24',
  orange: '#F97316',
  red: '#EF4444',
  white: '#ffffff',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a'
};

// ============================================================================
// RESEARCH FINDINGS DATA
// ============================================================================

const researchFindings = [
  {
    id: "f1",
    priority: "high",
    category: "professional",
    icon: "💼",
    finding: {
      title: "Previous Role at Peloton",
      source: "LinkedIn",
      description: "Senior PM at Peloton (2018-2022) leading the content recommendation engine that improved discovery by 40%."
    },
    recommendation: {
      text: "Led content recommendation engine at Peloton, improving discovery metrics by 40%. Deep experience in AI-powered personalization for fitness.",
      targetSection: "individual",
      targetSectionName: "Individual",
      scoreImpact: 8
    },
    status: "pending"
  },
  {
    id: "f2",
    priority: "high",
    category: "professional",
    icon: "🎓",
    finding: {
      title: "Stanford MBA + MIT CS",
      source: "LinkedIn",
      description: "MBA from Stanford GSB (2018), BS Computer Science from MIT (2012)."
    },
    recommendation: {
      text: "Stanford MBA (2018) with focus on entrepreneurship. MIT Computer Science undergrad (2012) provides strong technical foundation.",
      targetSection: "individual",
      targetSectionName: "Individual",
      scoreImpact: 6
    },
    status: "pending"
  },
  {
    id: "f3",
    priority: "high",
    category: "content",
    icon: "📝",
    finding: {
      title: "Published on AI in Fitness",
      source: "Medium",
      description: "Article: 'Why AI Coaching Will Democratize Personal Training' - 2.4K claps, featured in Towards Data Science."
    },
    recommendation: {
      text: "Published thought leader on AI fitness applications. Article on democratizing personal training through AI garnered significant engagement.",
      targetSection: "individual",
      targetSectionName: "Individual",
      scoreImpact: 5
    },
    status: "pending"
  },
  {
    id: "f4",
    priority: "medium",
    category: "projects",
    icon: "🚀",
    finding: {
      title: "PLYA Beta Launch",
      source: "Product Hunt",
      description: "PLYA listed on Product Hunt with 'Coming Soon' status. Early access waitlist mentioned."
    },
    recommendation: {
      text: "PLYA positioned for beta launch with Product Hunt presence. Building early access waitlist for initial user acquisition.",
      targetSection: "projects",
      targetSectionName: "Projects",
      scoreImpact: 4
    },
    status: "pending"
  },
  {
    id: "f5",
    priority: "medium",
    category: "recognition",
    icon: "🏆",
    finding: {
      title: "Forbes 30 Under 30 Nominee",
      source: "Forbes",
      description: "Nominated for Forbes 30 Under 30 in Consumer Technology (2021) for work at Peloton."
    },
    recommendation: {
      text: "Forbes 30 Under 30 nominee (2021) in Consumer Technology, recognized for innovation in fitness tech at Peloton.",
      targetSection: "individual",
      targetSectionName: "Individual",
      scoreImpact: 4
    },
    status: "pending"
  },
  {
    id: "f6",
    priority: "medium",
    category: "professional",
    icon: "🔗",
    finding: {
      title: "Angel Investor Network",
      source: "AngelList",
      description: "Connected with 12 fitness/health tech angels. Previous investments from Peloton executives."
    },
    recommendation: {
      text: "Strong angel network in fitness tech space. Connections to Peloton executive investors provide warm fundraising paths.",
      targetSection: "network",
      targetSectionName: "Network",
      scoreImpact: 7
    },
    status: "pending"
  },
  {
    id: "f7",
    priority: "low",
    category: "content",
    icon: "🎙️",
    finding: {
      title: "Podcast Appearance",
      source: "Spotify",
      description: "Guest on 'Founder Fitness' podcast discussing the future of AI personal training."
    },
    recommendation: {
      text: "Podcast presence discussing AI personal training. Building thought leadership through media appearances.",
      targetSection: "individual",
      targetSectionName: "Individual",
      scoreImpact: 3
    },
    status: "pending"
  },
  {
    id: "f8",
    priority: "low",
    category: "projects",
    icon: "📱",
    finding: {
      title: "App Store Listing Detected",
      source: "App Store Connect",
      description: "PLYA iOS app in TestFlight beta. Currently in review for public beta release."
    },
    recommendation: {
      text: "iOS app in TestFlight beta phase, progressing toward public beta release through App Store review.",
      targetSection: "projects",
      targetSectionName: "Projects",
      scoreImpact: 5
    },
    status: "pending"
  }
];

const researchPhases = [
  { id: "professional", label: "Professional History", icon: "💼", sources: ["LinkedIn", "Crunchbase"] },
  { id: "content", label: "Published Content", icon: "📝", sources: ["Medium", "Substack", "Twitter"] },
  { id: "projects", label: "Projects & Products", icon: "🚀", sources: ["Product Hunt", "GitHub", "App Store"] },
  { id: "recognition", label: "Recognition & Press", icon: "🏆", sources: ["Forbes", "TechCrunch", "News"] }
];

// ============================================================================
// UTILITIES
// ============================================================================

const getScoreColor = (score) => {
  if (score >= 90) return colors.gold;
  if (score >= 75) return colors.green;
  if (score >= 50) return colors.yellow;
  if (score >= 25) return colors.orange;
  return colors.red;
};

const polarToCartesian = (angle, radius) => {
  const radian = (angle - 90) * (Math.PI / 180);
  return { x: radius * Math.cos(radian), y: radius * Math.sin(radian) };
};

// ============================================================================
// KEYFRAMES
// ============================================================================

const keyframes = `
  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.02); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 168, 75, 0.4); }
    50% { transform: scale(1.05); box-shadow: 0 0 25px 8px rgba(212, 168, 75, 0.15); }
  }
  @keyframes fadeSlideUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideIn {
    0% { opacity: 0; transform: translateX(-20px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes checkBounce {
    0% { transform: scale(0); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
    50% { box-shadow: 0 0 20px 5px rgba(74, 222, 128, 0.3); }
  }
  @keyframes scoreUp {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); color: #4ADE80; }
    100% { transform: scale(1); }
  }
  @keyframes cardCollapse {
    0% { opacity: 1; max-height: 300px; margin-bottom: 16px; }
    100% { opacity: 0; max-height: 0; margin-bottom: 0; padding: 0; }
  }
  @keyframes orbitExpand {
    0% { r: 140; }
    100% { r: 180; }
  }
  @keyframes countUp {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
`;

// ============================================================================
// SCREEN 1: RESEARCH INTRO
// ============================================================================

const ResearchIntroScreen = ({ onStart, onSkip, currentScore }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  const benefits = [
    { icon: "💼", text: "Professional history & experience" },
    { icon: "📝", text: "Published content & thought leadership" },
    { icon: "🚀", text: "Projects & products you've built" },
    { icon: "🏆", text: "Recognition & achievements" }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(212,168,75,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      {/* Current score reminder */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
        opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease-out'
      }}>
        <span style={{ fontSize: 14, color: colors.zinc500 }}>Current foundation:</span>
        <span style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 600, color: getScoreColor(currentScore) }}>{currentScore}%</span>
      </div>
      
      {/* Main content */}
      <div style={{ textAlign: 'center', maxWidth: 500, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease-out 0.1s' }}>
        <span style={{ fontSize: 48, marginBottom: 16, display: 'block' }}>🔍</span>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: colors.white, margin: '0 0 12px 0' }}>
          Let's accelerate this
        </h1>
        <p style={{ fontSize: 18, color: colors.zinc400, margin: '0 0 32px 0', lineHeight: 1.6 }}>
          We can research what the internet knows about you and auto-fill your profile. You approve everything before it's added.
        </p>
      </div>
      
      {/* Benefits */}
      <div style={{ 
        backgroundColor: colors.surface, 
        border: `1px solid ${colors.zinc800}`, 
        borderRadius: 16, 
        padding: 24, 
        marginBottom: 32,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out 0.2s'
      }}>
        <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc500, margin: '0 0 16px 0' }}>
          What we'll look for
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ 
              display: 'flex', alignItems: 'center', gap: 10, 
              padding: '10px 12px', 
              backgroundColor: colors.surfaceDim, 
              borderRadius: 8,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-10px)',
              transition: `all 0.4s ease-out ${0.3 + i * 0.05}s`
            }}>
              <span style={{ fontSize: 20 }}>{b.icon}</span>
              <span style={{ fontSize: 14, color: colors.zinc300 }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease-out 0.4s' }}>
        <button onClick={onStart} style={{ 
          padding: '16px 48px', fontSize: 16, fontWeight: 600, color: colors.bg, 
          backgroundColor: colors.gold, border: 'none', borderRadius: 10, cursor: 'pointer',
          animation: 'breathe 4s ease-in-out infinite'
        }}>
          Run Research
        </button>
        <button onClick={onSkip} style={{ fontSize: 14, color: colors.zinc500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}>
          Skip for now
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SCREEN 2: RESEARCH RUNNING
// ============================================================================

const ResearchRunningScreen = ({ onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [phaseStatuses, setPhaseStatuses] = useState(researchPhases.map(() => 'pending'));
  
  useEffect(() => {
    // Simulate research phases
    const phaseTimings = [
      { delay: 500, phase: 0, discovered: 2 },
      { delay: 2500, phase: 1, discovered: 5 },
      { delay: 4500, phase: 2, discovered: 7 },
      { delay: 6500, phase: 3, discovered: 8 },
      { delay: 8500, phase: -1, discovered: 8 } // Complete
    ];
    
    const timers = phaseTimings.map(({ delay, phase, discovered }) => 
      setTimeout(() => {
        if (phase >= 0) {
          setCurrentPhase(phase);
          setPhaseStatuses(prev => prev.map((s, i) => i < phase ? 'complete' : i === phase ? 'running' : 'pending'));
        } else {
          setPhaseStatuses(prev => prev.map(() => 'complete'));
          setTimeout(onComplete, 1000);
        }
        setDiscoveredCount(discovered);
      }, delay)
    );
    
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      {/* Mini orbital visualization */}
      <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 40 }}>
        <svg width="200" height="200" viewBox="-100 -100 200 200">
          {/* Scanning ring */}
          <circle r="80" fill="none" stroke={colors.gold} strokeWidth="2" strokeDasharray="8 8" opacity="0.3" style={{ animation: 'rotate 4s linear infinite' }} />
          <circle r="60" fill="none" stroke={colors.zinc700} strokeWidth="1" opacity="0.5" />
          
          {/* Center */}
          <circle r="30" fill={colors.surface} stroke={colors.gold} strokeWidth="2" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="12" fontFamily="monospace" fontWeight="600" fill={colors.gold}>
            {discoveredCount}
          </text>
          <text textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={colors.zinc500} y="14">found</text>
        </svg>
        
        {/* Scanning line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 80,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${colors.gold})`,
          transformOrigin: 'left center',
          animation: 'rotate 2s linear infinite'
        }} />
      </div>
      
      {/* Status text */}
      <h2 style={{ fontSize: 20, fontWeight: 500, color: colors.white, margin: '0 0 8px 0' }}>
        Researching your background...
      </h2>
      <p style={{ fontSize: 14, color: colors.zinc500, margin: '0 0 32px 0' }}>
        This usually takes about 10 seconds
      </p>
      
      {/* Phase checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 300 }}>
        {researchPhases.map((phase, i) => (
          <div key={phase.id} style={{ 
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: phaseStatuses[i] === 'pending' ? 0.4 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {/* Status indicator */}
            <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {phaseStatuses[i] === 'complete' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="3" style={{ animation: 'checkBounce 0.3s ease-out' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : phaseStatuses[i] === 'running' ? (
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${colors.gold}`, borderTopColor: 'transparent', animation: 'rotate 0.8s linear infinite' }} />
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${colors.zinc700}` }} />
              )}
            </div>
            
            {/* Phase info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{phase.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: phaseStatuses[i] === 'running' ? colors.white : colors.zinc400 }}>
                  {phase.label}
                </span>
              </div>
              {phaseStatuses[i] === 'running' && (
                <p style={{ fontSize: 11, color: colors.zinc600, margin: '4px 0 0 24px' }}>
                  Checking {phase.sources.join(', ')}...
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// FINDING CARD COMPONENT
// ============================================================================

const FindingCard = ({ finding, onAdd, onSkip, isAdding, isAdded, isSkipped }) => {
  const priorityColors = { high: colors.gold, medium: colors.zinc400, low: colors.zinc600 };
  const priorityLabels = { high: 'HIGH VALUE', medium: 'MEDIUM', low: 'LOW' };
  
  if (isAdded || isSkipped) {
    return (
      <div style={{
        backgroundColor: isAdded ? 'rgba(74, 222, 128, 0.05)' : colors.surfaceDim,
        border: `1px solid ${isAdded ? 'rgba(74, 222, 128, 0.2)' : colors.zinc800}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: 0.6,
        animation: 'fadeSlideUp 0.3s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdded ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span style={{ fontSize: 16, opacity: 0.5 }}>⊘</span>
          )}
          <span style={{ fontSize: 14, color: colors.zinc400 }}>{finding.finding.title}</span>
        </div>
        <span style={{ fontSize: 12, color: isAdded ? colors.green : colors.zinc600 }}>
          {isAdded ? `+${finding.recommendation.scoreImpact}%` : 'Skipped'}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.zinc800}`,
      borderRadius: 16,
      padding: 20,
      animation: 'fadeSlideUp 0.4s ease-out',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Adding overlay */}
      {isAdding && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'glowPulse 0.5s ease-out'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="3" style={{ animation: 'checkBounce 0.4s ease-out' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{finding.icon}</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.white, margin: 0 }}>{finding.finding.title}</h3>
            <span style={{ fontSize: 11, color: colors.zinc500 }}>via {finding.finding.source}</span>
          </div>
        </div>
        <span style={{ 
          fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
          padding: '4px 8px', borderRadius: 4,
          backgroundColor: `${priorityColors[finding.priority]}15`,
          color: priorityColors[finding.priority]
        }}>
          {priorityLabels[finding.priority]}
        </span>
      </div>
      
      {/* Finding description */}
      <p style={{ fontSize: 14, color: colors.zinc400, margin: '0 0 16px 0', lineHeight: 1.5 }}>
        {finding.finding.description}
      </p>
      
      {/* Recommendation preview */}
      <div style={{ 
        backgroundColor: colors.surfaceDim, 
        borderRadius: 8, 
        padding: 12, 
        marginBottom: 16,
        borderLeft: `3px solid ${colors.gold}`
      }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: colors.zinc500, margin: '0 0 6px 0' }}>
          Will add to <span style={{ color: colors.gold }}>{finding.recommendation.targetSectionName}</span>:
        </p>
        <p style={{ fontSize: 13, color: colors.zinc300, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
          "{finding.recommendation.text}"
        </p>
      </div>
      
      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onAdd} style={{
          flex: 1, padding: '12px 16px', fontSize: 14, fontWeight: 600,
          color: colors.bg, backgroundColor: colors.green, 
          border: 'none', borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Add to Profile (+{finding.recommendation.scoreImpact}%)
        </button>
        <button onClick={onSkip} style={{
          padding: '12px 16px', fontSize: 14, fontWeight: 500,
          color: colors.zinc400, backgroundColor: 'transparent',
          border: `1px solid ${colors.zinc700}`, borderRadius: 8, cursor: 'pointer'
        }}>
          Skip
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SCREEN 3: FINDINGS REVIEW
// ============================================================================

const FindingsReviewScreen = ({ findings, initialScore, onComplete }) => {
  const [findingStates, setFindingStates] = useState(
    findings.reduce((acc, f) => ({ ...acc, [f.id]: { status: 'pending', adding: false } }), {})
  );
  const [currentScore, setCurrentScore] = useState(initialScore);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  
  const addedCount = Object.values(findingStates).filter(s => s.status === 'added').length;
  const skippedCount = Object.values(findingStates).filter(s => s.status === 'skipped').length;
  const reviewedCount = addedCount + skippedCount;
  const pendingFindings = findings.filter(f => findingStates[f.id].status === 'pending');
  const processedFindings = findings.filter(f => findingStates[f.id].status !== 'pending');
  
  const handleAdd = useCallback((finding) => {
    setFindingStates(prev => ({ ...prev, [finding.id]: { ...prev[finding.id], adding: true } }));
    
    setTimeout(() => {
      setFindingStates(prev => ({ ...prev, [finding.id]: { status: 'added', adding: false } }));
      setScoreAnimating(true);
      setCurrentScore(s => Math.min(100, s + finding.recommendation.scoreImpact));
      setTimeout(() => setScoreAnimating(false), 600);
    }, 500);
  }, []);
  
  const handleSkip = useCallback((finding) => {
    setFindingStates(prev => ({ ...prev, [finding.id]: { status: 'skipped', adding: false } }));
  }, []);

  const allReviewed = reviewedCount === findings.length;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header with score */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          marginBottom: 32,
          opacity: visible ? 1 : 0, 
          transform: visible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.5s ease-out'
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: colors.white, margin: '0 0 4px 0' }}>
              We found {findings.length} things
            </h1>
            <p style={{ fontSize: 14, color: colors.zinc500, margin: 0 }}>
              {reviewedCount} of {findings.length} reviewed • {addedCount} added
            </p>
          </div>
          
          {/* Live score */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc600, margin: '0 0 4px 0' }}>Foundation</p>
            <span style={{ 
              fontSize: 32, fontFamily: 'monospace', fontWeight: 700, 
              color: getScoreColor(currentScore),
              animation: scoreAnimating ? 'scoreUp 0.5s ease-out' : 'none'
            }}>
              {currentScore}%
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{ 
          height: 4, backgroundColor: colors.zinc800, borderRadius: 2, marginBottom: 32,
          opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease-out 0.2s'
        }}>
          <div style={{ 
            height: '100%', backgroundColor: colors.gold, borderRadius: 2,
            width: `${(reviewedCount / findings.length) * 100}%`,
            transition: 'width 0.3s ease-out'
          }} />
        </div>
        
        {/* Pending findings */}
        {pendingFindings.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc500, margin: '0 0 16px 0' }}>
              To Review ({pendingFindings.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingFindings.slice(0, 3).map((finding, i) => (
                <div key={finding.id} style={{ 
                  opacity: visible ? 1 : 0, 
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s ease-out ${0.3 + i * 0.1}s`
                }}>
                  <FindingCard
                    finding={finding}
                    onAdd={() => handleAdd(finding)}
                    onSkip={() => handleSkip(finding)}
                    isAdding={findingStates[finding.id].adding}
                    isAdded={false}
                    isSkipped={false}
                  />
                </div>
              ))}
            </div>
            
            {pendingFindings.length > 3 && (
              <p style={{ fontSize: 13, color: colors.zinc500, textAlign: 'center', marginTop: 16 }}>
                +{pendingFindings.length - 3} more findings below
              </p>
            )}
          </div>
        )}
        
        {/* Processed findings */}
        {processedFindings.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc500, margin: '0 0 12px 0' }}>
              Reviewed ({processedFindings.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {processedFindings.map(finding => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  isAdded={findingStates[finding.id].status === 'added'}
                  isSkipped={findingStates[finding.id].status === 'skipped'}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Completion CTA */}
        {allReviewed && (
          <div style={{ textAlign: 'center', animation: 'fadeSlideUp 0.5s ease-out' }}>
            <p style={{ fontSize: 16, color: colors.zinc400, marginBottom: 16 }}>
              🎉 All findings reviewed!
            </p>
            <button onClick={() => onComplete(currentScore, addedCount)} style={{
              padding: '16px 48px', fontSize: 16, fontWeight: 600,
              color: colors.bg, backgroundColor: colors.gold,
              border: 'none', borderRadius: 10, cursor: 'pointer',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              See Your Updated Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SCREEN 4: RESEARCH COMPLETE
// ============================================================================

const ResearchCompleteScreen = ({ beforeScore, afterScore, addedCount, onContinue }) => {
  const [visible, setVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(beforeScore);
  
  useEffect(() => { 
    setTimeout(() => setVisible(true), 100);
    // Animate score counting up
    setTimeout(() => {
      const duration = 1500;
      const steps = 30;
      const increment = (afterScore - beforeScore) / steps;
      let current = beforeScore;
      const interval = setInterval(() => {
        current += increment;
        if (current >= afterScore) {
          setDisplayScore(afterScore);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.round(current));
        }
      }, duration / steps);
    }, 800);
  }, [beforeScore, afterScore]);

  // Section improvements (simulated)
  const improvements = [
    { name: 'Individual', before: 32, after: 58, icon: '👤' },
    { name: 'Network', before: 18, after: 35, icon: '🔗' },
    { name: 'Projects', before: 25, after: 42, icon: '📁' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(74,222,128,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      {/* Celebration */}
      <div style={{ 
        textAlign: 'center', marginBottom: 40,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out'
      }}>
        <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>✨</span>
        <h1 style={{ fontSize: 32, fontWeight: 600, color: colors.white, margin: '0 0 8px 0' }}>
          Profile Supercharged
        </h1>
        <p style={{ fontSize: 16, color: colors.zinc400, margin: 0 }}>
          Added {addedCount} findings from research
        </p>
      </div>
      
      {/* Score comparison */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 32, marginBottom: 40,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-out 0.2s'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc600, margin: '0 0 8px 0' }}>Before</p>
          <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 600, color: colors.zinc500 }}>{beforeScore}%</span>
        </div>
        
        <svg width="40" height="24" viewBox="0 0 40 24">
          <path d="M0 12 L30 12 M24 6 L30 12 L24 18" fill="none" stroke={colors.gold} strokeWidth="2" />
        </svg>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc600, margin: '0 0 8px 0' }}>After</p>
          <span style={{ fontSize: 48, fontFamily: 'monospace', fontWeight: 700, color: colors.green, animation: 'breathe 3s ease-in-out infinite' }}>
            {displayScore}%
          </span>
        </div>
      </div>
      
      {/* Section improvements */}
      <div style={{ 
        backgroundColor: colors.surface, 
        border: `1px solid ${colors.zinc800}`, 
        borderRadius: 16, 
        padding: 24,
        marginBottom: 40,
        minWidth: 350,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out 0.3s'
      }}>
        <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc500, margin: '0 0 16px 0' }}>
          Sections Improved
        </p>
        {improvements.map((imp, i) => (
          <div key={imp.name} style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: i < improvements.length - 1 ? `1px solid ${colors.zinc800}` : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{imp.icon}</span>
              <span style={{ fontSize: 14, color: colors.zinc300 }}>{imp.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: colors.zinc500 }}>{imp.before}%</span>
              <span style={{ color: colors.zinc600 }}>→</span>
              <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 600, color: colors.green }}>{imp.after}%</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* CTA */}
      <button onClick={onContinue} style={{
        padding: '16px 48px', fontSize: 16, fontWeight: 600,
        color: colors.bg, backgroundColor: colors.gold,
        border: 'none', borderRadius: 10, cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-out 0.5s',
        animation: 'breathe 4s ease-in-out infinite'
      }}>
        View Updated Profile
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ResearchAccelerantExperience() {
  const [screen, setScreen] = useState('intro'); // intro, running, findings, complete
  const [initialScore] = useState(28);
  const [finalScore, setFinalScore] = useState(28);
  const [addedCount, setAddedCount] = useState(0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, color: colors.white, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{keyframes}</style>
      
      {/* Header */}
      <div style={{ position: 'fixed', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, zIndex: 100 }}>
        <span style={{ color: colors.gold, fontSize: 20, fontWeight: 600 }}>33</span>
        <span style={{ color: colors.zinc600, fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' }}>CLARITY CANVAS</span>
      </div>
      
      {screen === 'intro' && (
        <ResearchIntroScreen 
          currentScore={initialScore}
          onStart={() => setScreen('running')} 
          onSkip={() => console.log('Skipped research')} 
        />
      )}
      
      {screen === 'running' && (
        <ResearchRunningScreen onComplete={() => setScreen('findings')} />
      )}
      
      {screen === 'findings' && (
        <FindingsReviewScreen 
          findings={researchFindings}
          initialScore={initialScore}
          onComplete={(score, count) => {
            setFinalScore(score);
            setAddedCount(count);
            setScreen('complete');
          }}
        />
      )}
      
      {screen === 'complete' && (
        <ResearchCompleteScreen 
          beforeScore={initialScore}
          afterScore={finalScore}
          addedCount={addedCount}
          onContinue={() => console.log('Continue to profile view')}
        />
      )}
    </div>
  );
}
