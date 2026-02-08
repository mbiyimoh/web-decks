import React, { useState } from 'react';

// ============================================
// PLYA PERSONA CARDS & STORYBOARDS
// Two personas: Jordan (Aspiring Athlete) & Alex (Busy Professional)
// ============================================

const colors = {
  bgPrimary: '#09090B',
  bgSecondary: '#131316',
  bgTertiary: '#1C1C21',
  bgCard: '#18181B',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accentGold: '#C9A227',
  accentGoldSoft: 'rgba(201, 162, 39, 0.15)',
  accentGreen: '#22C55E',
  accentRed: '#EF4444',
  accentBlue: '#3B82F6',
  accentPurple: '#A855F7',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.1)',
};

// ============================================
// PERSONA DATA
// ============================================

const personas = {
  athlete: {
    id: 'athlete',
    name: 'Jordan',
    title: 'The Aspiring Athlete',
    quote: "I know what I want — I just need a system that actually works with my life.",
    avatarEmoji: '💪',
    avatarGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    quickFacts: [
      { icon: '⏱', label: 'Time', value: '~1 hour, evenings' },
      { icon: '📱', label: 'Discovery', value: 'Social media, peers' },
      { icon: '📈', label: 'Results', value: '1-3 months' },
      { icon: '🤝', label: 'Trusts', value: 'Self + close peers' },
    ],
    jobsToBeDone: [
      'Find workouts that match my level & goals',
      'Build a routine without daily planning',
      'Track progress and see measurable gains',
      'Stay accountable without expensive trainer',
    ],
    painPoints: [
      'Cognitive load of picking/comparing workouts daily',
      'Apps feel repetitive and don\'t adapt to progress',
      'Personal training effective but unaffordable',
      'No long-term system that evolves with them',
    ],
    emotionalNeeds: ['Accomplished', 'In control', 'Cared for', 'Perceived as competent'],
    sensitivities: ['Complexity', 'Cost', 'Generic/basic solutions', 'One-size-fits-all'],
    differentiators: [
      { icon: '🏆', text: 'Identity matters — wants to be seen as competent in fitness space' },
      { icon: '🎯', text: 'Higher bar for credibility — generic solutions rejected' },
      { icon: '📊', text: 'Actively compares what pros/experts do' },
      { icon: '🔥', text: 'Willing to work hard — blocked by planning friction, not motivation' },
    ],
    opportunity: 'Decisive, adaptive system that removes planning friction while feeling credible enough for serious training.',
    asIs: [
      {
        title: 'Discovery Overload',
        scene: '📱',
        description: 'Scrolling Instagram at night, 15 tabs of workout videos saved.',
        thought: '"Which one should I do tomorrow?"',
        emotion: 'Overwhelmed',
        emotionColor: colors.accentRed,
      },
      {
        title: 'The Assembly Problem',
        scene: '📝',
        description: 'Trying to piece together a routine from saved videos. Notes app chaos.',
        thought: '"Do these even work together?"',
        emotion: 'Uncertain',
        emotionColor: '#F59E0B',
      },
      {
        title: 'The Skip',
        scene: '😔',
        description: 'Evening after work, tired. Looks at messy plan, doesn\'t know where to start.',
        thought: '"I\'ll just do it tomorrow."',
        emotion: 'Defeated',
        emotionColor: colors.accentRed,
      },
      {
        title: 'The App Graveyard',
        scene: '📲',
        description: 'Phone showing 5 downloaded fitness apps. All generic, same workouts.',
        thought: '"None of these are for ME."',
        emotion: 'Disappointed',
        emotionColor: '#F59E0B',
      },
      {
        title: 'The Expensive Option',
        scene: '💸',
        description: 'Looking at personal trainer pricing. $100+ per session.',
        thought: '"I can\'t afford this."',
        emotion: 'Stuck',
        emotionColor: colors.accentRed,
      },
      {
        title: 'The Plateau',
        scene: '📉',
        description: '2 months later, no visible progress despite effort.',
        thought: '"Why isn\'t anything changing?"',
        emotion: 'Discouraged',
        emotionColor: colors.accentRed,
      },
    ],
    toBe: [
      {
        title: 'Effortless Capture',
        scene: '✨',
        description: 'Sees great workout on IG → shares to PLYA.',
        thought: '"Got it, I\'ll work this into your plan."',
        emotion: 'Easy',
        emotionColor: colors.accentGreen,
      },
      {
        title: 'Morning Clarity',
        scene: '☀️',
        description: 'Wakes up, opens PLYA. Today\'s plan is already there.',
        thought: 'No decisions needed.',
        emotion: 'Clear',
        emotionColor: colors.accentGreen,
      },
      {
        title: 'Adaptive Intelligence',
        scene: '🤖',
        description: '"My legs are sore" → PLYA swaps to upper body.',
        thought: '"Moved leg work to Thursday."',
        emotion: 'Cared for',
        emotionColor: colors.accentBlue,
      },
      {
        title: 'Progress Visible',
        scene: '📈',
        description: '6 weeks in: tracking shows real gains.',
        thought: '"18 sessions. Explosiveness up 15%."',
        emotion: 'Validated',
        emotionColor: colors.accentGreen,
      },
      {
        title: 'Credibility Match',
        scene: '🤝',
        description: 'Shows plan to friend who trains seriously.',
        thought: '"This is legit."',
        emotion: 'Pride',
        emotionColor: colors.accentGold,
      },
      {
        title: 'The System Evolves',
        scene: '🚀',
        description: '3 months in, PLYA suggests progression.',
        thought: '"Ready to level up? Here\'s your new phase."',
        emotion: 'Growth',
        emotionColor: colors.accentPurple,
      },
    ],
  },
  professional: {
    id: 'professional',
    name: 'Alex',
    title: 'The Busy Professional',
    quote: "I don't need motivation — I need something that fits my actual life.",
    avatarEmoji: '💼',
    avatarGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    quickFacts: [
      { icon: '⏱', label: 'Time', value: '~1 hour, AM or PM' },
      { icon: '🎯', label: 'Goal', value: 'Consistency > peak' },
      { icon: '⚖️', label: 'Priority', value: 'Balance, not extremes' },
      { icon: '📱', label: 'Attitude', value: 'Tech-savvy, open' },
    ],
    jobsToBeDone: [
      'Stay consistent without managing a complex system',
      'Feel tangible results over time',
      'Reduce stress, not add to it',
      'Execute structured plans without improvising',
    ],
    painPoints: [
      'Lack of all-in-one system that respects real schedules',
      'Apps are too complex, slow, needy, or generic',
      'Decision fatigue kills motivation before workout starts',
      'Fitness becomes "another thing I\'m failing at"',
    ],
    emotionalNeeds: ['Accomplished', 'In control', 'Calm', 'Efficient'],
    sensitivities: ['Time waste', 'Complexity', 'Needy apps', 'Guilt-tripping'],
    differentiators: [
      { icon: '⏰', text: 'Time is THE constraint — everything must respect it' },
      { icon: '🔕', text: 'Non-intrusiveness matters — hates needy apps' },
      { icon: '📋', text: 'Wants to follow, not create — prefers structure delivered' },
      { icon: '🧘', text: 'Success = consistency, not optimization' },
    ],
    opportunity: 'Calm, decisive system that removes friction, respects time, and delivers structure without requiring management.',
    asIs: [
      {
        title: 'The Intention',
        scene: '🌙',
        description: 'Night before: sets 6am alarm, opens app to plan.',
        thought: '"I\'ll figure it out in the morning."',
        emotion: 'Procrastination',
        emotionColor: '#F59E0B',
      },
      {
        title: 'The Morning Chaos',
        scene: '⏰',
        description: '6am, exhausted, opens app, paralyzed by choices.',
        thought: 'Meeting reminder pops up. Skips gym.',
        emotion: 'Frustrated',
        emotionColor: colors.accentRed,
      },
      {
        title: 'The Overcomplication',
        scene: '😤',
        description: 'New app: 10 screens of onboarding questions.',
        thought: '"I don\'t have time for this." Deleted.',
        emotion: 'Annoyed',
        emotionColor: colors.accentRed,
      },
      {
        title: 'The Generic Workout',
        scene: '🔄',
        description: 'Following generic app. Same thing every week.',
        thought: '"Is this even doing anything?"',
        emotion: 'Doubtful',
        emotionColor: '#F59E0B',
      },
      {
        title: 'The Guilt Spiral',
        scene: '😞',
        description: 'End of week, only worked out once.',
        thought: '"Another thing I\'m failing at."',
        emotion: 'Defeated',
        emotionColor: colors.accentRed,
      },
      {
        title: 'The Search Continues',
        scene: '🔍',
        description: 'Googling "best fitness apps" again.',
        thought: 'Downloads another. Cycle repeats.',
        emotion: 'Exhausted',
        emotionColor: colors.accentRed,
      },
    ],
    toBe: [
      {
        title: 'One Conversation',
        scene: '💬',
        description: 'Chat onboarding: "Crazy schedule, 30-45 min."',
        thought: '"Got it. I\'ll respect that."',
        emotion: 'Understood',
        emotionColor: colors.accentGreen,
      },
      {
        title: 'The Calm Morning',
        scene: '☀️',
        description: '6am, opens PLYA. One clear plan waiting.',
        thought: '"35 min. Here\'s what we\'re doing."',
        emotion: 'Relief',
        emotionColor: colors.accentGreen,
      },
      {
        title: 'Schedule Respect',
        scene: '📅',
        description: '"Early meeting tomorrow" → PLYA adjusts.',
        thought: '"Moved to evening. Express version ready."',
        emotion: 'Flexible',
        emotionColor: colors.accentBlue,
      },
      {
        title: 'Non-Intrusive Check-in',
        scene: '✅',
        description: 'End of week summary. Not needy.',
        thought: '"4 of 5 sessions completed. Nice consistency."',
        emotion: 'Acknowledged',
        emotionColor: colors.accentGreen,
      },
      {
        title: 'Tangible Results',
        scene: '💪',
        description: '2 months in: real progress without obsessing.',
        thought: '"28 sessions in 8 weeks. This is working."',
        emotion: 'In control',
        emotionColor: colors.accentGold,
      },
      {
        title: 'The New Normal',
        scene: '🗣️',
        description: 'Tells coworker about the change.',
        thought: '"I don\'t plan workouts anymore. It\'s freeing."',
        emotion: 'Peace',
        emotionColor: colors.accentPurple,
      },
    ],
  },
};

