import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

const colors = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceDim: '#0d0d0d',
  elevated: '#1a1a1a',
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  goldGlow: 'rgba(212, 168, 75, 0.3)',
  green: '#4ADE80',
  greenGlow: 'rgba(74, 222, 128, 0.3)',
  yellow: '#FBBF24',
  orange: '#FB923C',
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
// CSS KEYFRAMES
// ============================================================================

const keyframes = `
  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.02); opacity: 1; }
  }
  @keyframes breatheSlow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.015); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 168, 75, 0.4); }
    50% { transform: scale(1.05); box-shadow: 0 0 25px 8px rgba(212, 168, 75, 0.15); }
  }
  @keyframes orbitPulse {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.3; }
  }
  @keyframes glowPulse {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(212, 168, 75, 0.3)); }
    50% { filter: drop-shadow(0 0 20px rgba(212, 168, 75, 0.6)); }
  }
  @keyframes fadeSlideUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideIn {
    0% { opacity: 0; transform: translateX(20px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    15% { transform: scale(1.15); }
    30% { transform: scale(1); }
    45% { transform: scale(1.1); }
  }
  @keyframes wave {
    0%, 100% { transform: scaleY(0.3); }
    50% { transform: scaleY(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes cardBreath {
    0%, 100% { border-color: rgba(39, 39, 42, 1); }
    50% { border-color: rgba(63, 63, 70, 1); }
  }
  @keyframes lowScorePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
    50% { box-shadow: 0 0 15px 3px rgba(249, 115, 22, 0.15); }
  }
  @keyframes scoreIncrease {
    0% { color: ${colors.zinc400}; }
    50% { color: ${colors.green}; transform: scale(1.1); }
    100% { color: inherit; transform: scale(1); }
  }
  @keyframes celebratePulse {
    0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
    50% { box-shadow: 0 0 30px 10px rgba(74, 222, 128, 0.2); }
    100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
  }
`;

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
// DATA
// ============================================================================

const cueQuestions = [
  "Who are you and what do you do?",
  "What organization are you part of?",
  "What's your role and responsibilities?",
  "What level of authority do you have?",
  "What are you trying to accomplish right now?",
  "What's the biggest challenge you're facing?"
];

// Initial shallow profile (post brain-dump)
const generateInitialProfile = () => ({
  user: { name: "Chase", level: 6, company: "PLYA" },
  overallScore: 24,
  sections: [
    { id: "individual", name: "Individual", icon: "👤", score: 28, angle: 270, summary: "Founder building in fitness/AI space.", subsections: ["Background", "Thinking", "Working", "Values"] },
    { id: "role", name: "Role", icon: "💼", score: 32, angle: 330, summary: "CEO at early-stage startup.", subsections: ["Responsibilities", "Scope", "Constraints"] },
    { id: "organization", name: "Organization", icon: "🏢", score: 22, angle: 30, summary: "PLYA - fitness/AI company.", subsections: ["Fundamentals", "Product", "Market"] },
    { id: "goals", name: "Goals", icon: "🎯", score: 18, angle: 90, summary: "Building and launching product.", subsections: ["Immediate", "Medium-term", "Metrics"] },
    { id: "network", name: "Network", icon: "🔗", score: 15, angle: 150, summary: "Network not yet captured.", subsections: ["Stakeholders", "Team", "Advisors"] },
    { id: "projects", name: "Projects", icon: "📁", score: 20, angle: 210, summary: "Working on PLYA MVP.", subsections: ["Active", "Upcoming", "Completed"] }
  ]
});

// Post-interview profile (higher scores)
const generateEnrichedProfile = () => ({
  user: { name: "Chase", level: 6, company: "PLYA" },
  overallScore: 52,
  sections: [
    { id: "individual", name: "Individual", icon: "👤", score: 58, angle: 270, summary: "Product-minded founder with consumer app background, building AI-powered fitness coaching.", subsections: ["Background", "Thinking", "Working", "Values"] },
    { id: "role", name: "Role", icon: "💼", score: 62, angle: 330, summary: "Solo founder/CEO making all product and business decisions at pre-seed stage.", subsections: ["Responsibilities", "Scope", "Constraints"] },
    { id: "organization", name: "Organization", icon: "🏢", score: 48, angle: 30, summary: "PLYA is pre-launch AI fitness startup targeting health-conscious millennials.", subsections: ["Fundamentals", "Product", "Market"] },
    { id: "goals", name: "Goals", icon: "🎯", score: 55, angle: 90, summary: "Ship MVP in 60 days, validate retention hypothesis, raise seed round.", subsections: ["Immediate", "Medium-term", "Metrics"] },
    { id: "network", name: "Network", icon: "🔗", score: 35, angle: 150, summary: "Solo founder, looking to build advisory network.", subsections: ["Stakeholders", "Team", "Advisors"] },
    { id: "projects", name: "Projects", icon: "📁", score: 45, angle: 210, summary: "MVP development in progress, beta launch planned.", subsections: ["Active", "Upcoming", "Completed"] }
  ]
});

