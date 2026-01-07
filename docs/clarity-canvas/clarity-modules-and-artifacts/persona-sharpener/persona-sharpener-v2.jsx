import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const colors = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceDim: '#0d0d0d',
  elevated: '#1a1a1a',
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  goldDim: '#B8923F',
  green: '#4ADE80',
  blue: '#60A5FA',
  orange: '#FB923C',
  red: '#EF4444',
  white: '#ffffff',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
};

// ============================================================================
// DATA MODEL - Assumption & Validation Structure
// ============================================================================

/*
Each response is stored with full metadata:
{
  questionId: string,
  field: string,                      // Which persona field this maps to
  value: any,                         // The actual answer
  isUnsure: boolean,                  // "I'm not sure" checkbox
  confidence: number,                 // 0-100 confidence slider
  additionalContext: string,          // Optional elaboration
  contextSource: 'voice' | 'text',    // How context was captured
  
  // Tagging for validation system
  responseType: 'assumption' | 'validation',
  respondentId: string,
  respondentRole: 'founder' | 'real-user',
  sessionId: string,
  createdAt: ISO timestamp
}

Persona fields track validation status:
{
  field: 'demographics.ageRange',
  assumedValue: 'middle',
  assumedConfidence: 75,
  validations: [
    { userId: 'user-1', value: 'younger', confidence: 90 },
    { userId: 'user-2', value: 'middle', confidence: 85 },
  ],
  validationAlignment: 0.5,           // 50% matched assumption
  suggestedValue: 'younger',          // Consensus from validations
  needsReview: true
}
*/

// ============================================================================
// QUESTION DATA - Research-backed questions
// ============================================================================