// ============================================
// COMPONENTS
// ============================================

const AnimatedAvatar = ({ emoji, gradient }) => {
  return (
    <div style={{
      width: 100,
      height: 100,
      borderRadius: '50%',
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 48,
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      animation: 'pulse 3s ease-in-out infinite',
    }}>
      {emoji}
      <div style={{
        position: 'absolute',
        inset: -4,
        borderRadius: '50%',
        border: `2px solid ${colors.accentGold}40`,
        animation: 'ring 3s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11,
    fontWeight: 700,
    color: colors.accentGold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 12,
  }}>{children}</div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: colors.bgSecondary,
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: 12,
    padding: 16,
    ...style,
  }}>{children}</div>
);

const QuickFactsGrid = ({ facts }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  }}>
    {facts.map((fact, i) => (
      <div key={i} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: colors.bgTertiary,
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 18 }}>{fact.icon}</span>
        <div>
          <div style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 2 }}>{fact.label}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary }}>{fact.value}</div>
        </div>
      </div>
    ))}
  </div>
);

const ListItem = ({ children, icon = '○', iconColor = colors.accentGold }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  }}>
    <span style={{ color: iconColor, fontSize: 14, lineHeight: '22px' }}>{icon}</span>
    <span style={{ fontSize: 14, color: colors.textSecondary, lineHeight: '22px' }}>{children}</span>
  </div>
);