// The 8 interview questions
const interviewQuestions = [
  {
    id: 'q1',
    type: 'this-or-that',
    category: 'Goals',
    question: "When you imagine success, which feels more true?",
    options: [
      { id: 'a', label: "Users come back every day", sublabel: "Retention is the north star" },
      { id: 'b', label: "Users tell their friends about it", sublabel: "Organic growth is the north star" }
    ]
  },
  {
    id: 'q2',
    type: 'this-or-that',
    category: 'Individual',
    question: "How do you naturally approach problems?",
    options: [
      { id: 'a', label: "Dive deep into data first", sublabel: "Analysis before action" },
      { id: 'b', label: "Trust my gut and iterate", sublabel: "Action generates clarity" }
    ]
  },
  {
    id: 'q3',
    type: 'slider',
    category: 'Organization',
    question: "How much runway do you currently have?",
    min: 0,
    max: 24,
    unit: 'months',
    markers: ['0', '6mo', '12mo', '18mo', '24+']
  },
  {
    id: 'q4',
    type: 'multi-select',
    category: 'Goals',
    question: "What are your biggest constraints right now?",
    instruction: "Select all that apply",
    options: [
      { id: 'time', label: "Time", icon: "⏰" },
      { id: 'money', label: "Capital", icon: "💰" },
      { id: 'team', label: "Team/talent", icon: "👥" },
      { id: 'clarity', label: "Strategic clarity", icon: "🎯" },
      { id: 'market', label: "Market access", icon: "🚪" },
      { id: 'tech', label: "Technical capabilities", icon: "⚙️" }
    ]
  },
  {
    id: 'q5',
    type: 'this-or-that',
    category: 'Role',
    question: "Right now, what do you need to be?",
    options: [
      { id: 'a', label: "The visionary", sublabel: "Setting direction, inspiring others" },
      { id: 'b', label: "The operator", sublabel: "Executing, getting things done" }
    ]
  },
  {
    id: 'q6',
    type: 'scale',
    category: 'Organization',
    question: "How validated is your core product hypothesis?",
    labels: ['Pure assumption', 'Some signals', 'Strong evidence', 'Proven']
  },
  {
    id: 'q7',
    type: 'this-or-that',
    category: 'Goals',
    question: "In 12 months, which outcome matters more?",
    options: [
      { id: 'a', label: "Profitable and sustainable", sublabel: "Control your own destiny" },
      { id: 'b', label: "Venture-scale growth", sublabel: "Raise and accelerate" }
    ]
  },
  {
    id: 'q8',
    type: 'multi-select',
    category: 'Network',
    question: "What kind of help would be most valuable right now?",
    instruction: "Select up to 3",
    maxSelect: 3,
    options: [
      { id: 'technical', label: "Technical expertise", icon: "💻" },
      { id: 'fundraising', label: "Fundraising intros", icon: "🤝" },
      { id: 'strategy', label: "Strategic thinking partner", icon: "🧠" },
      { id: 'design', label: "Design/UX help", icon: "🎨" },
      { id: 'hiring', label: "Hiring/recruiting", icon: "📋" },
      { id: 'customers', label: "Customer intros", icon: "👋" }
    ]
  }
];

// ============================================================================
// QUESTION META COMPONENTS
// ============================================================================

