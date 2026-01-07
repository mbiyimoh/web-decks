import React, { useState, useEffect } from 'react';

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
  white: '#ffffff',
  zinc100: '#f4f4f5',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
  zinc900: '#18181b',
};

// ============================================================================
// QUESTION DATA - Research-backed questions organized by category
// ============================================================================

const questionBank = {
  identity: [
    {
      id: 'age-range',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics',
      question: "Your ideal customer is more likely to be...",
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
      field: 'context',
      question: "Which better describes their lifestyle?",
      options: [
        { value: 'busy-professional', label: 'Busy Professional', sublabel: 'Career-focused, optimizes for efficiency' },
        { value: 'balanced-seeker', label: 'Balance Seeker', sublabel: 'Prioritizes work-life harmony' }
      ]
    },
    {
      id: 'tech-savvy',
      type: 'slider',
      category: 'identity',
      field: 'behaviors',
      question: "How tech-savvy is your typical customer?",
      min: 'Prefers simplicity',
      max: 'Power user',
      defaultValue: 50
    },
    {
      id: 'decision-style',
      type: 'this-or-that',
      category: 'identity',
      field: 'behaviors',
      question: "When trying something new, they typically...",
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
      field: 'goals',
      question: "Rank what matters most to your customer:",
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
      field: 'goals',
      question: "Complete this from your customer's perspective:",
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
      placeholder: "e.g., 'Fit a workout into their lunch break' or 'Find the right gift in under 5 minutes'",
      helperText: "Focus on the functional job — what they literally need to get done"
    }
  ],
  
  frustrations: [
    {
      id: 'past-failures',
      type: 'scenario',
      category: 'frustrations',
      field: 'frustrations',
      question: "What have they tried before that didn't work? Why did it fail them?",
      placeholder: "e.g., 'They tried fitness apps but hated logging every meal...'",
      helperText: "Understanding past failures reveals what NOT to do"
    },
    {
      id: 'dealbreakers',
      type: 'multi-select',
      category: 'frustrations',
      field: 'frustrations',
      question: "Which of these would make them abandon a product like yours?",
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
      field: 'frustrations',
      question: "How do they currently solve this problem (without your product)?",
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
      placeholder: "Speak naturally — we're capturing their authentic language",
      helperText: "This quote will appear on the persona card",
      fallbackType: 'text'
    },
    {
      id: 'recommendation-trigger',
      type: 'scenario',
      category: 'emotional',
      field: 'jobs.emotional',
      question: "What would make them tell a friend about your product?",
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
      field: 'behaviors',
      question: "Who influences their decisions in this area?",
      options: [
        { id: 'friends', label: 'Friends & family' },
        { id: 'colleagues', label: 'Colleagues & peers' },
        { id: 'influencers', label: 'Social media influencers' },
        { id: 'experts', label: 'Industry experts' },
        { id: 'reviews', label: 'Online reviews' },
        { id: 'nobody', label: 'They research independently' }
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
      field: 'behaviors',
      question: "Where are they most likely to discover products like yours?",
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
      field: 'behaviors',
      question: "When would they most likely use your product?",
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
      field: 'context',
      question: "How much time can they realistically dedicate to this?",
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

// Flatten questions into sequence for the flow
const questionSequence = [
  ...questionBank.identity.slice(0, 2),      // Start with identity
  ...questionBank.goals.slice(0, 2),          // Then goals
  ...questionBank.frustrations.slice(0, 2),   // Then frustrations
  ...questionBank.emotional.slice(0, 2),      // Then emotional
  ...questionBank.behaviors.slice(0, 2),      // Then behaviors
  // Additional questions cycle through for deeper exploration
  ...questionBank.identity.slice(2),
  ...questionBank.goals.slice(2),
  ...questionBank.frustrations.slice(2),
  ...questionBank.social,
  ...questionBank.behaviors.slice(2),
  ...questionBank.antiPatterns
];

// ============================================================================
// INITIAL PERSONA STATE
// ============================================================================

const initialPersona = {
  name: '',
  archetype: '',
  summary: '',
  quote: '',
  demographics: {
    ageRange: '',
    lifestyle: ''
  },
  context: [],
  jobs: {
    functional: '',
    emotional: '',
    social: ''
  },
  goals: [],
  frustrations: [],
  behaviors: [],
  antiPatterns: [],
  clarity: {
    overall: 0,
    identity: 0,
    goals: 0,
    frustrations: 0,
    emotional: 0,
    behaviors: 0
  }
};

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
  
  const key = `${emotionalJob}-${lifestyle}`;
  return archetypes[key] || 'Your Ideal Customer';
};

const generateSummary = (persona) => {
  const parts = [];
  
  if (persona.demographics?.ageRange) {
    const ageDesc = {
      'younger': 'Young professional',
      'middle': 'Mid-career professional', 
      'older': 'Experienced professional'
    };
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
      'accomplished': 'who craves a sense of accomplishment',
      'cared-for': 'who needs to feel supported',
      'free': 'who yearns for freedom from stress'
    };
    parts.push(emotionalDesc[persona.jobs.emotional] || '');
  }
  
  if (parts.length > 0) {
    return parts.join(' ') + '.';
  }
  return 'Tell us about your ideal customer to build their profile.';
};

const calculateClarity = (persona) => {
  const scores = {
    identity: 0,
    goals: 0,
    frustrations: 0,
    emotional: 0,
    behaviors: 0
  };
  
  // Identity clarity
  if (persona.demographics?.ageRange) scores.identity += 25;
  if (persona.demographics?.lifestyle) scores.identity += 25;
  if (persona.context?.length > 0) scores.identity += 25;
  if (persona.behaviors?.length > 0) scores.identity += 25;
  
  // Goals clarity
  if (persona.goals?.length > 0) scores.goals += 40;
  if (persona.goals?.length >= 3) scores.goals += 20;
  if (persona.jobs?.functional) scores.goals += 40;
  
  // Frustrations clarity
  if (persona.frustrations?.length > 0) scores.frustrations += 50;
  if (persona.frustrations?.length >= 3) scores.frustrations += 50;
  
  // Emotional clarity
  if (persona.jobs?.emotional) scores.emotional += 40;
  if (persona.jobs?.social) scores.emotional += 30;
  if (persona.quote) scores.emotional += 30;
  
  // Behaviors clarity
  const behaviorCount = persona.behaviors?.length || 0;
  scores.behaviors = Math.min(100, behaviorCount * 20);
  
  // Overall
  const overall = Math.round(
    (scores.identity + scores.goals + scores.frustrations + scores.emotional + scores.behaviors) / 5
  );
  
  return { ...scores, overall };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Clarity Bar Component
const ClarityBar = ({ value, label, size = 'normal' }) => {
  const getColor = (val) => {
    if (val >= 70) return colors.green;
    if (val >= 40) return colors.gold;
    return colors.zinc600;
  };
  
  return (
    <div style={{ marginBottom: size === 'small' ? 8 : 12 }}>
      {label && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 4,
          fontSize: size === 'small' ? 11 : 12
        }}>
          <span style={{ color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
          <span style={{ color: getColor(value), fontWeight: 600 }}>{value}%</span>
        </div>
      )}
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
          transition: 'width 0.5s ease-out, background-color 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// This-or-That Question Component
const ThisOrThatQuestion = ({ question, onAnswer, currentValue }) => {
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 20,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {question.options.map((option, idx) => (
          <button
            key={option.value}
            onClick={() => onAnswer(question.id, option.value, question)}
            style={{
              padding: '16px 20px',
              backgroundColor: currentValue === option.value ? 'rgba(212, 168, 75, 0.15)' : colors.surface,
              border: `1px solid ${currentValue === option.value ? colors.gold : colors.zinc800}`,
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: currentValue === option.value ? colors.gold : colors.white,
              marginBottom: 4
            }}>
              {option.label}
            </div>
            {option.sublabel && (
              <div style={{ fontSize: 13, color: colors.zinc500 }}>
                {option.sublabel}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Slider Question Component
const SliderQuestion = ({ question, onAnswer, currentValue }) => {
  const [value, setValue] = useState(currentValue || question.defaultValue);
  
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 24,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      <div style={{ padding: '0 8px' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => {
            const newValue = parseInt(e.target.value);
            setValue(newValue);
            onAnswer(question.id, newValue, question);
          }}
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(to right, ${colors.gold} 0%, ${colors.gold} ${value}%, ${colors.zinc700} ${value}%, ${colors.zinc700} 100%)`,
            appearance: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 12,
          fontSize: 12,
          color: colors.zinc500
        }}>
          <span>{question.min}</span>
          <span>{question.max}</span>
        </div>
      </div>
    </div>
  );
};

// Ranking Question Component
const RankingQuestion = ({ question, onAnswer, currentValue }) => {
  const [items, setItems] = useState(
    currentValue || question.items.map((item, idx) => ({ ...item, rank: idx + 1 }))
  );
  const [draggedItem, setDraggedItem] = useState(null);
  
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };
  
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
    onAnswer(question.id, items, question);
  };
  
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 8,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      <p style={{ fontSize: 13, color: colors.zinc500, marginBottom: 20 }}>
        Drag to reorder — most important at top
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              gap: 12,
              padding: '12px 16px',
              backgroundColor: draggedItem?.id === item.id ? 'rgba(212, 168, 75, 0.1)' : colors.surface,
              border: `1px solid ${idx === 0 ? colors.gold : colors.zinc800}`,
              borderRadius: 10,
              cursor: 'grab',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: idx === 0 ? colors.gold : colors.zinc700,
              color: idx === 0 ? colors.bg : colors.zinc400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700
            }}>
              {idx + 1}
            </div>
            <span style={{ 
              color: idx === 0 ? colors.gold : colors.white, 
              fontWeight: idx === 0 ? 600 : 400,
              fontSize: 14
            }}>
              {item.label}
            </span>
            <div style={{ marginLeft: 'auto', color: colors.zinc600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Multi-Select Question Component
const MultiSelectQuestion = ({ question, onAnswer, currentValue }) => {
  const [selected, setSelected] = useState(currentValue || []);
  
  const toggleOption = (optionId) => {
    let newSelected;
    if (selected.includes(optionId)) {
      newSelected = selected.filter(id => id !== optionId);
    } else if (selected.length < question.maxSelections) {
      newSelected = [...selected, optionId];
    } else {
      return; // Max reached
    }
    setSelected(newSelected);
    onAnswer(question.id, newSelected, question);
  };
  
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 8,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      <p style={{ fontSize: 13, color: colors.zinc500, marginBottom: 20 }}>
        {question.instruction}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {question.options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              style={{
                padding: '10px 16px',
                backgroundColor: isSelected ? 'rgba(212, 168, 75, 0.15)' : colors.surface,
                border: `1px solid ${isSelected ? colors.gold : colors.zinc800}`,
                borderRadius: 20,
                cursor: selected.length >= question.maxSelections && !isSelected ? 'not-allowed' : 'pointer',
                opacity: selected.length >= question.maxSelections && !isSelected ? 0.5 : 1,
                transition: 'all 0.2s ease',
                fontSize: 13,
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

// Fill-in-the-Blank Question Component
const FillBlankQuestion = ({ question, onAnswer, currentValue }) => {
  const [values, setValues] = useState(currentValue || {});
  
  const updateValue = (blankId, value) => {
    const newValues = { ...values, [blankId]: value };
    setValues(newValues);
    onAnswer(question.id, newValues, question);
  };
  
  // Parse template and create fill-in UI
  const parts = question.template.split(/\{(\w+)\}/g);
  
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 20,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      <div style={{ 
        padding: 20, 
        backgroundColor: colors.surface, 
        borderRadius: 12,
        border: `1px solid ${colors.zinc800}`,
        fontSize: 15,
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
                    fontSize: 15,
                    fontWeight: 500,
                    padding: '4px 8px',
                    minWidth: 180,
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                {blank.suggestions && (
                  <div style={{ 
                    display: 'flex', 
                    gap: 6, 
                    marginTop: 4,
                    marginBottom: 8
                  }}>
                    {blank.suggestions.map(sug => (
                      <button
                        key={sug}
                        onClick={() => updateValue(blank.id, sug)}
                        style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          backgroundColor: colors.elevated,
                          border: 'none',
                          borderRadius: 4,
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

// Scenario Question Component
const ScenarioQuestion = ({ question, onAnswer, currentValue }) => {
  const [value, setValue] = useState(currentValue || '');
  
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 8,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      {question.helperText && (
        <p style={{ fontSize: 13, color: colors.zinc500, marginBottom: 16 }}>
          {question.helperText}
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onAnswer(question.id, e.target.value, question);
        }}
        placeholder={question.placeholder}
        style={{
          width: '100%',
          minHeight: 120,
          padding: 16,
          backgroundColor: colors.surface,
          border: `1px solid ${value ? colors.gold + '50' : colors.zinc800}`,
          borderRadius: 12,
          color: colors.white,
          fontSize: 14,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s ease'
        }}
      />
    </div>
  );
};

// Voice Capture Question Component (with text fallback)
const VoiceCaptureQuestion = ({ question, onAnswer, currentValue }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [useText, setUseText] = useState(true); // Default to text for prototype
  const [value, setValue] = useState(currentValue || '');
  
  return (
    <div>
      <p style={{ 
        fontSize: 18, 
        fontWeight: 500, 
        color: colors.white, 
        marginBottom: 8,
        lineHeight: 1.4
      }}>
        {question.question}
      </p>
      {question.helperText && (
        <p style={{ fontSize: 13, color: colors.zinc500, marginBottom: 16 }}>
          {question.helperText}
        </p>
      )}
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setUseText(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: !useText ? colors.gold : 'transparent',
            border: `1px solid ${!useText ? colors.gold : colors.zinc700}`,
            borderRadius: 8,
            color: !useText ? colors.bg : colors.zinc500,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
          </svg>
          Voice
        </button>
        <button
          onClick={() => setUseText(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: useText ? colors.gold : 'transparent',
            border: `1px solid ${useText ? colors.gold : colors.zinc700}`,
            borderRadius: 8,
            color: useText ? colors.bg : colors.zinc500,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          Type
        </button>
      </div>
      
      {useText ? (
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onAnswer(question.id, e.target.value, question);
          }}
          placeholder={`"${question.placeholder}"`}
          style={{
            width: '100%',
            minHeight: 100,
            padding: 16,
            backgroundColor: colors.surface,
            border: `1px solid ${value ? colors.gold + '50' : colors.zinc800}`,
            borderRadius: 12,
            color: colors.white,
            fontSize: 15,
            fontStyle: 'italic',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'Georgia, serif',
            transition: 'border-color 0.2s ease'
          }}
        />
      ) : (
        <button
          onClick={() => setIsRecording(!isRecording)}
          style={{
            width: '100%',
            padding: 32,
            backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : colors.surface,
            border: `2px dashed ${isRecording ? '#ef4444' : colors.zinc700}`,
            borderRadius: 12,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: isRecording ? '#ef4444' : colors.gold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={colors.bg} stroke="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            </svg>
          </div>
          <span style={{ color: isRecording ? '#ef4444' : colors.zinc400, fontSize: 14 }}>
            {isRecording ? 'Recording... tap to stop' : 'Tap to record'}
          </span>
        </button>
      )}
    </div>
  );
};

// Question Router Component
const QuestionRenderer = ({ question, onAnswer, answers }) => {
  const currentValue = answers[question.id];
  
  switch (question.type) {
    case 'this-or-that':
      return <ThisOrThatQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    case 'slider':
      return <SliderQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    case 'ranking':
      return <RankingQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    case 'multi-select':
      return <MultiSelectQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    case 'fill-blank':
      return <FillBlankQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    case 'scenario':
      return <ScenarioQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    case 'voice':
      return <VoiceCaptureQuestion question={question} onAnswer={onAnswer} currentValue={currentValue} />;
    default:
      return null;
  }
};

// ============================================================================
// PERSONA CARD COMPONENT (Left Panel Artifact)
// ============================================================================

const PersonaCard = ({ persona }) => {
  const archetype = generateArchetype(persona);
  const summary = generateSummary(persona);
  const clarity = calculateClarity(persona);
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 32
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 16 
        }}>
          <span style={{ 
            color: colors.gold, 
            fontSize: 12, 
            fontWeight: 600, 
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
          }}>
            PRIMARY PERSONA
          </span>
          <div style={{ 
            height: 1, 
            flex: 1, 
            backgroundColor: colors.zinc800 
          }} />
        </div>
        
        {/* Avatar and Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: colors.elevated,
            border: `2px solid ${clarity.overall > 50 ? colors.gold : colors.zinc700}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            👤
          </div>
          <div>
            <h2 style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              color: colors.white,
              margin: 0,
              fontFamily: 'Georgia, serif'
            }}>
              {persona.name || 'Your Customer'}
            </h2>
            <p style={{ 
              fontSize: 14, 
              color: colors.gold, 
              margin: '4px 0 0',
              fontStyle: 'italic'
            }}>
              {archetype}
            </p>
          </div>
        </div>
      </div>
      
      {/* Overall Clarity */}
      <div style={{ 
        padding: 16, 
        backgroundColor: colors.surfaceDim, 
        borderRadius: 12,
        marginBottom: 24
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 8
        }}>
          <span style={{ 
            fontSize: 13, 
            color: colors.zinc500,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Persona Clarity
          </span>
          <span style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: clarity.overall >= 70 ? colors.green : clarity.overall >= 40 ? colors.gold : colors.zinc500,
            fontFamily: 'Georgia, serif'
          }}>
            {clarity.overall}%
          </span>
        </div>
        <div style={{ 
          height: 6, 
          backgroundColor: colors.zinc800, 
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${clarity.overall}%`,
            background: clarity.overall >= 70 
              ? `linear-gradient(90deg, ${colors.green}, ${colors.gold})`
              : clarity.overall >= 40 
                ? colors.gold 
                : colors.zinc600,
            borderRadius: 3,
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>
      
      {/* Summary */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ 
          fontSize: 15, 
          color: colors.zinc400, 
          lineHeight: 1.6,
          margin: 0
        }}>
          {summary}
        </p>
      </div>
      
      {/* Quote */}
      {persona.quote && (
        <div style={{ 
          padding: 16, 
          backgroundColor: 'rgba(212, 168, 75, 0.08)',
          borderLeft: `3px solid ${colors.gold}`,
          borderRadius: '0 8px 8px 0',
          marginBottom: 24
        }}>
          <p style={{ 
            fontSize: 14, 
            color: colors.zinc300, 
            margin: 0,
            fontStyle: 'italic',
            fontFamily: 'Georgia, serif',
            lineHeight: 1.6
          }}>
            "{persona.quote}"
          </p>
        </div>
      )}
      
      {/* Section Scores Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 12,
        marginBottom: 24
      }}>
        {[
          { key: 'identity', label: 'Identity', icon: '👤' },
          { key: 'goals', label: 'Goals', icon: '🎯' },
          { key: 'frustrations', label: 'Frustrations', icon: '😤' },
          { key: 'emotional', label: 'Emotional', icon: '💭' },
          { key: 'behaviors', label: 'Behaviors', icon: '📱' }
        ].map(section => (
          <div key={section.key} style={{
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: 10,
            border: `1px solid ${clarity[section.key] >= 50 ? colors.zinc700 : colors.zinc800}`
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 8 
            }}>
              <span style={{ fontSize: 14 }}>{section.icon}</span>
              <span style={{ 
                fontSize: 12, 
                color: colors.zinc500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {section.label}
              </span>
            </div>
            <ClarityBar value={clarity[section.key]} size="small" />
          </div>
        ))}
      </div>
      
      {/* Jobs to be Done */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 12 
        }}>
          <span style={{ 
            fontSize: 12, 
            color: colors.gold,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Jobs to be Done
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'functional', label: 'Functional', value: persona.jobs?.functional },
            { key: 'emotional', label: 'Emotional', value: persona.jobs?.emotional },
            { key: 'social', label: 'Social', value: persona.jobs?.social }
          ].map(job => (
            <div key={job.key} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 10,
              backgroundColor: colors.surface,
              borderRadius: 8
            }}>
              <span style={{ 
                color: job.value ? colors.green : colors.zinc600,
                marginTop: 2
              }}>
                {job.value ? '✓' : '○'}
              </span>
              <div>
                <span style={{ 
                  fontSize: 11, 
                  color: colors.zinc500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {job.label}
                </span>
                <p style={{ 
                  fontSize: 13, 
                  color: job.value ? colors.zinc300 : colors.zinc600,
                  margin: '4px 0 0',
                  fontStyle: job.value ? 'normal' : 'italic'
                }}>
                  {job.value 
                    ? (typeof job.value === 'string' && job.value.length > 50 
                        ? job.value 
                        : {
                            'in-control': 'Feel in control and organized',
                            'accomplished': 'Feel accomplished and successful',
                            'cared-for': 'Feel supported and cared for',
                            'free': 'Feel free from stress and burden',
                            'competent': 'Be seen as competent and capable',
                            'aspirational': 'Be seen as aspirational',
                            'relatable': 'Be seen as relatable and authentic',
                            'innovative': 'Be seen as innovative and ahead'
                          }[job.value] || job.value)
                    : 'Not yet captured'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Goals & Frustrations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Goals */}
        <div>
          <span style={{ 
            fontSize: 12, 
            color: colors.green,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Goals
          </span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {persona.goals?.length > 0 ? (
              persona.goals.slice(0, 3).map((goal, idx) => (
                <div key={idx} style={{
                  fontSize: 12,
                  color: colors.zinc400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ color: colors.green }}>•</span>
                  {typeof goal === 'string' ? goal : goal.label}
                </div>
              ))
            ) : (
              <span style={{ fontSize: 12, color: colors.zinc600, fontStyle: 'italic' }}>
                Not yet captured
              </span>
            )}
          </div>
        </div>
        
        {/* Frustrations */}
        <div>
          <span style={{ 
            fontSize: 12, 
            color: '#ef4444',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Frustrations
          </span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {persona.frustrations?.length > 0 ? (
              persona.frustrations.slice(0, 3).map((f, idx) => (
                <div key={idx} style={{
                  fontSize: 12,
                  color: colors.zinc400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ color: '#ef4444' }}>•</span>
                  {typeof f === 'string' ? f : f}
                </div>
              ))
            ) : (
              <span style={{ fontSize: 12, color: colors.zinc600, fontStyle: 'italic' }}>
                Not yet captured
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INTERVIEW PANEL COMPONENT (Right Panel)
// ============================================================================

const InterviewPanel = ({ currentQuestion, questionIndex, totalQuestions, onAnswer, answers, onNext, onPrev, onComplete }) => {
  const progress = Math.round((Object.keys(answers).length / totalQuestions) * 100);
  const hasAnswer = answers[currentQuestion?.id] !== undefined;
  
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
        padding: '20px 24px', 
        borderBottom: `1px solid ${colors.zinc800}`,
        backgroundColor: colors.surface
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 12
        }}>
          <span style={{ 
            fontSize: 11, 
            color: colors.gold,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.15em'
          }}>
            Sharpening Questions
          </span>
          <span style={{ fontSize: 12, color: colors.zinc500 }}>
            {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <ClarityBar value={progress} size="small" />
      </div>
      
      {/* Question Area */}
      <div style={{ 
        flex: 1, 
        padding: 24, 
        overflowY: 'auto'
      }}>
        {currentQuestion && (
          <QuestionRenderer 
            question={currentQuestion} 
            onAnswer={onAnswer}
            answers={answers}
          />
        )}
      </div>
      
      {/* Navigation */}
      <div style={{ 
        padding: '16px 24px', 
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
            padding: '10px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.zinc700}`,
            borderRadius: 8,
            color: questionIndex === 0 ? colors.zinc700 : colors.zinc400,
            fontSize: 13,
            fontWeight: 500,
            cursor: questionIndex === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Back
        </button>
        
        {questionIndex < totalQuestions - 1 ? (
          <button
            onClick={onNext}
            style={{
              padding: '10px 20px',
              backgroundColor: hasAnswer ? colors.gold : colors.zinc700,
              border: 'none',
              borderRadius: 8,
              color: hasAnswer ? colors.bg : colors.zinc500,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            {hasAnswer ? 'Continue' : 'Skip'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={onComplete}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.green,
              border: 'none',
              borderRadius: 8,
              color: colors.bg,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Complete
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PersonaSharpener() {
  const [persona, setPersona] = useState(initialPersona);
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const currentQuestion = questionSequence[questionIndex];
  
  // Handle answer and update persona
  const handleAnswer = (questionId, value, question) => {
    // Update answers
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Update persona based on question field
    setPersona(prev => {
      const updated = { ...prev };
      
      // Map answers to persona fields
      if (question.field === 'demographics') {
        updated.demographics = { ...updated.demographics };
        if (questionId === 'age-range') updated.demographics.ageRange = value;
        if (questionId === 'lifestyle') updated.demographics.lifestyle = value;
      }
      
      if (question.field === 'context') {
        if (!Array.isArray(updated.context)) updated.context = [];
        // Add context info
      }
      
      if (question.field === 'goals') {
        if (Array.isArray(value)) {
          updated.goals = value.slice(0, 3);
        }
      }
      
      if (question.field === 'frustrations') {
        if (Array.isArray(value)) {
          updated.frustrations = value;
        }
      }
      
      if (question.field === 'behaviors') {
        if (!Array.isArray(updated.behaviors)) updated.behaviors = [];
        if (Array.isArray(value)) {
          updated.behaviors = [...updated.behaviors, ...value.filter(v => !updated.behaviors.includes(v))];
        } else {
          updated.behaviors = [...updated.behaviors, value];
        }
      }
      
      if (question.field?.startsWith('jobs.')) {
        const jobType = question.field.split('.')[1];
        updated.jobs = { ...updated.jobs, [jobType]: value };
      }
      
      if (question.field === 'quote') {
        updated.quote = value;
      }
      
      // Recalculate clarity
      updated.clarity = calculateClarity(updated);
      
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
  
  if (isComplete) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32
      }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(74, 222, 128, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 style={{ 
            fontSize: 28, 
            color: colors.white, 
            marginBottom: 12,
            fontFamily: 'Georgia, serif'
          }}>
            Persona Sharpened!
          </h2>
          <p style={{ fontSize: 16, color: colors.zinc400, marginBottom: 32, lineHeight: 1.6 }}>
            Your persona is now {calculateClarity(persona).overall}% complete. 
            You can continue to refine it or explore other areas of your profile.
          </p>
          <button
            onClick={() => {
              setIsComplete(false);
              setQuestionIndex(0);
            }}
            style={{
              padding: '14px 28px',
              backgroundColor: colors.gold,
              border: 'none',
              borderRadius: 10,
              color: colors.bg,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.white,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex'
    }}>
      {/* Header Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.zinc800}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.zinc400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back to Profile
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: colors.zinc800 }} />
          <span style={{ color: colors.gold, fontSize: 14, fontWeight: 600 }}>
            Persona Sharpener
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: colors.zinc500 }}>
            ~10 min remaining
          </span>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.zinc700}`,
            borderRadius: 6,
            color: colors.zinc400,
            fontSize: 12,
            cursor: 'pointer'
          }}>
            Save & Exit
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{
        display: 'flex',
        width: '100%',
        marginTop: 56,
        height: 'calc(100vh - 56px)'
      }}>
        {/* Left Panel - Persona Card (2/3) */}
        <div style={{ 
          width: '66.666%', 
          backgroundColor: colors.bg,
          overflowY: 'auto'
        }}>
          <PersonaCard persona={persona} />
        </div>
        
        {/* Right Panel - Interview (1/3) */}
        <div style={{ width: '33.333%' }}>
          <InterviewPanel
            currentQuestion={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={questionSequence.length}
            onAnswer={handleAnswer}
            answers={answers}
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