const TagList = ({ items, variant = 'default' }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {items.map((item, i) => (
      <span key={i} style={{
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: variant === 'warning' ? 'rgba(239, 68, 68, 0.15)' : colors.accentGoldSoft,
        color: variant === 'warning' ? colors.accentRed : colors.accentGold,
        border: `1px solid ${variant === 'warning' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(201, 162, 39, 0.3)'}`,
      }}>{variant === 'warning' ? '⚠ ' : ''}{item}</span>
    ))}
  </div>
);

const DifferentiatorCard = ({ icon, text }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    background: colors.bgTertiary,
    borderRadius: 8,
    border: `1px solid ${colors.borderSubtle}`,
  }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{text}</span>
  </div>
);

const StoryboardFrame = ({ frame, index }) => (
  <div style={{
    background: colors.bgSecondary,
    borderRadius: 10,
    overflow: 'hidden',
    border: `1px solid ${colors.borderSubtle}`,
    minWidth: 0,
  }}>
    {/* Frame number + emotion */}
    <div style={{
      padding: '6px 10px',
      background: colors.bgTertiary,
      borderBottom: `1px solid ${colors.borderSubtle}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: colors.textTertiary }}>
        {index + 1}
      </span>
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 8,
        background: `${frame.emotionColor}20`,
        color: frame.emotionColor,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{frame.emotion}</span>
    </div>
    
    {/* Illustration area */}
    <div style={{
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
      background: `linear-gradient(180deg, ${colors.bgTertiary} 0%, ${colors.bgSecondary} 100%)`,
    }}>
      {frame.scene}
    </div>
    
    {/* Content */}
    <div style={{ padding: 10 }}>
      <h4 style={{
        fontSize: 11,
        fontWeight: 600,
        color: colors.textPrimary,
        margin: '0 0 6px 0',
        lineHeight: 1.3,
      }}>{frame.title}</h4>
      <p style={{
        fontSize: 10,
        color: colors.textSecondary,
        margin: '0 0 8px 0',
        lineHeight: 1.4,
      }}>{frame.description}</p>
      <div style={{
        fontSize: 10,
        fontStyle: 'italic',
        color: colors.textTertiary,
        padding: '6px 8px',
        background: colors.bgTertiary,
        borderRadius: 4,
        borderLeft: `2px solid ${frame.emotionColor}`,
        lineHeight: 1.4,
      }}>{frame.thought}</div>
    </div>
  </div>
);

const Storyboard = ({ title, frames, variant }) => (
  <div style={{ marginTop: 28 }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    }}>
      <div style={{
        padding: '5px 12px',
        borderRadius: 16,
        fontSize: 11,
        fontWeight: 700,
        background: variant === 'asIs' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
        color: variant === 'asIs' ? colors.accentRed : colors.accentGreen,
        border: `1px solid ${variant === 'asIs' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
      }}>{variant === 'asIs' ? 'AS-IS' : 'TO-BE'}</div>
      <h3 style={{
        fontSize: 15,
        fontWeight: 600,
        color: colors.textPrimary,
        margin: 0,
      }}>{title}</h3>
    </div>
    
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 12,
    }}>
      {frames.map((frame, i) => (
        <StoryboardFrame key={i} frame={frame} index={i} />
      ))}
    </div>
  </div>
);