const questionBank = {
  identity: [
    {
      id: 'age-range',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics.ageRange',
      question: "Your ideal customer is more likely to be...",
      validationQuestion: "Which age range best describes you?",
      options: [
        { value: 'younger', label: '18-35', sublabel: 'Digital native, mobile-first' },
        { value: 'middle', label: '35-50', sublabel: 'Established career, time-poor' },
        { value: 'older', label: '50+', sublabel: 'More deliberate, values quality' }
      ]
    },
    {
      id: 'lifestyle',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics.lifestyle',
      question: "Which better describes their lifestyle?",
      validationQuestion: "Which better describes your lifestyle?",
      options: [
        { value: 'busy-professional', label: 'Busy Professional', sublabel: 'Career-focused, optimizes for efficiency' },
        { value: 'balanced-seeker', label: 'Balance Seeker', sublabel: 'Prioritizes work-life harmony' }
      ]
    },
    {
      id: 'tech-savvy',
      type: 'slider',
      category: 'identity',
      field: 'demographics.techSavviness',
      question: "How tech-savvy is your typical customer?",
      validationQuestion: "How tech-savvy would you say you are?",
      min: 'Prefers simplicity',
      max: 'Power user',
      defaultValue: 50
    },
    {
      id: 'decision-style',
      type: 'this-or-that',
      category: 'identity',
      field: 'behaviors.decisionStyle',
      question: "When trying something new, they typically...",
      validationQuestion: "When trying something new, you typically...",
      options: [
        { value: 'researcher', label: 'Research First', sublabel: 'Reads reviews, compares options' },
        { value: 'action-taker', label: 'Jump In', sublabel: 'Figures it out as they go' }
      ]
    }
  ],
  
  goals: [
    {
      id: 'primary-goal',
      type: 'ranking',
      category: 'goals',
      field: 'goals.priorities',
      question: "Rank what matters most to your customer:",
      validationQuestion: "Rank what matters most to you:",
      items: [
        { id: 'save-time', label: 'Save time' },
        { id: 'save-money', label: 'Save money' },
        { id: 'look-good', label: 'Look/feel good' },
        { id: 'be-healthy', label: 'Be healthier' },
        { id: 'reduce-stress', label: 'Reduce stress' },
        { id: 'achieve-more', label: 'Achieve more' }
      ]
    },
    {
      id: 'success-scenario',
      type: 'fill-blank',
      category: 'goals',
      field: 'goals.successDefinition',
      question: "Complete this from your customer's perspective:",
      validationQuestion: "Complete this from your perspective:",
      template: "I would consider this product a success if it helped me {blank} within {timeframe}.",
      blanks: [
        { id: 'blank', placeholder: "achieve what outcome?" },
        { id: 'timeframe', placeholder: "what timeframe?", suggestions: ['a week', 'a month', '3 months'] }
      ]
    },
    {
      id: 'functional-job',
      type: 'scenario',
      category: 'goals',
      field: 'jobs.functional',
      question: "When your customer uses your product, what's the primary task they're trying to accomplish?",
      validationQuestion: "When you use products like this, what's the primary task you're trying to accomplish?",
      placeholder: "e.g., 'Fit a workout into their lunch break' or 'Find the right gift in under 5 minutes'",
      helperText: "Focus on the functional job — what they literally need to get done"
    }
  ],
  
  frustrations: [
    {
      id: 'past-failures',
      type: 'scenario',
      category: 'frustrations',
      field: 'frustrations.pastFailures',
      question: "What have they tried before that didn't work? Why did it fail them?",
      validationQuestion: "What have you tried before that didn't work? Why did it fail you?",
      placeholder: "e.g., 'They tried fitness apps but hated logging every meal...'",
      helperText: "Understanding past failures reveals what NOT to do"
    },
    {
      id: 'dealbreakers',
      type: 'multi-select',
      category: 'frustrations',
      field: 'frustrations.dealbreakers',
      question: "Which of these would make them abandon a product like yours?",
      validationQuestion: "Which of these would make you abandon a product like this?",
      options: [
        { id: 'too-complex', label: 'Too complicated to set up' },
        { id: 'too-slow', label: 'Takes too long to see results' },
        { id: 'too-expensive', label: 'Costs too much' },
        { id: 'too-needy', label: 'Requires too much daily effort' },
        { id: 'too-generic', label: 'Feels generic, not personalized' },
        { id: 'bad-support', label: 'Poor customer support' },
        { id: 'privacy', label: 'Privacy/data concerns' },
        { id: 'social-required', label: 'Forces social features' }
      ],
      maxSelections: 3,
      instruction: "Select up to 3"
    },
    {
      id: 'current-workaround',
      type: 'fill-blank',
      category: 'frustrations',
      field: 'frustrations.currentWorkaround',
      question: "How do they currently solve this problem (without your product)?",
      validationQuestion: "How do you currently solve this problem?",
      template: "Right now, they {workaround}, but they hate it because {reason}.",
      blanks: [
        { id: 'workaround', placeholder: "what do they do?" },
        { id: 'reason', placeholder: "why is it frustrating?" }
      ]
    }
  ],
  
  emotional: [
    {
      id: 'emotional-job',
      type: 'this-or-that',
      category: 'emotional',
      field: 'jobs.emotional',
      question: "When using your product, they primarily want to feel...",
      validationQuestion: "When using products like this, you primarily want to feel...",
      options: [
        { value: 'in-control', label: 'In Control', sublabel: 'Confident, organized, on top of things' },
        { value: 'accomplished', label: 'Accomplished', sublabel: 'Proud, successful, making progress' },
        { value: 'cared-for', label: 'Cared For', sublabel: 'Supported, understood, not alone' },
        { value: 'free', label: 'Free', sublabel: 'Unburdened, relaxed, without worry' }
      ]
    },
    {
      id: 'voice-capture',
      type: 'voice',
      category: 'emotional',
      field: 'quote',
      question: "In your customer's voice, what would they say is their biggest frustration?",
      validationQuestion: "In your own words, what's your biggest frustration in this area?",
      placeholder: "Speak naturally — we're capturing authentic language",
      helperText: "This quote will appear on the persona card"
    },
    {
      id: 'recommendation-trigger',
      type: 'scenario',
      category: 'emotional',
      field: 'emotional.recommendationTrigger',
      question: "What would make them tell a friend about your product?",
      validationQuestion: "What would make you tell a friend about a product like this?",
      placeholder: "e.g., 'If they finally stuck with a routine for more than 2 weeks...'",
      helperText: "This reveals the emotional payoff they're really seeking"
    }
  ],
  
  social: [
    {
      id: 'social-job',
      type: 'this-or-that',
      category: 'social',
      field: 'jobs.social',
      question: "How do they want to be perceived by others?",
      validationQuestion: "How do you want to be perceived by others in this area?",
      options: [
        { value: 'competent', label: 'Competent', sublabel: 'Has their act together' },
        { value: 'aspirational', label: 'Aspirational', sublabel: 'Someone to look up to' },
        { value: 'relatable', label: 'Relatable', sublabel: 'Down to earth, authentic' },
        { value: 'innovative', label: 'Innovative', sublabel: 'Ahead of the curve' }
      ]
    },
    {
      id: 'influence-sources',
      type: 'multi-select',
      category: 'social',
      field: 'behaviors.influences',
      question: "Who influences their decisions in this area?",
      validationQuestion: "Who influences your decisions in this area?",
      options: [
        { id: 'friends', label: 'Friends & family' },
        { id: 'colleagues', label: 'Colleagues & peers' },
        { id: 'influencers', label: 'Social media influencers' },
        { id: 'experts', label: 'Industry experts' },
        { id: 'reviews', label: 'Online reviews' },
        { id: 'nobody', label: 'Research independently' }
      ],
      maxSelections: 2,
      instruction: "Select top 2"
    }
  ],
  
  behaviors: [
    {
      id: 'discovery-channel',
      type: 'ranking',
      category: 'behaviors',
      field: 'behaviors.discoveryChannels',
      question: "Where are they most likely to discover products like yours?",
      validationQuestion: "Where are you most likely to discover products like this?",
      items: [
        { id: 'social', label: 'Social media' },
        { id: 'search', label: 'Google search' },
        { id: 'friend', label: 'Friend recommendation' },
        { id: 'content', label: 'Blog/article/podcast' },
        { id: 'app-store', label: 'App store browsing' },
        { id: 'ads', label: 'Paid ads' }
      ]
    },
    {
      id: 'usage-time',
      type: 'this-or-that',
      category: 'behaviors',
      field: 'behaviors.usageTime',
      question: "When would they most likely use your product?",
      validationQuestion: "When would you most likely use a product like this?",
      options: [
        { value: 'morning', label: 'Morning', sublabel: 'Part of their wake-up routine' },
        { value: 'workday', label: 'During Work', sublabel: 'Micro-moments between tasks' },
        { value: 'evening', label: 'Evening', sublabel: 'Wind-down or planning time' },
        { value: 'weekend', label: 'Weekend', sublabel: 'Dedicated personal time' }
      ]
    },
    {
      id: 'time-available',
      type: 'slider',
      category: 'behaviors',
      field: 'behaviors.timeAvailable',
      question: "How much time can they realistically dedicate to this?",
      validationQuestion: "How much time can you realistically dedicate to this?",
      min: '< 5 min/day',
      max: '30+ min/day',
      defaultValue: 30
    }
  ],
  
  antiPatterns: [
    {
      id: 'not-customer',
      type: 'multi-select',
      category: 'antiPatterns',
      field: 'antiPatterns',
      question: "Who is explicitly NOT your customer?",
      validationQuestion: null, // Skip in validation mode
      options: [
        { id: 'price-sensitive', label: 'People who only care about price' },
        { id: 'experts', label: 'People who already know everything' },
        { id: 'no-problem', label: 'People who don\'t have this problem' },
        { id: 'no-change', label: 'People resistant to change' },
        { id: 'wrong-platform', label: 'People on wrong platforms' },
        { id: 'wrong-stage', label: 'People at wrong life stage' }
      ],
      maxSelections: 3,
      instruction: "Select up to 3"
    }
  ]
};