const NotSureCheckbox = ({ checked, onChange }) => (
  <label style={{ 
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    padding: '12px 16px',
    backgroundColor: checked ? 'rgba(251, 146, 60, 0.1)' : colors.surface,
    border: `1px solid ${checked ? colors.orange : colors.zinc800}`,
    borderRadius: 10, transition: 'all 0.2s ease'
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: 5,
      backgroundColor: checked ? colors.orange : 'transparent',
      border: `2px solid ${checked ? colors.orange : colors.zinc600}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s ease'
    }}>
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.bg} strokeWidth="3">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      )}
    </div>
    <div>
      <span style={{ fontSize: 13, color: checked ? colors.orange : colors.zinc400, fontWeight: 500 }}>
        I'm not sure about this
      </span>
      <p style={{ fontSize: 11, color: colors.zinc600, margin: '2px 0 0' }}>
        That's okay — we'll flag this for validation
      </p>
    </div>
  </label>
);

const ConfidenceSlider = ({ value, onChange, disabled }) => {
  const getColor = () => {
    if (value >= 70) return colors.green;
    if (value >= 40) return colors.gold;
    return colors.orange;
  };
  
  return (
    <div style={{ 
      padding: 16, backgroundColor: colors.surface, borderRadius: 10,
      border: `1px solid ${colors.zinc800}`,
      opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: colors.zinc500 }}>How confident are you in this assumption?</span>
        <span style={{ fontSize: 13, color: getColor(), fontWeight: 600, backgroundColor: `${getColor()}20`, padding: '3px 10px', borderRadius: 12 }}>
          {value}%
        </span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', height: 6, borderRadius: 3, background: `linear-gradient(to right, ${colors.orange} 0%, ${colors.gold} 50%, ${colors.green} 100%)`, appearance: 'none', cursor: 'pointer', opacity: 0.8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: colors.zinc600 }}>
        <span>Just guessing</span>
        <span>Fairly confident</span>
        <span>Have data</span>
      </div>
    </div>
  );
};

const AdditionalContextInput = ({ value, onChange, source, onSourceChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [expanded, setExpanded] = useState(!!value);
  
  if (!expanded && !value) {
    return (
      <button onClick={() => setExpanded(true)} style={{
        width: '100%', padding: '12px 16px', backgroundColor: colors.surface,
        border: `1px dashed ${colors.zinc700}`, borderRadius: 10, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.zinc500} strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span style={{ fontSize: 12, color: colors.zinc500 }}>Add context or reasoning (optional)</span>
      </button>
    );
  }
  
  return (
    <div style={{ backgroundColor: colors.surface, borderRadius: 10, border: `1px solid ${colors.zinc800}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${colors.zinc800}` }}>
        <span style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Context</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['voice', 'text'].map(s => (
            <button key={s} onClick={() => onSourceChange(s)} style={{
              width: 32, height: 28, borderRadius: 6,
              backgroundColor: source === s ? 'rgba(212, 168, 75, 0.2)' : 'transparent',
              border: `1px solid ${source === s ? colors.gold : colors.zinc700}`,
              color: source === s ? colors.gold : colors.zinc500,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {s === 'voice' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
              ) : <span style={{ fontSize: 10, fontWeight: 700 }}>Aa</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 12 }}>
        {source === 'voice' && !value ? (
          <button onClick={() => setIsRecording(!isRecording)} style={{
            width: '100%', padding: 20, backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : colors.elevated,
            border: `2px dashed ${isRecording ? colors.red : colors.zinc700}`, borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isRecording ? colors.red : colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.bg}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>
            </div>
            <span style={{ color: isRecording ? colors.red : colors.zinc400, fontSize: 12 }}>
              {isRecording ? 'Recording... tap to stop' : 'Tap to record your reasoning'}
            </span>
          </button>
        ) : (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Why did you answer this way? What's this based on?"
            style={{ width: '100%', minHeight: 70, padding: 0, backgroundColor: 'transparent', border: 'none', color: colors.white, fontSize: 13, lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
          />
        )}
      </div>
    </div>
  );
};

const QuestionMetaWrapper = ({ children, response, onResponseUpdate }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ opacity: response.isUnsure ? 0.5 : 1, pointerEvents: response.isUnsure ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
      {children}
    </div>
    <div style={{ height: 1, backgroundColor: colors.zinc800, margin: '4px 0' }} />
    <NotSureCheckbox checked={response.isUnsure} onChange={() => onResponseUpdate({ isUnsure: !response.isUnsure })} />
    <ConfidenceSlider value={response.confidence} onChange={(confidence) => onResponseUpdate({ confidence })} disabled={response.isUnsure} />
    <AdditionalContextInput value={response.additionalContext} onChange={(additionalContext) => onResponseUpdate({ additionalContext })} source={response.contextSource || 'text'} onSourceChange={(contextSource) => onResponseUpdate({ contextSource })} />
  </div>
);

// ============================================================================
// QUESTION TYPE COMPONENTS
// ============================================================================

const ThisOrThatQuestion = ({ question, value, onChange }) => (
  <div>
    <h2 style={{ fontSize: 22, fontWeight: 500, color: colors.white, margin: '0 0 24px 0', lineHeight: 1.4 }}>{question.question}</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {question.options.map(opt => (
        <button key={opt.id} onClick={() => onChange(opt.id)} style={{
          padding: '20px 24px', backgroundColor: value === opt.id ? 'rgba(212, 168, 75, 0.1)' : colors.surface,
          border: `2px solid ${value === opt.id ? colors.gold : colors.zinc800}`,
          borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
        }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: value === opt.id ? colors.gold : colors.white, display: 'block' }}>{opt.label}</span>
          <span style={{ fontSize: 13, color: colors.zinc500, marginTop: 4, display: 'block' }}>{opt.sublabel}</span>
        </button>
      ))}
    </div>
  </div>
);

const SliderQuestion = ({ question, value, onChange }) => (
  <div>
    <h2 style={{ fontSize: 22, fontWeight: 500, color: colors.white, margin: '0 0 24px 0', lineHeight: 1.4 }}>{question.question}</h2>
    <div style={{ padding: '24px', backgroundColor: colors.surface, borderRadius: 12, border: `1px solid ${colors.zinc800}` }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 48, fontWeight: 600, color: colors.gold }}>{value}</span>
        <span style={{ fontSize: 20, color: colors.zinc500, marginLeft: 8 }}>{question.unit}</span>
      </div>
      <input type="range" min={question.min} max={question.max} value={value} onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', height: 8, borderRadius: 4, background: colors.zinc800, appearance: 'none', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: colors.zinc600 }}>
        {question.markers.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  </div>
);

const MultiSelectQuestion = ({ question, value = [], onChange }) => {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else if (!question.maxSelect || value.length < question.maxSelect) {
      onChange([...value, id]);
    }
  };
  
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 500, color: colors.white, margin: '0 0 8px 0', lineHeight: 1.4 }}>{question.question}</h2>
      <p style={{ fontSize: 13, color: colors.zinc500, margin: '0 0 24px 0' }}>{question.instruction}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {question.options.map(opt => (
          <button key={opt.id} onClick={() => toggle(opt.id)} style={{
            padding: '16px', backgroundColor: value.includes(opt.id) ? 'rgba(212, 168, 75, 0.1)' : colors.surface,
            border: `2px solid ${value.includes(opt.id) ? colors.gold : colors.zinc800}`,
            borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease'
          }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{opt.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: value.includes(opt.id) ? colors.gold : colors.white }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ScaleQuestion = ({ question, value, onChange }) => (
  <div>
    <h2 style={{ fontSize: 22, fontWeight: 500, color: colors.white, margin: '0 0 24px 0', lineHeight: 1.4 }}>{question.question}</h2>
    <div style={{ display: 'flex', gap: 8 }}>
      {question.labels.map((label, i) => (
        <button key={i} onClick={() => onChange(i)} style={{
          flex: 1, padding: '20px 12px',
          backgroundColor: value === i ? 'rgba(212, 168, 75, 0.1)' : colors.surface,
          border: `2px solid ${value === i ? colors.gold : colors.zinc800}`,
          borderRadius: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease'
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: value === i ? colors.gold : colors.zinc400 }}>{label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ============================================================================
// BRAIN DUMP SCREENS (1-4)
// ============================================================================

const WelcomeScreen = ({ onStart }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(212,168,75,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out', marginBottom: 48, animation: 'glowPulse 3s ease-in-out infinite' }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: colors.gold }}>33</span>
      </div>
      <h1 style={{ fontSize: 48, fontWeight: 600, color: colors.white, margin: '0 0 16px 0', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out 0.2s' }}>Clarity Canvas</h1>
      <p style={{ fontSize: 20, color: colors.zinc400, margin: '0 0 48px 0', maxWidth: 500, lineHeight: 1.6, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out 0.4s' }}>
        Build your AI context profile in minutes. The more we understand you, the better we can help.
      </p>
      <button onClick={onStart} style={{ padding: '16px 48px', fontSize: 18, fontWeight: 600, color: colors.bg, backgroundColor: colors.gold, border: 'none', borderRadius: 12, cursor: 'pointer', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease-out 0.6s', animation: 'breathe 4s ease-in-out infinite' }}>
        Let's Begin
      </button>
      <p style={{ fontSize: 14, color: colors.zinc600, marginTop: 24, opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease-out 0.8s' }}>Takes about 5 minutes</p>
    </div>
  );
};

const BrainDumpScreen = ({ onStartRecording }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease-out' }}>
        <h2 style={{ fontSize: 32, fontWeight: 600, color: colors.white, margin: '0 0 12px 0' }}>Tell us about yourself</h2>
        <p style={{ fontSize: 16, color: colors.zinc400, margin: 0 }}>Just talk naturally for 30-60 seconds. We'll organize it for you.</p>
      </div>
      <div style={{ backgroundColor: colors.surface, border: `1px solid ${colors.zinc800}`, borderRadius: 16, padding: 32, maxWidth: 500, width: '100%', marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease-out 0.2s' }}>
        <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.zinc500, margin: '0 0 16px 0' }}>Things to mention</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {cueQuestions.map((q, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < cueQuestions.length - 1 ? `1px solid ${colors.zinc800}` : 'none', color: colors.zinc300, fontSize: 15, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-10px)', transition: `all 0.4s ease-out ${0.3 + i * 0.05}s` }}>
              <span style={{ color: colors.gold, marginTop: 2 }}>•</span>{q}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ position: 'relative', marginBottom: 24, opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease-out 0.5s' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 100, height: 100, borderRadius: '50%', border: `2px solid ${colors.gold}`, opacity: 0.3, animation: 'pulse 2s ease-in-out infinite' }} />
        <button onClick={onStartRecording} style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: colors.gold, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'breathe 3s ease-in-out infinite', boxShadow: `0 0 30px ${colors.goldGlow}` }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.bg} strokeWidth="2.5">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      </div>
      <button onClick={onStartRecording} style={{ fontSize: 14, color: colors.zinc500, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}>Prefer to type?</button>
    </div>
  );
};

const RecordingScreen = ({ onDone }) => {
  const [seconds, setSeconds] = useState(0);
  const [canFinish, setCanFinish] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => { setSeconds(s => { if (s >= 30 && !canFinish) setCanFinish(true); return s + 1; }); }, 1000);
    return () => clearInterval(timer);
  }, [canFinish]);
  const progress = Math.min(seconds / 30, 1);
  const circumference = 2 * Math.PI * 45;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="45" fill="none" stroke={colors.zinc800} strokeWidth="4" />
          <circle cx="60" cy="60" r="45" fill="none" stroke={colors.gold} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease-out' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.red, marginBottom: 4, animation: 'heartbeat 1s ease-in-out infinite' }} />
          <span style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 600, color: colors.white }}>{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 32, height: 40 }}>
        {[...Array(12)].map((_, i) => (<div key={i} style={{ width: 4, height: 40, backgroundColor: colors.gold, borderRadius: 2, animation: `wave 0.8s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />))}
      </div>
      <p style={{ fontSize: 16, color: colors.zinc400, marginBottom: 32 }}>{canFinish ? "Good! You can stop whenever you're ready." : "Keep going... tell us about yourself"}</p>
      <button onClick={onDone} disabled={!canFinish} style={{ padding: '14px 40px', fontSize: 16, fontWeight: 600, color: canFinish ? colors.bg : colors.zinc600, backgroundColor: canFinish ? colors.gold : colors.zinc800, border: 'none', borderRadius: 10, cursor: canFinish ? 'pointer' : 'not-allowed', transition: 'all 0.3s ease', animation: canFinish ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>
        {canFinish ? "Done" : `${30 - seconds}s remaining...`}
      </button>
    </div>
  );
};

const ProcessingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const steps = ["Transcribing audio...", "Extracting key details...", "Building your profile..."];
  useEffect(() => {
    const timers = [setTimeout(() => setStep(1), 1500), setTimeout(() => setStep(2), 3000), setTimeout(() => onComplete(), 4500)];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[0, 1, 2].map(i => (<div key={i} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.gold, animation: 'dotPulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />))}
      </div>
      <p style={{ fontSize: 18, color: colors.zinc300, marginBottom: 24 }}>{steps[step]}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: i <= step ? colors.zinc300 : colors.zinc600 }}>
            {i < step ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
             : i === step ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${colors.gold}`, borderTopColor: 'transparent', animation: 'rotate 1s linear infinite' }} />
             : <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${colors.zinc700}` }} />}
            <span style={{ fontSize: 14 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

const ViewModeToggle = ({ mode, onChange }) => (
  <div style={{ display: 'flex', backgroundColor: colors.surface, borderRadius: 8, padding: 4, border: `1px solid ${colors.zinc800}` }}>
    {[{ id: 'orbital', icon: '◎', label: 'Orbital' }, { id: 'list', icon: '☰', label: 'List' }].map(opt => (
      <button key={opt.id} onClick={() => onChange(opt.id)} style={{
        padding: '8px 16px', fontSize: 12, fontWeight: 500,
        color: mode === opt.id ? colors.gold : colors.zinc500,
        backgroundColor: mode === opt.id ? 'rgba(212, 168, 75, 0.1)' : 'transparent',
        border: 'none', borderRadius: 6, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease'
      }}>
        <span>{opt.icon}</span>{opt.label}
      </button>
    ))}
  </div>
);

const OrbitalView = ({ profile, selectedSection, onSelectSection, animateScores }) => {
  const centerRadius = 50;
  const orbitRadius = 150;

  return (
    <div style={{ position: 'relative', width: 420, height: 420, margin: '0 auto' }}>
      <svg width="420" height="420" viewBox="-210 -210 420 420" style={{ overflow: 'visible' }}>
        {[110, 150, 190].map((r, i) => (
          <circle key={r} r={r} fill="none" stroke={colors.zinc800} strokeWidth="1" opacity={0.3} style={{ animation: `orbitPulse ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
        ))}
        
        {profile.sections.map((section, i) => {
          const adjustedRadius = orbitRadius - ((100 - section.score) / 100) * 40;
          const pos = polarToCartesian(section.angle, adjustedRadius);
          const isSelected = selectedSection === section.id;
          const needsAttention = section.score < 30;
          
          return (
            <g key={section.id} onClick={() => onSelectSection(isSelected ? null : section.id)} style={{ cursor: 'pointer' }}>
              <line x1="0" y1="0" x2={pos.x} y2={pos.y} stroke={colors.zinc800} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <g transform={`translate(${pos.x}, ${pos.y})`}>
                {needsAttention && <circle r="38" fill="none" stroke={colors.orange} strokeWidth="2" opacity="0.3" style={{ animation: 'pulse 2s ease-in-out infinite' }} />}
                {animateScores && <circle r="38" fill="none" stroke={colors.green} strokeWidth="2" opacity="0.5" style={{ animation: 'celebratePulse 1s ease-out' }} />}
                <circle r="32" fill={colors.surface} stroke={isSelected ? colors.gold : colors.zinc700} strokeWidth={isSelected ? 2 : 1} style={{ animation: 'breatheSlow 4s ease-in-out infinite' }} />
                <circle r="28" fill="none" stroke={getScoreColor(section.score)} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 28 * section.score / 100} ${2 * Math.PI * 28}`} transform="rotate(-90)" strokeLinecap="round" opacity="0.8" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                <text textAnchor="middle" dominantBaseline="middle" fontSize="18" y="-3">{section.icon}</text>
                <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fontFamily="monospace" fontWeight="600" fill={getScoreColor(section.score)} y="14" style={{ animation: animateScores ? 'scoreIncrease 1s ease-out' : 'none' }}>{section.score}%</text>
              </g>
              <text x={pos.x} y={pos.y + 48} textAnchor="middle" fontSize="9" fontWeight="500" fill={colors.zinc500} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.name}</text>
            </g>
          );
        })}
        
        <g style={{ animation: 'breathe 4s ease-in-out infinite' }}>
          <circle r={centerRadius + 8} fill="url(#centerGlow)" />
          {animateScores && <circle r={centerRadius + 15} fill="none" stroke={colors.green} strokeWidth="2" opacity="0.5" style={{ animation: 'celebratePulse 1.5s ease-out' }} />}
          <circle r={centerRadius} fill={colors.surface} stroke={colors.gold} strokeWidth="2" />
          <circle r={centerRadius - 6} fill="none" stroke={getScoreColor(profile.overallScore)} strokeWidth="5" strokeDasharray={`${2 * Math.PI * (centerRadius - 6) * profile.overallScore / 100} ${2 * Math.PI * (centerRadius - 6)}`} transform="rotate(-90)" strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.5s ease-out' }} />
          <text textAnchor="middle" dominantBaseline="middle" fontSize="22" fontFamily="monospace" fontWeight="700" fill={getScoreColor(profile.overallScore)} y="-4" style={{ animation: animateScores ? 'scoreIncrease 1.5s ease-out' : 'none' }}>{profile.overallScore}%</text>
          <text textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={colors.zinc500} y="14" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Foundation</text>
        </g>
        
        <defs>
          <radialGradient id="centerGlow">
            <stop offset="0%" stopColor={colors.gold} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors.gold} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

const ListView = ({ profile, selectedSection, onSelectSection, animateScores }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500, margin: '0 auto' }}>
    <div style={{
      backgroundColor: colors.surface, border: `1px solid ${colors.zinc800}`, borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 8,
      animation: animateScores ? 'celebratePulse 1.5s ease-out' : 'cardBreath 4s ease-in-out infinite'
    }}>
      <span style={{ fontSize: 48, fontFamily: 'monospace', fontWeight: 700, color: getScoreColor(profile.overallScore), animation: animateScores ? 'scoreIncrease 1.5s ease-out' : 'breathe 4s ease-in-out infinite', display: 'inline-block', transition: 'color 0.5s ease' }}>
        {profile.overallScore}%
      </span>
      <p style={{ fontSize: 12, color: colors.zinc500, margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Foundation Score</p>
    </div>
    
    {profile.sections.map((section, i) => {
      const isSelected = selectedSection === section.id;
      const needsAttention = section.score < 30;
      return (
        <div key={section.id} onClick={() => onSelectSection(isSelected ? null : section.id)} style={{
          backgroundColor: colors.surface,
          border: `1px solid ${isSelected ? colors.gold : needsAttention ? 'rgba(249,115,22,0.3)' : colors.zinc800}`,
          borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.3s ease',
          animation: animateScores ? 'celebratePulse 1s ease-out' : needsAttention ? 'lowScorePulse 3s ease-in-out infinite' : 'cardBreath 4s ease-in-out infinite',
          animationDelay: animateScores ? `${i * 0.1}s` : `${i * 0.2}s`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{section.icon}</span>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 500, color: colors.white, margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{section.name}</h3>
                <p style={{ fontSize: 12, color: colors.zinc500, margin: '4px 0 0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{section.summary}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: getScoreColor(section.score), transition: 'color 0.5s ease', animation: animateScores ? 'scoreIncrease 1s ease-out' : 'none', animationDelay: `${i * 0.1}s` }}>{section.score}%</span>
              <div style={{ width: 50, height: 6, backgroundColor: colors.zinc800, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${section.score}%`, height: '100%', backgroundColor: getScoreColor(section.score), borderRadius: 3, transition: 'width 1s ease-out, background-color 0.5s ease', backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite' }} />
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ============================================================================
// INITIAL PROFILE SCREEN (with "Let's go deeper" CTA)
// ============================================================================

const InitialProfileScreen = ({ profile, onGoDeeper }) => {
  const [visible, setVisible] = useState(false);
  const [viewMode, setViewMode] = useState('orbital');
  const [selectedSection, setSelectedSection] = useState(null);
  
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
          <div>
            <p style={{ fontSize: 14, color: colors.gold, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Your Foundation</p>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: colors.white, margin: 0 }}>Hi, {profile.user.name} 👋</h1>
          </div>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
        
        <div style={{ marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease-out 0.2s' }}>
          {viewMode === 'orbital' ? (
            <OrbitalView profile={profile} selectedSection={selectedSection} onSelectSection={setSelectedSection} />
          ) : (
            <ListView profile={profile} selectedSection={selectedSection} onSelectSection={setSelectedSection} />
          )}
        </div>
        
        {/* "Let's go deeper" CTA */}
        <div style={{ 
          backgroundColor: colors.surface, border: `1px solid ${colors.zinc800}`, borderRadius: 16, padding: 32, textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease-out 0.4s'
        }}>
          <p style={{ fontSize: 13, color: colors.zinc500, margin: '0 0 4px 0' }}>Nice.</p>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: colors.white, margin: '0 0 8px 0' }}>We have a solid foundation.</h2>
          <p style={{ fontSize: 15, color: colors.zinc400, margin: '0 0 24px 0' }}>
            Now let's sharpen your vision with a few quick interactive questions.
          </p>
          <button onClick={onGoDeeper} style={{
            padding: '16px 48px', fontSize: 16, fontWeight: 600, color: colors.bg, backgroundColor: colors.gold,
            border: 'none', borderRadius: 10, cursor: 'pointer', animation: 'breathe 4s ease-in-out infinite'
          }}>
            Let's go deeper
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INTERVIEW QUESTION SCREEN
// ============================================================================

const InterviewQuestionScreen = ({ question, questionIndex, totalQuestions, onNext }) => {
  const [visible, setVisible] = useState(false);
  const [response, setResponse] = useState({
    value: question.type === 'slider' ? 6 : question.type === 'multi-select' ? [] : null,
    isUnsure: false,
    confidence: 50,
    additionalContext: '',
    contextSource: 'text'
  });
  
  useEffect(() => { 
    setVisible(false);
    setResponse({
      value: question.type === 'slider' ? 6 : question.type === 'multi-select' ? [] : null,
      isUnsure: false, confidence: 50, additionalContext: '', contextSource: 'text'
    });
    setTimeout(() => setVisible(true), 50);
  }, [question]);
  
  const handleResponseUpdate = (updates) => setResponse(prev => ({ ...prev, ...updates }));
  
  const canContinue = response.isUnsure || (
    question.type === 'multi-select' ? response.value.length > 0 : response.value !== null
  );

  const QuestionComponent = {
    'this-or-that': ThisOrThatQuestion,
    'slider': SliderQuestion,
    'multi-select': MultiSelectQuestion,
    'scale': ScaleQuestion
  }[question.type];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '40px 24px' }}>
      {/* Progress */}
      <div style={{ maxWidth: 500, width: '100%', margin: '0 auto 40px', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{question.category}</span>
          <span style={{ fontSize: 12, color: colors.zinc500 }}>{questionIndex + 1} / {totalQuestions}</span>
        </div>
        <div style={{ height: 4, backgroundColor: colors.zinc800, borderRadius: 2 }}>
          <div style={{ height: '100%', backgroundColor: colors.gold, borderRadius: 2, width: `${((questionIndex + 1) / totalQuestions) * 100}%`, transition: 'width 0.3s ease-out' }} />
        </div>
      </div>
      
      {/* Question */}
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        maxWidth: 500, width: '100%', margin: '0 auto',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.4s ease-out'
      }}>
        <QuestionMetaWrapper response={response} onResponseUpdate={handleResponseUpdate}>
          <QuestionComponent question={question} value={response.value} onChange={(value) => handleResponseUpdate({ value })} />
        </QuestionMetaWrapper>
        
        <button onClick={() => onNext(response)} disabled={!canContinue} style={{
          marginTop: 32, padding: '16px', fontSize: 16, fontWeight: 600,
          color: canContinue ? colors.bg : colors.zinc600,
          backgroundColor: canContinue ? colors.gold : colors.zinc800,
          border: 'none', borderRadius: 10, cursor: canContinue ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease'
        }}>
          {questionIndex < totalQuestions - 1 ? 'Continue' : 'See Results'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ENRICHED PROFILE SCREEN (with animated score increase)
// ============================================================================

const EnrichedProfileScreen = ({ initialProfile, enrichedProfile, onContinue }) => {
  const [visible, setVisible] = useState(false);
  const [viewMode, setViewMode] = useState('orbital');
  const [selectedSection, setSelectedSection] = useState(null);
  const [showingInitial, setShowingInitial] = useState(true);
  const [animateScores, setAnimateScores] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    // After 1s, switch to enriched and animate
    setTimeout(() => {
      setShowingInitial(false);
      setAnimateScores(true);
    }, 1500);
    // Turn off animation after it plays
    setTimeout(() => setAnimateScores(false), 3500);
  }, []);
  
  const displayProfile = showingInitial ? initialProfile : enrichedProfile;
  const scoreDiff = enrichedProfile.overallScore - initialProfile.overallScore;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
          <div>
            <p style={{ fontSize: 14, color: colors.gold, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Profile Updated</p>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: colors.white, margin: 0 }}>
              Looking sharper, {displayProfile.user.name} ✨
            </h1>
          </div>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
        
        {/* Score improvement banner */}
        {!showingInitial && (
          <div style={{
            backgroundColor: 'rgba(74, 222, 128, 0.1)', border: `1px solid rgba(74, 222, 128, 0.3)`,
            borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'center',
            animation: 'fadeSlideUp 0.5s ease-out'
          }}>
            <span style={{ fontSize: 14, color: colors.green }}>
              Foundation score increased by <strong>+{scoreDiff}%</strong>
            </span>
          </div>
        )}
        
        <div style={{ marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease-out 0.2s' }}>
          {viewMode === 'orbital' ? (
            <OrbitalView profile={displayProfile} selectedSection={selectedSection} onSelectSection={setSelectedSection} animateScores={animateScores} />
          ) : (
            <ListView profile={displayProfile} selectedSection={selectedSection} onSelectSection={setSelectedSection} animateScores={animateScores} />
          )}
        </div>
        
        {/* Continue CTA */}
        <div style={{ textAlign: 'center', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease-out 0.4s' }}>
          <p style={{ fontSize: 13, color: colors.zinc500, marginBottom: 16 }}>
            Click any section to explore deeper or continue to research
          </p>
          <button onClick={onContinue} style={{
            padding: '16px 48px', fontSize: 16, fontWeight: 600, color: colors.bg, backgroundColor: colors.gold,
            border: 'none', borderRadius: 10, cursor: 'pointer', animation: 'breathe 4s ease-in-out infinite'
          }}>
            Continue to Research
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT - FLOW CONTROLLER
// ============================================================================

export default function ClarityCanvasExperience() {
  const [screen, setScreen] = useState('welcome');
  const [initialProfile, setInitialProfile] = useState(null);
  const [enrichedProfile, setEnrichedProfile] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]);

  const handleBrainDumpComplete = () => {
    setInitialProfile(generateInitialProfile());
    setScreen('initial-profile');
  };

  const handleQuestionNext = (response) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions done
      setEnrichedProfile(generateEnrichedProfile());
      setScreen('enriched-profile');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, color: colors.white, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{keyframes}</style>
      
      {screen !== 'welcome' && (
        <div style={{ position: 'fixed', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, zIndex: 100 }}>
          <span style={{ color: colors.gold, fontSize: 20, fontWeight: 600 }}>33</span>
          <span style={{ color: colors.zinc600, fontSize: 12, fontWeight: 500, letterSpacing: '0.05em' }}>CLARITY CANVAS</span>
        </div>
      )}
      
      {screen === 'welcome' && <WelcomeScreen onStart={() => setScreen('braindump')} />}
      {screen === 'braindump' && <BrainDumpScreen onStartRecording={() => setScreen('recording')} />}
      {screen === 'recording' && <RecordingScreen onDone={() => setScreen('processing')} />}
      {screen === 'processing' && <ProcessingScreen onComplete={handleBrainDumpComplete} />}
      {screen === 'initial-profile' && initialProfile && (
        <InitialProfileScreen profile={initialProfile} onGoDeeper={() => setScreen('interview')} />
      )}
      {screen === 'interview' && (
        <InterviewQuestionScreen
          question={interviewQuestions[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={interviewQuestions.length}
          onNext={handleQuestionNext}
        />
      )}
      {screen === 'enriched-profile' && initialProfile && enrichedProfile && (
        <EnrichedProfileScreen
          initialProfile={initialProfile}
          enrichedProfile={enrichedProfile}
          onContinue={() => console.log('Continue to research accelerant')}
        />
      )}
    </div>
  );
}