const PersonaCard = ({ persona }) => (
  <div>
    {/* Header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      marginBottom: 32,
      padding: 24,
      background: colors.bgSecondary,
      borderRadius: 16,
      border: `1px solid ${colors.borderSubtle}`,
    }}>
      <AnimatedAvatar emoji={persona.avatarEmoji} gradient={persona.avatarGradient} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: colors.accentGold,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 4,
        }}>{persona.title}</div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: colors.textPrimary,
          margin: '0 0 12px 0',
        }}>{persona.name}</h1>
        <p style={{
          fontSize: 16,
          fontStyle: 'italic',
          color: colors.textSecondary,
          margin: 0,
          padding: '12px 16px',
          background: colors.bgTertiary,
          borderRadius: 8,
          borderLeft: `3px solid ${colors.accentGold}`,
        }}>"{persona.quote}"</p>
      </div>
    </div>
    
    {/* Quick Facts */}
    <div style={{ marginBottom: 24 }}>
      <SectionLabel>Quick Facts</SectionLabel>
      <QuickFactsGrid facts={persona.quickFacts} />
    </div>
    
    {/* Two column layout */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      marginBottom: 24,
    }}>
      {/* Jobs to be Done */}
      <Card>
        <SectionLabel>Jobs to Be Done</SectionLabel>
        {persona.jobsToBeDone.map((job, i) => (
          <ListItem key={i} icon="○">{job}</ListItem>
        ))}
      </Card>
      
      {/* Pain Points */}
      <Card>
        <SectionLabel>Pain Points</SectionLabel>
        {persona.painPoints.map((pain, i) => (
          <ListItem key={i} icon="✗" iconColor={colors.accentRed}>{pain}</ListItem>
        ))}
      </Card>
    </div>
    
    {/* Emotional needs + Sensitivities */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20,
      marginBottom: 24,
    }}>
      <Card>
        <SectionLabel>Emotional Needs</SectionLabel>
        <TagList items={persona.emotionalNeeds} />
      </Card>
      <Card>
        <SectionLabel>Sensitivities</SectionLabel>
        <TagList items={persona.sensitivities} variant="warning" />
      </Card>
    </div>
    
    {/* Differentiators */}
    <div style={{ marginBottom: 24 }}>
      <SectionLabel>What Makes {persona.name} Different</SectionLabel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {persona.differentiators.map((diff, i) => (
          <DifferentiatorCard key={i} icon={diff.icon} text={diff.text} />
        ))}
      </div>
    </div>
    
    {/* PLYA Opportunity */}
    <Card style={{
      background: colors.accentGoldSoft,
      border: `1px solid ${colors.accentGold}40`,
      marginBottom: 40,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>💡</span>
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: colors.accentGold,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
          }}>PLYA Opportunity</div>
          <p style={{
            fontSize: 15,
            color: colors.textPrimary,
            margin: 0,
            lineHeight: 1.6,
          }}>{persona.opportunity}</p>
        </div>
      </div>
    </Card>
    
    {/* Storyboards */}
    <Storyboard
      title="The Current Struggle"
      frames={persona.asIs}
      variant="asIs"
    />
    
    <Storyboard
      title="The PLYA Experience"
      frames={persona.toBe}
      variant="toBe"
    />
  </div>
);

// ============================================
// MAIN APP
// ============================================

export default function PLYAPersonas() {
  const [activePersona, setActivePersona] = useState('athlete');
  
  const persona = personas[activePersona];

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      color: colors.textPrimary,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: colors.bgPrimary,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        padding: '16px 32px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1400,
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎯</span>
            <h1 style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              color: colors.textPrimary,
            }}>PLYA Personas</h1>
          </div>
          
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            background: colors.bgSecondary,
            borderRadius: 10,
            border: `1px solid ${colors.borderSubtle}`,
          }}>
            <button
              onClick={() => setActivePersona('athlete')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                background: activePersona === 'athlete' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'transparent',
                color: activePersona === 'athlete' ? colors.bgPrimary : colors.textTertiary,
              }}
            >
              💪 Jordan — Athlete
            </button>
            <button
              onClick={() => setActivePersona('professional')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                background: activePersona === 'professional' ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'transparent',
                color: activePersona === 'professional' ? colors.bgPrimary : colors.textTertiary,
              }}
            >
              💼 Alex — Professional
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '32px 32px 64px',
      }}>
        <PersonaCard persona={persona} />
      </div>
    </div>
  );
}