// Build question sequence
const questionSequence = [
  ...questionBank.identity.slice(0, 2),
  ...questionBank.goals.slice(0, 2),
  ...questionBank.frustrations.slice(0, 2),
  ...questionBank.emotional.slice(0, 2),
  ...questionBank.behaviors.slice(0, 2),
  ...questionBank.identity.slice(2),
  ...questionBank.goals.slice(2),
  ...questionBank.frustrations.slice(2),
  ...questionBank.social,
  ...questionBank.behaviors.slice(2),
  ...questionBank.antiPatterns
];

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialPersona = {
  id: 'persona-1',
  name: '',
  archetype: '',
  summary: '',
  quote: '',
  demographics: {},
  jobs: { functional: '', emotional: '', social: '' },
  goals: { priorities: [], successDefinition: {} },
  frustrations: { pastFailures: '', dealbreakers: [], currentWorkaround: {} },
  behaviors: {},
  antiPatterns: [],
};

// Create empty response for a question
const createEmptyResponse = (questionId, field) => ({
  questionId,
  field,
  value: undefined,
  isUnsure: false,
  confidence: 50, // Default middle confidence
  additionalContext: '',
  contextSource: null,
  responseType: 'assumption',
  respondentId: 'founder',
  respondentRole: 'founder',
  sessionId: `session-${Date.now()}`,
  createdAt: new Date().toISOString()
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateArchetype = (persona) => {
  const emotionalJob = persona.jobs?.emotional || '';
  const lifestyle = persona.demographics?.lifestyle || '';
  
  const archetypes = {
    'in-control-busy-professional': 'The Efficient Optimizer',
    'in-control-balanced-seeker': 'The Calm Commander',
    'accomplished-busy-professional': 'The Driven Achiever',
    'accomplished-balanced-seeker': 'The Mindful Achiever',
    'cared-for-busy-professional': 'The Overwhelmed Overcomer',
    'cared-for-balanced-seeker': 'The Supported Striver',
    'free-busy-professional': 'The Escaping Executive',
    'free-balanced-seeker': 'The Peace Seeker'
  };
  
  return archetypes[`${emotionalJob}-${lifestyle}`] || 'Your Ideal Customer';
};

const generateSummary = (persona) => {
  const parts = [];
  
  if (persona.demographics?.ageRange) {
    const ageDesc = { 'younger': 'Young professional', 'middle': 'Mid-career professional', 'older': 'Experienced professional' };
    parts.push(ageDesc[persona.demographics.ageRange] || '');
  }
  
  if (persona.demographics?.lifestyle === 'busy-professional') {
    parts.push('juggling multiple priorities');
  } else if (persona.demographics?.lifestyle === 'balanced-seeker') {
    parts.push('seeking work-life harmony');
  }
  
  if (persona.jobs?.emotional) {
    const emotionalDesc = {
      'in-control': 'who wants to feel in control',
      'accomplished': 'who craves accomplishment',
      'cared-for': 'who needs to feel supported',
      'free': 'who yearns for freedom'
    };
    parts.push(emotionalDesc[persona.jobs.emotional] || '');
  }
  
  return parts.length > 0 ? parts.join(' ') + '.' : 'Answer questions to build their profile.';
};

const calculateClarity = (responses) => {
  const scores = { identity: 0, goals: 0, frustrations: 0, emotional: 0, behaviors: 0 };
  const categoryCounts = { identity: 0, goals: 0, frustrations: 0, emotional: 0, behaviors: 0 };
  
  // Count questions per category
  questionSequence.forEach(q => {
    if (scores[q.category] !== undefined) {
      categoryCounts[q.category]++;
    }
  });
  
  // Calculate scores based on answered questions (not unsure)
  Object.values(responses).forEach(response => {
    const question = questionSequence.find(q => q.id === response.questionId);
    if (question && !response.isUnsure && response.value !== undefined) {
      const category = question.category;
      if (scores[category] !== undefined && categoryCounts[category] > 0) {
        scores[category] += (100 / categoryCounts[category]);
      }
    }
  });
  
  Object.keys(scores).forEach(key => {
    scores[key] = Math.min(100, Math.round(scores[key]));
  });
  
  scores.overall = Math.round(Object.values(scores).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0) / 5);
  
  return scores;
};

const getAverageConfidence = (responses) => {
  const values = Object.values(responses)
    .filter(r => !r.isUnsure && r.value !== undefined)
    .map(r => r.confidence);
  
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

const getUnsureCount = (responses) => {
  return Object.values(responses).filter(r => r.isUnsure).length;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Clarity Bar
const ClarityBar = ({ value, size = 'normal' }) => {
  const getColor = (val) => {
    if (val >= 70) return colors.green;
    if (val >= 40) return colors.gold;
    return colors.zinc600;
  };
  
  return (
    <div style={{ 
      height: size === 'small' ? 3 : 4, 
      backgroundColor: colors.zinc800, 
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <div style={{
        height: '100%',
        width: `${value}%`,
        backgroundColor: getColor(value),
        borderRadius: 2,
        transition: 'width 0.5s ease-out'
      }} />
    </div>
  );
};

// "I'm Not Sure" Checkbox
const NotSureCheckbox = ({ checked, onChange }) => (
  <label style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    cursor: 'pointer',
    padding: '12px 16px',
    backgroundColor: checked ? 'rgba(251, 146, 60, 0.1)' : colors.surface,
    border: `1px solid ${checked ? colors.orange : colors.zinc800}`,
    borderRadius: 10,
    transition: 'all 0.2s ease'
  }}>
    <div style={{
      width: 20,
      height: 20,
      borderRadius: 5,
      backgroundColor: checked ? colors.orange : 'transparent',
      border: `2px solid ${checked ? colors.orange : colors.zinc600}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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

// Confidence Slider
const ConfidenceSlider = ({ value, onChange, disabled }) => {
  const getColor = () => {
    if (value >= 70) return colors.green;
    if (value >= 40) return colors.gold;
    return colors.orange;
  };
  
  return (
    <div style={{ 
      padding: 16, 
      backgroundColor: colors.surface, 
      borderRadius: 10,
      border: `1px solid ${colors.zinc800}`,
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: colors.zinc500 }}>
          How confident are you in this assumption?
        </span>
        <span style={{ 
          fontSize: 13, 
          color: getColor(), 
          fontWeight: 600,
          backgroundColor: `${getColor()}20`,
          padding: '3px 10px',
          borderRadius: 12
        }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(to right, ${colors.orange} 0%, ${colors.gold} 50%, ${colors.green} 100%)`,
          appearance: 'none',
          cursor: 'pointer',
          opacity: 0.8
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: colors.zinc600 }}>
        <span>Just guessing</span>
        <span>Fairly confident</span>
        <span>Have data</span>
      </div>
    </div>
  );
};

// Additional Context Input with Voice/Text Toggle
const AdditionalContextInput = ({ value, onChange, source, onSourceChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [expanded, setExpanded] = useState(!!value);
  
  if (!expanded && !value) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: colors.surface,
          border: `1px dashed ${colors.zinc700}`,
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.zinc500} strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span style={{ fontSize: 12, color: colors.zinc500 }}>
          Add context or reasoning (optional)
        </span>
      </button>
    );
  }
  
  return (
    <div style={{ 
      backgroundColor: colors.surface, 
      borderRadius: 10,
      border: `1px solid ${colors.zinc800}`,
      overflow: 'hidden'
    }}>
      {/* Header with toggle */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1px solid ${colors.zinc800}`
      }}>
        <span style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Additional Context
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onSourceChange('voice')}
            style={{
              width: 32,
              height: 28,
              borderRadius: 6,
              backgroundColor: source === 'voice' ? 'rgba(212, 168, 75, 0.2)' : 'transparent',
              border: `1px solid ${source === 'voice' ? colors.gold : colors.zinc700}`,
              color: source === 'voice' ? colors.gold : colors.zinc500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Voice input"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            </svg>
          </button>
          <button
            onClick={() => onSourceChange('text')}
            style={{
              width: 32,
              height: 28,
              borderRadius: 6,
              backgroundColor: source === 'text' ? 'rgba(212, 168, 75, 0.2)' : 'transparent',
              border: `1px solid ${source === 'text' ? colors.gold : colors.zinc700}`,
              color: source === 'text' ? colors.gold : colors.zinc500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Text input"
          >
            <span style={{ fontSize: 10, fontWeight: 700 }}>Aa</span>
          </button>
        </div>
      </div>
      
      {/* Input area */}
      <div style={{ padding: 12 }}>
        {source === 'voice' && !value ? (
          <button
            onClick={() => setIsRecording(!isRecording)}
            style={{
              width: '100%',
              padding: 20,
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : colors.elevated,
              border: `2px dashed ${isRecording ? colors.red : colors.zinc700}`,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: isRecording ? colors.red : colors.gold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.bg}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              </svg>
            </div>
            <span style={{ color: isRecording ? colors.red : colors.zinc400, fontSize: 12 }}>
              {isRecording ? 'Recording... tap to stop' : 'Tap to record your reasoning'}
            </span>
          </button>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Why did you answer this way? What's this based on? (customer interviews, data, gut feeling...)"
            style={{
              width: '100%',
              minHeight: 70,
              padding: 0,
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.white,
              fontSize: 13,
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        )}
      </div>
    </div>
  );
};

// Question Meta Wrapper - Wraps every question with standard elements
const QuestionMetaWrapper = ({ children, response, onResponseUpdate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main Question Content */}
      <div style={{ 
        opacity: response.isUnsure ? 0.5 : 1,
        pointerEvents: response.isUnsure ? 'none' : 'auto',
        transition: 'opacity 0.2s ease'
      }}>
        {children}
      </div>
      
      {/* Divider */}
      <div style={{ height: 1, backgroundColor: colors.zinc800, margin: '4px 0' }} />
      
      {/* Not Sure Checkbox */}
      <NotSureCheckbox 
        checked={response.isUnsure} 
        onChange={(e) => onResponseUpdate({ isUnsure: !response.isUnsure })}
      />
      
      {/* Confidence Slider */}
      <ConfidenceSlider
        value={response.confidence}
        onChange={(confidence) => onResponseUpdate({ confidence })}
        disabled={response.isUnsure}
      />
      
      {/* Additional Context */}
      <AdditionalContextInput
        value={response.additionalContext}
        onChange={(additionalContext) => onResponseUpdate({ additionalContext })}
        source={response.contextSource || 'text'}
        onSourceChange={(contextSource) => onResponseUpdate({ contextSource })}
      />
    </div>
  );
};

// ============================================================================
// QUESTION TYPE COMPONENTS
// ============================================================================

const ThisOrThatQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 16, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((option) => (
          <button
            key={option.value}
            onClick={() => onAnswer(option.value)}
            style={{
              padding: '14px 18px',
              backgroundColor: currentValue === option.value ? 'rgba(212, 168, 75, 0.15)' : colors.surface,
              border: `1px solid ${currentValue === option.value ? colors.gold : colors.zinc800}`,
              borderRadius: 10,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: currentValue === option.value ? colors.gold : colors.white,
              marginBottom: option.sublabel ? 3 : 0
            }}>
              {option.label}
            </div>
            {option.sublabel && (
              <div style={{ fontSize: 12, color: colors.zinc500 }}>{option.sublabel}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const SliderQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  const value = currentValue ?? question.defaultValue;
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 20, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      <div style={{ padding: '8px' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onAnswer(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(to right, ${colors.gold} 0%, ${colors.gold} ${value}%, ${colors.zinc700} ${value}%, ${colors.zinc700} 100%)`,
            appearance: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: colors.zinc500 }}>
          <span>{question.min}</span>
          <span>{question.max}</span>
        </div>
      </div>
    </div>
  );
};

const RankingQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  const [items, setItems] = useState(currentValue || question.items.map((item, idx) => ({ ...item, rank: idx + 1 })));
  const [draggedItem, setDraggedItem] = useState(null);
  
  const handleDragStart = (e, item) => { setDraggedItem(item); e.dataTransfer.effectAllowed = 'move'; };
  
  const handleDragOver = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;
    const newItems = [...items];
    const draggedIdx = newItems.findIndex(i => i.id === draggedItem.id);
    const targetIdx = newItems.findIndex(i => i.id === targetItem.id);
    newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);
    setItems(newItems.map((item, idx) => ({ ...item, rank: idx + 1 })));
  };
  
  const handleDragEnd = () => { 
    setDraggedItem(null); 
    onAnswer(items); 
  };
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 6, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      <p style={{ fontSize: 12, color: colors.zinc500, marginBottom: 16 }}>Drag to reorder — most important at top</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              backgroundColor: draggedItem?.id === item.id ? 'rgba(212, 168, 75, 0.1)' : colors.surface,
              border: `1px solid ${idx === 0 ? colors.gold : colors.zinc800}`,
              borderRadius: 8,
              cursor: 'grab'
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              backgroundColor: idx === 0 ? colors.gold : colors.zinc700,
              color: idx === 0 ? colors.bg : colors.zinc400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700
            }}>
              {idx + 1}
            </div>
            <span style={{ color: idx === 0 ? colors.gold : colors.white, fontWeight: idx === 0 ? 600 : 400, fontSize: 13 }}>
              {item.label}
            </span>
            <div style={{ marginLeft: 'auto', color: colors.zinc600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MultiSelectQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  const selected = currentValue || [];
  
  const toggleOption = (optionId) => {
    let newSelected;
    if (selected.includes(optionId)) {
      newSelected = selected.filter(id => id !== optionId);
    } else if (selected.length < question.maxSelections) {
      newSelected = [...selected, optionId];
    } else {
      return;
    }
    onAnswer(newSelected);
  };
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 6, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      <p style={{ fontSize: 12, color: colors.zinc500, marginBottom: 16 }}>{question.instruction}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isDisabled = selected.length >= question.maxSelections && !isSelected;
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              style={{
                padding: '8px 14px',
                backgroundColor: isSelected ? 'rgba(212, 168, 75, 0.15)' : colors.surface,
                border: `1px solid ${isSelected ? colors.gold : colors.zinc800}`,
                borderRadius: 16,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.4 : 1,
                fontSize: 12,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? colors.gold : colors.zinc400
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FillBlankQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  const values = currentValue || {};
  const parts = question.template.split(/\{(\w+)\}/g);
  
  const updateValue = (blankId, value) => {
    onAnswer({ ...values, [blankId]: value });
  };
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 16, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      <div style={{ 
        padding: 16, 
        backgroundColor: colors.surface, 
        borderRadius: 10,
        border: `1px solid ${colors.zinc800}`,
        fontSize: 14,
        lineHeight: 2.2,
        color: colors.zinc400
      }}>
        {parts.map((part, idx) => {
          const blank = question.blanks.find(b => b.id === part);
          if (blank) {
            return (
              <span key={idx} style={{ display: 'inline-block', verticalAlign: 'bottom' }}>
                <input
                  type="text"
                  value={values[blank.id] || ''}
                  onChange={(e) => updateValue(blank.id, e.target.value)}
                  placeholder={blank.placeholder}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${values[blank.id] ? colors.gold : colors.zinc700}`,
                    color: colors.white,
                    fontSize: 14,
                    fontWeight: 500,
                    padding: '3px 6px',
                    minWidth: 140,
                    outline: 'none'
                  }}
                />
                {blank.suggestions && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, marginBottom: 6 }}>
                    {blank.suggestions.map(sug => (
                      <button
                        key={sug}
                        onClick={() => updateValue(blank.id, sug)}
                        style={{
                          fontSize: 10,
                          padding: '3px 6px',
                          backgroundColor: colors.elevated,
                          border: 'none',
                          borderRadius: 3,
                          color: colors.zinc500,
                          cursor: 'pointer'
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    </div>
  );
};

const ScenarioQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 6, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      {question.helperText && (
        <p style={{ fontSize: 12, color: colors.zinc500, marginBottom: 14 }}>{question.helperText}</p>
      )}
      <textarea
        value={currentValue || ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder={question.placeholder}
        style={{
          width: '100%',
          minHeight: 100,
          padding: 14,
          backgroundColor: colors.surface,
          border: `1px solid ${currentValue ? colors.zinc700 : colors.zinc800}`,
          borderRadius: 10,
          color: colors.white,
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
};

const VoiceCaptureQuestion = ({ question, onAnswer, currentValue, isValidation }) => {
  const displayQuestion = isValidation && question.validationQuestion ? question.validationQuestion : question.question;
  const [useText, setUseText] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 500, color: colors.white, marginBottom: 6, lineHeight: 1.4 }}>
        {displayQuestion}
      </p>
      {question.helperText && (
        <p style={{ fontSize: 12, color: colors.zinc500, marginBottom: 14 }}>{question.helperText}</p>
      )}
      
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => setUseText(false)}
          style={{
            padding: '6px 12px',
            backgroundColor: !useText ? colors.gold : 'transparent',
            border: `1px solid ${!useText ? colors.gold : colors.zinc700}`,
            borderRadius: 6,
            color: !useText ? colors.bg : colors.zinc500,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          </svg>
          Voice
        </button>
        <button
          onClick={() => setUseText(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: useText ? colors.gold : 'transparent',
            border: `1px solid ${useText ? colors.gold : colors.zinc700}`,
            borderRadius: 6,
            color: useText ? colors.bg : colors.zinc500,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600 }}>Aa</span>
          Type
        </button>
      </div>
      
      {useText ? (
        <textarea
          value={currentValue || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={`"${question.placeholder}"`}
          style={{
            width: '100%',
            minHeight: 80,
            padding: 14,
            backgroundColor: colors.surface,
            border: `1px solid ${currentValue ? colors.zinc700 : colors.zinc800}`,
            borderRadius: 10,
            color: colors.white,
            fontSize: 14,
            fontStyle: 'italic',
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'Georgia, serif'
          }}
        />
      ) : (
        <button
          onClick={() => setIsRecording(!isRecording)}
          style={{
            width: '100%',
            padding: 24,
            backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : colors.surface,
            border: `2px dashed ${isRecording ? colors.red : colors.zinc700}`,
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: isRecording ? colors.red : colors.gold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={colors.bg}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            </svg>
          </div>
          <span style={{ color: isRecording ? colors.red : colors.zinc400, fontSize: 13 }}>
            {isRecording ? 'Recording... tap to stop' : 'Tap to record'}
          </span>
        </button>
      )}
    </div>
  );
};

// Question Router
const QuestionContent = ({ question, onAnswer, currentValue, isValidation }) => {
  switch (question.type) {
    case 'this-or-that':
      return <ThisOrThatQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    case 'slider':
      return <SliderQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    case 'ranking':
      return <RankingQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    case 'multi-select':
      return <MultiSelectQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    case 'fill-blank':
      return <FillBlankQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    case 'scenario':
      return <ScenarioQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    case 'voice':
      return <VoiceCaptureQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} isValidation={isValidation} />;
    default:
      return null;
  }
};

// ============================================================================
// PERSONA CARD COMPONENT
// ============================================================================

const PersonaCard = ({ persona, responses, clarity }) => {
  const avgConfidence = getAverageConfidence(responses);
  const unsureCount = getUnsureCount(responses);
  const archetype = generateArchetype(persona);
  const summary = generateSummary(persona);
  
  const getConfidenceColor = (val) => {
    if (val >= 70) return colors.green;
    if (val >= 40) return colors.gold;
    return colors.orange;
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: colors.gold, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Primary Persona
          </span>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 4,
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            padding: '3px 8px',
            borderRadius: 4
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={colors.orange}>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <span style={{ fontSize: 9, color: colors.orange, fontWeight: 700, letterSpacing: '0.05em' }}>
              ASSUMPTIONS
            </span>
          </div>
        </div>
        
        {/* Avatar and Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: colors.elevated,
            border: `2px solid ${clarity.overall > 50 ? colors.gold : colors.zinc700}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.white, margin: 0, fontFamily: 'Georgia, serif' }}>
              {archetype}
            </h2>
            <p style={{ fontSize: 12, color: colors.zinc500, margin: '3px 0 0' }}>
              {summary}
            </p>
          </div>
        </div>
      </div>
      
      {/* Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ padding: 14, backgroundColor: colors.surfaceDim, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clarity
            </span>
            <span style={{ 
              fontSize: 22, fontWeight: 700, 
              color: clarity.overall >= 70 ? colors.green : clarity.overall >= 40 ? colors.gold : colors.zinc500,
              fontFamily: 'Georgia, serif'
            }}>
              {clarity.overall}%
            </span>
          </div>
          <ClarityBar value={clarity.overall} size="small" />
        </div>
        
        <div style={{ padding: 14, backgroundColor: colors.surfaceDim, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Confidence
            </span>
            <span style={{ 
              fontSize: 22, fontWeight: 700, 
              color: getConfidenceColor(avgConfidence),
              fontFamily: 'Georgia, serif'
            }}>
              {avgConfidence}%
            </span>
          </div>
          <div style={{ height: 3, backgroundColor: colors.zinc800, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${avgConfidence}%`,
              background: `linear-gradient(90deg, ${colors.orange}, ${colors.gold}, ${colors.green})`,
              backgroundSize: '300% 100%',
              backgroundPosition: `${100 - avgConfidence}% 0`,
              borderRadius: 2
            }} />
          </div>
        </div>
      </div>
      
      {/* Unsure Count Banner */}
      {unsureCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          border: `1px solid ${colors.orange}30`,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: 12, color: colors.orange }}>
            <strong>{unsureCount}</strong> questions marked as uncertain — prioritize these for validation
          </span>
        </div>
      )}
      
      {/* Quote */}
      {persona.quote && (
        <div style={{ 
          padding: 14, 
          backgroundColor: 'rgba(212, 168, 75, 0.08)',
          borderLeft: `3px solid ${colors.gold}`,
          borderRadius: '0 8px 8px 0',
          marginBottom: 20
        }}>
          <p style={{ 
            fontSize: 13, color: colors.zinc300, margin: 0,
            fontStyle: 'italic', fontFamily: 'Georgia, serif', lineHeight: 1.5
          }}>
            "{persona.quote}"
          </p>
        </div>
      )}
      
      {/* Section Scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'identity', label: 'Identity', icon: '👤' },
          { key: 'goals', label: 'Goals', icon: '🎯' },
          { key: 'frustrations', label: 'Frustrations', icon: '😤' },
          { key: 'emotional', label: 'Emotional', icon: '💭' },
          { key: 'behaviors', label: 'Behaviors', icon: '📱' }
        ].map(section => (
          <div key={section.key} style={{
            padding: 10,
            backgroundColor: colors.surface,
            borderRadius: 8,
            border: `1px solid ${colors.zinc800}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 11 }}>{section.icon}</span>
              <span style={{ fontSize: 10, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {section.label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: colors.zinc500, fontWeight: 600 }}>
                {clarity[section.key]}%
              </span>
            </div>
            <ClarityBar value={clarity[section.key]} size="small" />
          </div>
        ))}
      </div>
      
      {/* Jobs to be Done */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 10, color: colors.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Jobs to be Done
        </span>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { key: 'functional', label: 'Functional', value: persona.jobs?.functional },
            { key: 'emotional', label: 'Emotional', value: persona.jobs?.emotional },
            { key: 'social', label: 'Social', value: persona.jobs?.social }
          ].map(job => {
            const displayValue = typeof job.value === 'string' && job.value.length > 30 
              ? job.value 
              : {
                  'in-control': 'Feel in control',
                  'accomplished': 'Feel accomplished',
                  'cared-for': 'Feel supported',
                  'free': 'Feel free',
                  'competent': 'Be seen as competent',
                  'aspirational': 'Be seen as aspirational',
                  'relatable': 'Be seen as relatable',
                  'innovative': 'Be seen as innovative'
                }[job.value] || job.value;
            
            return (
              <div key={job.key} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: 8,
                backgroundColor: colors.surface,
                borderRadius: 6
              }}>
                <span style={{ color: job.value ? colors.green : colors.zinc600, marginTop: 1, fontSize: 11 }}>
                  {job.value ? '✓' : '○'}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 9, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {job.label}
                  </span>
                  <p style={{ fontSize: 12, color: job.value ? colors.zinc300 : colors.zinc600, margin: '2px 0 0' }}>
                    {displayValue || 'Not yet captured'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Validation CTA */}
      <div style={{ 
        marginTop: 'auto',
        padding: 14, 
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        border: `1px solid ${colors.blue}30`,
        borderRadius: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <span style={{ fontSize: 11, color: colors.blue, fontWeight: 600 }}>
            Ready to Validate?
          </span>
        </div>
        <p style={{ fontSize: 11, color: colors.zinc400, margin: 0, lineHeight: 1.5 }}>
          Invite real users to check these assumptions and see where your persona needs adjustment.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// INTERVIEW PANEL COMPONENT
// ============================================================================

const InterviewPanel = ({ 
  currentQuestion, 
  questionIndex, 
  totalQuestions, 
  response,
  onValueChange,
  onResponseUpdate,
  onNext, 
  onPrev, 
  onComplete,
  isValidation = false
}) => {
  const progress = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const hasValue = response?.value !== undefined;
  const canProceed = hasValue || response?.isUnsure;
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.surfaceDim,
      borderLeft: `1px solid ${colors.zinc800}`
    }}>
      {/* Header */}
      <div style={{ 
        padding: '14px 18px', 
        borderBottom: `1px solid ${colors.zinc800}`,
        backgroundColor: colors.surface
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              fontSize: 10, color: colors.gold, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.15em'
            }}>
              {isValidation ? 'Validation' : 'Sharpening'}
            </span>
            <span style={{ 
              fontSize: 9, color: colors.zinc500,
              backgroundColor: colors.elevated,
              padding: '2px 6px',
              borderRadius: 3,
              textTransform: 'capitalize'
            }}>
              {currentQuestion?.category}
            </span>
          </div>
          <span style={{ fontSize: 11, color: colors.zinc500 }}>
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div style={{ height: 3, backgroundColor: colors.zinc800, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: colors.gold,
            borderRadius: 2,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      {/* Question Area */}
      <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
        {currentQuestion && (
          <QuestionMetaWrapper response={response} onResponseUpdate={onResponseUpdate}>
            <QuestionContent 
              question={currentQuestion}
              onAnswer={onValueChange}
              currentValue={response?.value}
              isValidation={isValidation}
            />
          </QuestionMetaWrapper>
        )}
      </div>
      
      {/* Navigation */}
      <div style={{ 
        padding: '12px 18px', 
        borderTop: `1px solid ${colors.zinc800}`,
        backgroundColor: colors.surface,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={onPrev}
          disabled={questionIndex === 0}
          style={{
            padding: '8px 14px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.zinc700}`,
            borderRadius: 6,
            color: questionIndex === 0 ? colors.zinc700 : colors.zinc400,
            fontSize: 12,
            fontWeight: 500,
            cursor: questionIndex === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </button>
        
        {questionIndex < totalQuestions - 1 ? (
          <button
            onClick={onNext}
            style={{
              padding: '8px 18px',
              backgroundColor: canProceed ? colors.gold : colors.zinc700,
              border: 'none',
              borderRadius: 6,
              color: canProceed ? colors.bg : colors.zinc500,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            {canProceed ? 'Continue' : 'Skip'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={onComplete}
            style={{
              padding: '8px 18px',
              backgroundColor: colors.green,
              border: 'none',
              borderRadius: 6,
              color: colors.bg,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            Complete
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPLETION SCREEN
// ============================================================================

const CompletionScreen = ({ clarity, avgConfidence, unsureCount, onContinue, onValidate }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32
    }}>
      <div style={{ textAlign: 'center', maxWidth: 540 }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: 'rgba(74, 222, 128, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        
        <h2 style={{ fontSize: 26, color: colors.white, marginBottom: 8, fontFamily: 'Georgia, serif' }}>
          Persona Sharpened!
        </h2>
        <p style={{ fontSize: 15, color: colors.zinc400, marginBottom: 24, lineHeight: 1.6 }}>
          Your persona is <strong style={{ color: colors.gold }}>{clarity}% complete</strong> with 
          an average confidence of <strong style={{ color: colors.gold }}>{avgConfidence}%</strong>.
          {unsureCount > 0 && (
            <span style={{ color: colors.orange }}> You marked {unsureCount} questions as uncertain.</span>
          )}
        </p>
        
        {/* Important Reminder Box */}
        <div style={{
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          border: `1px solid ${colors.orange}40`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize: 14, color: colors.orange, fontWeight: 600 }}>
              Remember: These Are Assumptions
            </span>
          </div>
          <p style={{ fontSize: 13, color: colors.zinc400, margin: '0 0 12px', lineHeight: 1.6 }}>
            Everything you've captured is based on your <strong>best guesses</strong> about your customer. 
            Until real users validate these assumptions, they remain hypotheses.
          </p>
          <p style={{ fontSize: 13, color: colors.zinc400, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: colors.white }}>Next step:</strong> Invite real users to complete 
            a validation session. Their responses will be compared to yours, showing where your 
            assumptions are accurate and where they need adjustment.
          </p>
        </div>
        
        {/* How Validation Works */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.zinc800}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          textAlign: 'left'
        }}>
          <span style={{ fontSize: 11, color: colors.blue, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            How Validation Works
          </span>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { num: 1, text: 'Share a validation link with real users who match your target persona' },
              { num: 2, text: 'They answer the same questions from their perspective (not guessing)' },
              { num: 3, text: 'System compares their responses to your assumptions' },
              { num: 4, text: 'Review alignment scores and update your persona accordingly' }
            ].map(step => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  backgroundColor: colors.blue,
                  color: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {step.num}
                </div>
                <span style={{ fontSize: 13, color: colors.zinc400, lineHeight: 1.5 }}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={onValidate}
            style={{
              padding: '14px 24px',
              backgroundColor: colors.blue,
              border: 'none',
              borderRadius: 10,
              color: colors.white,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Generate Validation Link
          </button>
          <button
            onClick={onContinue}
            style={{
              padding: '14px 24px',
              backgroundColor: 'transparent',
              border: `1px solid ${colors.zinc700}`,
              borderRadius: 10,
              color: colors.zinc400,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Return to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PersonaSharpenerV2() {
  const [persona, setPersona] = useState(initialPersona);
  const [responses, setResponses] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [mode, setMode] = useState('sharpen'); // 'sharpen' | 'validate' | 'reconcile'
  
  const currentQuestion = questionSequence[questionIndex];
  const currentResponse = responses[currentQuestion?.id] || createEmptyResponse(currentQuestion?.id, currentQuestion?.field);
  const clarity = calculateClarity(responses);
  const avgConfidence = getAverageConfidence(responses);
  const unsureCount = getUnsureCount(responses);
  
  // Update response value (the actual answer)
  const handleValueChange = (value) => {
    const updatedResponse = {
      ...currentResponse,
      questionId: currentQuestion.id,
      field: currentQuestion.field,
      value,
      responseType: mode === 'validate' ? 'validation' : 'assumption',
      respondentRole: mode === 'validate' ? 'real-user' : 'founder'
    };
    
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: updatedResponse
    }));
    
    // Update persona
    updatePersonaFromResponse(updatedResponse);
  };
  
  // Update response metadata (confidence, isUnsure, context)
  const handleResponseUpdate = (updates) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentResponse,
        ...updates
      }
    }));
  };
  
  // Map response to persona fields
  const updatePersonaFromResponse = (response) => {
    setPersona(prev => {
      const updated = JSON.parse(JSON.stringify(prev)); // Deep clone
      const field = response.field;
      const value = response.value;
      
      if (!field || value === undefined) return prev;
      
      // Handle nested fields like "demographics.ageRange"
      const parts = field.split('.');
      let target = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!target[parts[i]]) target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
      
      return updated;
    });
  };
  
  const handleNext = () => {
    if (questionIndex < questionSequence.length - 1) {
      setQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleComplete = () => {
    setIsComplete(true);
  };
  
  // Completion screen
  if (isComplete) {
    return (
      <CompletionScreen 
        clarity={clarity.overall}
        avgConfidence={avgConfidence}
        unsureCount={unsureCount}
        onContinue={() => {
          setIsComplete(false);
          setQuestionIndex(0);
        }}
        onValidate={() => {
          alert('Validation link generation coming soon!\n\nThis would create a shareable URL that real users can visit to complete a validation session. Their responses would be tagged as "validation" type and compared to your "assumption" responses.');
        }}
      />
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.white,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Bar */}
      <div style={{
        height: 50,
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.zinc800}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.zinc400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: colors.zinc800 }} />
          <span style={{ color: colors.gold, fontSize: 13, fontWeight: 600 }}>
            Persona Sharpener
          </span>
          <span style={{ 
            fontSize: 9, color: colors.orange, 
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            padding: '3px 8px',
            borderRadius: 4,
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}>
            ASSUMPTIONS MODE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: colors.zinc500 }}>
            ~{Math.max(1, Math.round((questionSequence.length - questionIndex) * 0.5))} min
          </span>
          <button style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.zinc700}`,
            borderRadius: 5,
            color: colors.zinc400,
            fontSize: 11,
            cursor: 'pointer'
          }}>
            Save & Exit
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Panel - Persona Card (2/3) */}
        <div style={{ width: '66.666%', overflowY: 'auto' }}>
          <PersonaCard persona={persona} responses={responses} clarity={clarity} />
        </div>
        
        {/* Right Panel - Interview (1/3) */}
        <div style={{ width: '33.333%', display: 'flex', flexDirection: 'column' }}>
          <InterviewPanel
            currentQuestion={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={questionSequence.length}
            response={currentResponse}
            onValueChange={handleValueChange}
            onResponseUpdate={handleResponseUpdate}
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
            isValidation={mode === 'validate'}
          />
        </div>
      </div>
    </div>
  );
}
