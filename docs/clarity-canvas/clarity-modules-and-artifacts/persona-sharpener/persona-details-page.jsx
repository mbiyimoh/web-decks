import React, { useState } from 'react';

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
  green: '#4ADE80',
  blue: '#60A5FA',
  orange: '#FB923C',
  red: '#EF4444',
  purple: '#A78BFA',
  white: '#ffffff',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
};

// ============================================================================
// MOCK DATA - Simulated responses after sharpening + some validations
// ============================================================================

const mockResponses = [
  // Age Range
  {
    id: 'resp-1',
    questionId: 'age-range',
    field: 'demographics.ageRange',
    value: 'middle',
    isUnsure: false,
    confidence: 75,
    additionalContext: "Based on Q3 customer interviews. Most of our paying users mentioned having kids and established careers. They're not fresh out of college but also not near retirement.",
    contextSource: 'text',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T14:30:00Z',
  },
  {
    id: 'resp-2',
    questionId: 'age-range',
    field: 'demographics.ageRange',
    value: 'younger',
    isUnsure: false,
    confidence: 90,
    additionalContext: "I'm 28, just started my career but already feeling the time crunch between work and trying to stay healthy.",
    contextSource: 'text',
    responseType: 'validation',
    respondentId: 'user-1',
    respondentRole: 'real-user',
    respondentName: 'Sarah M.',
    createdAt: '2024-12-18T09:15:00Z',
  },
  {
    id: 'resp-3',
    questionId: 'age-range',
    field: 'demographics.ageRange',
    value: 'middle',
    isUnsure: false,
    confidence: 85,
    additionalContext: '',
    contextSource: null,
    responseType: 'validation',
    respondentId: 'user-2',
    respondentRole: 'real-user',
    respondentName: 'Mike T.',
    createdAt: '2024-12-20T16:45:00Z',
  },
  
  // Lifestyle
  {
    id: 'resp-4',
    questionId: 'lifestyle',
    field: 'demographics.lifestyle',
    value: 'busy-professional',
    isUnsure: false,
    confidence: 85,
    additionalContext: "Every customer interview mentions being 'too busy'. It's the number one complaint.",
    contextSource: 'voice',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T14:32:00Z',
  },
  {
    id: 'resp-5',
    questionId: 'lifestyle',
    field: 'demographics.lifestyle',
    value: 'busy-professional',
    isUnsure: false,
    confidence: 95,
    additionalContext: "Definitely busy professional. I barely have time to eat lunch most days.",
    contextSource: 'text',
    responseType: 'validation',
    respondentId: 'user-1',
    respondentRole: 'real-user',
    respondentName: 'Sarah M.',
    createdAt: '2024-12-18T09:17:00Z',
  },
  {
    id: 'resp-6',
    questionId: 'lifestyle',
    field: 'demographics.lifestyle',
    value: 'balanced-seeker',
    isUnsure: false,
    confidence: 70,
    additionalContext: "I used to be a busy professional but I'm actively trying to change that. Work-life balance is my priority now.",
    contextSource: 'text',
    responseType: 'validation',
    respondentId: 'user-2',
    respondentRole: 'real-user',
    respondentName: 'Mike T.',
    createdAt: '2024-12-20T16:47:00Z',
  },
  
  // Emotional Job
  {
    id: 'resp-7',
    questionId: 'emotional-job',
    field: 'jobs.emotional',
    value: 'in-control',
    isUnsure: false,
    confidence: 60,
    additionalContext: "This one I'm less sure about. Could also be 'accomplished'. Need more data.",
    contextSource: 'text',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T14:45:00Z',
  },
  {
    id: 'resp-8',
    questionId: 'emotional-job',
    field: 'jobs.emotional',
    value: 'accomplished',
    isUnsure: false,
    confidence: 80,
    additionalContext: "I want to feel like I'm actually making progress, not just going through the motions.",
    contextSource: 'text',
    responseType: 'validation',
    respondentId: 'user-1',
    respondentRole: 'real-user',
    respondentName: 'Sarah M.',
    createdAt: '2024-12-18T09:25:00Z',
  },
  
  // Functional Job
  {
    id: 'resp-9',
    questionId: 'functional-job',
    field: 'jobs.functional',
    value: 'Fit effective workouts into a packed schedule without spending hours at the gym',
    isUnsure: false,
    confidence: 90,
    additionalContext: "This came directly from user interviews. Almost word for word what three different people said.",
    contextSource: 'text',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T14:50:00Z',
  },
  
  // Social Job
  {
    id: 'resp-10',
    questionId: 'social-job',
    field: 'jobs.social',
    value: 'competent',
    isUnsure: true,
    confidence: 40,
    additionalContext: "Honestly guessing here. Haven't asked about social perception directly.",
    contextSource: 'text',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T14:52:00Z',
  },
  
  // Dealbreakers
  {
    id: 'resp-11',
    questionId: 'dealbreakers',
    field: 'frustrations.dealbreakers',
    value: ['too-needy', 'too-slow', 'too-generic'],
    isUnsure: false,
    confidence: 80,
    additionalContext: "These three came up repeatedly in churn interviews.",
    contextSource: 'text',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T15:00:00Z',
  },
  {
    id: 'resp-12',
    questionId: 'dealbreakers',
    field: 'frustrations.dealbreakers',
    value: ['too-needy', 'too-complex', 'privacy'],
    isUnsure: false,
    confidence: 85,
    additionalContext: "I've quit apps before because they wanted me to log in every single day. Also really care about where my data goes.",
    contextSource: 'text',
    responseType: 'validation',
    respondentId: 'user-1',
    respondentRole: 'real-user',
    respondentName: 'Sarah M.',
    createdAt: '2024-12-18T09:30:00Z',
  },
  
  // Goal Priorities
  {
    id: 'resp-13',
    questionId: 'primary-goal',
    field: 'goals.priorities',
    value: [
      { id: 'save-time', label: 'Save time', rank: 1 },
      { id: 'be-healthy', label: 'Be healthier', rank: 2 },
      { id: 'reduce-stress', label: 'Reduce stress', rank: 3 },
      { id: 'achieve-more', label: 'Achieve more', rank: 4 },
      { id: 'look-good', label: 'Look/feel good', rank: 5 },
      { id: 'save-money', label: 'Save money', rank: 6 },
    ],
    isUnsure: false,
    confidence: 70,
    additionalContext: "Time is definitely #1 based on all feedback. Health vs stress ordering is a guess.",
    contextSource: 'text',
    responseType: 'assumption',
    respondentId: 'founder-1',
    respondentRole: 'founder',
    respondentName: 'Beems',
    createdAt: '2024-12-15T15:05:00Z',
  },
];

// Group responses by field
const getResponsesByField = (field) => {
  return mockResponses.filter(r => r.field === field);
};

// Calculate field metrics
const getFieldMetrics = (field) => {
  const responses = getResponsesByField(field);
  const assumptions = responses.filter(r => r.responseType === 'assumption');
  const validations = responses.filter(r => r.responseType === 'validation');
  
  const avgConfidence = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length)
    : 0;
  
  // Calculate alignment (how many validations match the assumption)
  let alignmentScore = null;
  if (assumptions.length > 0 && validations.length > 0) {
    const assumedValue = assumptions[0].value;
    const matches = validations.filter(v => {
      if (Array.isArray(assumedValue) && Array.isArray(v.value)) {
        // For arrays, check overlap
        return assumedValue.some(a => v.value.includes(a));
      }
      return v.value === assumedValue;
    });
    alignmentScore = Math.round((matches.length / validations.length) * 100);
  }
  
  return {
    totalResponses: responses.length,
    assumptionCount: assumptions.length,
    validationCount: validations.length,
    avgConfidence,
    alignmentScore,
    hasUnsure: responses.some(r => r.isUnsure),
    needsReview: alignmentScore !== null && alignmentScore < 70,
    responses
  };
};

// ============================================================================
// PERSONA DATA (post-sharpening state)
// ============================================================================

const personaData = {
  id: 'persona-1',
  name: 'The Efficient Optimizer',
  summary: 'Mid-career professional juggling multiple priorities who wants to feel in control.',
  quote: "I don't have time to waste on things that don't work.",
  
  clarity: {
    overall: 72,
    identity: 85,
    goals: 70,
    frustrations: 65,
    emotional: 60,
    behaviors: 45
  },
  
  avgConfidence: 73,
  
  demographics: {
    ageRange: { value: 'middle', display: '35-50' },
    lifestyle: { value: 'busy-professional', display: 'Busy Professional' },
    techSavviness: { value: 65, display: 'Moderately tech-savvy' }
  },
  
  jobs: {
    functional: 'Fit effective workouts into a packed schedule without spending hours at the gym',
    emotional: { value: 'in-control', display: 'Feel in control and organized' },
    social: { value: 'competent', display: 'Be seen as competent' }
  },
  
  goals: {
    priorities: ['Save time', 'Be healthier', 'Reduce stress']
  },
  
  frustrations: {
    dealbreakers: ['Requires too much daily effort', 'Takes too long to see results', 'Feels generic']
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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
        transition: 'width 0.3s ease'
      }} />
    </div>
  );
};

const ResponseTypeBadge = ({ type }) => {
  const isAssumption = type === 'assumption';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      backgroundColor: isAssumption ? 'rgba(251, 146, 60, 0.15)' : 'rgba(74, 222, 128, 0.15)',
      border: `1px solid ${isAssumption ? colors.orange : colors.green}40`,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      color: isAssumption ? colors.orange : colors.green,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: isAssumption ? colors.orange : colors.green
      }} />
      {isAssumption ? 'Assumption' : 'Validation'}
    </span>
  );
};

const ConfidenceBar = ({ value }) => {
  const getColor = () => {
    if (value >= 70) return colors.green;
    if (value >= 40) return colors.gold;
    return colors.orange;
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ 
        flex: 1,
        height: 6, 
        backgroundColor: colors.zinc800, 
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          backgroundColor: getColor(),
          borderRadius: 3
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: getColor(), minWidth: 36 }}>
        {value}%
      </span>
    </div>
  );
};

const AlignmentIndicator = ({ matches, assumedValue, actualValue }) => {
  if (matches) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        color: colors.green,
        fontSize: 11
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Matches assumption
      </div>
    );
  }
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 6,
      color: colors.orange,
      fontSize: 11
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      Differs from assumption
    </div>
  );
};

// ============================================================================
// RESPONSE CARD COMPONENT
// ============================================================================

const ResponseCard = ({ response, assumedValue }) => {
  const isAssumption = response.responseType === 'assumption';
  const matches = isAssumption ? null : (
    Array.isArray(assumedValue) 
      ? assumedValue.some(a => response.value.includes?.(a) || response.value === a)
      : response.value === assumedValue
  );
  
  // Format the value for display
  const formatValue = (val) => {
    if (Array.isArray(val)) {
      if (val[0]?.label) {
        return val.slice(0, 3).map(v => v.label).join(' → ');
      }
      return val.join(', ');
    }
    // Map known values to display strings
    const displayMap = {
      'younger': '18-35',
      'middle': '35-50',
      'older': '50+',
      'busy-professional': 'Busy Professional',
      'balanced-seeker': 'Balance Seeker',
      'in-control': 'In Control',
      'accomplished': 'Accomplished',
      'cared-for': 'Cared For',
      'free': 'Free',
      'competent': 'Competent',
      'aspirational': 'Aspirational',
      'relatable': 'Relatable',
      'innovative': 'Innovative',
      'too-complex': 'Too complicated',
      'too-slow': 'Takes too long',
      'too-expensive': 'Costs too much',
      'too-needy': 'Too much daily effort',
      'too-generic': 'Feels generic',
      'bad-support': 'Poor support',
      'privacy': 'Privacy concerns',
      'social-required': 'Forces social'
    };
    return displayMap[val] || val;
  };
  
  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.zinc800}`,
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${colors.zinc800}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surfaceDim
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ResponseTypeBadge type={response.responseType} />
          <span style={{ fontSize: 12, color: colors.zinc400 }}>
            {formatDate(response.createdAt)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: isAssumption ? colors.gold : colors.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: colors.bg
          }}>
            {response.respondentName.charAt(0)}
          </div>
          <span style={{ fontSize: 13, color: colors.white, fontWeight: 500 }}>
            {response.respondentName}
          </span>
          <span style={{ fontSize: 11, color: colors.zinc500 }}>
            ({response.respondentRole === 'founder' ? 'Founder' : 'Real User'})
          </span>
        </div>
      </div>
      
      {/* Body */}
      <div style={{ padding: 16 }}>
        {/* Response Value */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Response
          </span>
          <div style={{ 
            marginTop: 6,
            padding: '10px 14px',
            backgroundColor: colors.elevated,
            borderRadius: 8,
            fontSize: 14,
            color: colors.white,
            fontWeight: 500
          }}>
            {formatValue(response.value)}
          </div>
        </div>
        
        {/* Alignment (for validations only) */}
        {!isAssumption && matches !== null && (
          <div style={{ marginBottom: 16 }}>
            <AlignmentIndicator matches={matches} />
          </div>
        )}
        
        {/* Confidence */}
        <div style={{ marginBottom: response.additionalContext ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Confidence
            </span>
            {response.isUnsure && (
              <span style={{ 
                fontSize: 10, 
                color: colors.orange,
                backgroundColor: 'rgba(251, 146, 60, 0.15)',
                padding: '2px 6px',
                borderRadius: 3
              }}>
                Marked as uncertain
              </span>
            )}
          </div>
          <ConfidenceBar value={response.confidence} />
        </div>
        
        {/* Additional Context */}
        {response.additionalContext && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Context
              </span>
              {response.contextSource === 'voice' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.zinc500} strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
              )}
            </div>
            <div style={{
              padding: 12,
              backgroundColor: colors.elevated,
              borderLeft: `3px solid ${colors.zinc700}`,
              borderRadius: '0 8px 8px 0',
              fontSize: 13,
              color: colors.zinc300,
              lineHeight: 1.6,
              fontStyle: 'italic'
            }}>
              "{response.additionalContext}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RESPONSE DRILL-DOWN PANEL
// ============================================================================

const ResponseDrillDown = ({ field, label, onClose }) => {
  const metrics = getFieldMetrics(field);
  const assumptions = metrics.responses.filter(r => r.responseType === 'assumption');
  const assumedValue = assumptions[0]?.value;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 520,
      backgroundColor: colors.bg,
      borderLeft: `1px solid ${colors.zinc800}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.zinc800}`,
        backgroundColor: colors.surface
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ 
            fontSize: 11, 
            color: colors.gold, 
            fontWeight: 600, 
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Response History
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: colors.elevated,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.zinc400
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <h3 style={{ fontSize: 18, color: colors.white, margin: 0, fontFamily: 'Georgia, serif' }}>
          {label}
        </h3>
      </div>
      
      {/* Metrics Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: colors.surfaceDim,
        borderBottom: `1px solid ${colors.zinc800}`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: colors.white }}>
            {metrics.totalResponses}
          </span>
          <span style={{ fontSize: 12, color: colors.zinc500 }}>responses</span>
        </div>
        
        <div style={{ width: 1, height: 20, backgroundColor: colors.zinc700 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: colors.orange 
          }} />
          <span style={{ fontSize: 12, color: colors.zinc400 }}>
            {metrics.assumptionCount} assumption
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: colors.green 
          }} />
          <span style={{ fontSize: 12, color: colors.zinc400 }}>
            {metrics.validationCount} validation{metrics.validationCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {metrics.alignmentScore !== null && (
          <>
            <div style={{ width: 1, height: 20, backgroundColor: colors.zinc700 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: metrics.alignmentScore >= 70 ? colors.green : colors.orange 
              }}>
                {metrics.alignmentScore}%
              </span>
              <span style={{ fontSize: 12, color: colors.zinc500 }}>alignment</span>
            </div>
          </>
        )}
      </div>
      
      {/* Response List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {metrics.responses.map(response => (
            <ResponseCard 
              key={response.id} 
              response={response} 
              assumedValue={assumedValue}
            />
          ))}
        </div>
      </div>
      
      {/* Insight Footer */}
      {metrics.needsReview && (
        <div style={{
          padding: 16,
          borderTop: `1px solid ${colors.zinc800}`,
          backgroundColor: colors.surface
        }}>
          <div style={{
            padding: 14,
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            border: `1px solid ${colors.orange}30`,
            borderRadius: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div>
                <span style={{ fontSize: 12, color: colors.orange, fontWeight: 600 }}>
                  Low Alignment Detected
                </span>
                <p style={{ fontSize: 12, color: colors.zinc400, margin: '4px 0 0', lineHeight: 1.5 }}>
                  Only {metrics.alignmentScore}% of validations match your assumption. 
                  Consider updating your persona or investigating why users differ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CLICKABLE FIELD COMPONENT
// ============================================================================

const ClickableField = ({ field, label, value, icon, children, onClick }) => {
  const metrics = getFieldMetrics(field);
  const hasResponses = metrics.totalResponses > 0;
  
  return (
    <button
      onClick={() => hasResponses && onClick(field, label)}
      disabled={!hasResponses}
      style={{
        width: '100%',
        padding: 12,
        backgroundColor: colors.surface,
        border: `1px solid ${metrics.needsReview ? colors.orange + '40' : colors.zinc800}`,
        borderRadius: 10,
        cursor: hasResponses ? 'pointer' : 'default',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Response count badge */}
      {hasResponses && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          minWidth: 20,
          height: 20,
          padding: '0 6px',
          borderRadius: 10,
          backgroundColor: metrics.validationCount > 0 ? colors.blue : colors.zinc700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: colors.white
        }}>
          {metrics.totalResponses}
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 10, 
            color: colors.zinc500, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: 4
          }}>
            {label}
          </div>
          {children || (
            <div style={{ fontSize: 13, color: value ? colors.white : colors.zinc600 }}>
              {value || 'Not captured'}
            </div>
          )}
          
          {/* Mini metrics */}
          {hasResponses && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginTop: 8,
              fontSize: 10,
              color: colors.zinc500
            }}>
              <span>{metrics.avgConfidence}% avg confidence</span>
              {metrics.alignmentScore !== null && (
                <>
                  <span>•</span>
                  <span style={{ 
                    color: metrics.alignmentScore >= 70 ? colors.green : colors.orange 
                  }}>
                    {metrics.alignmentScore}% aligned
                  </span>
                </>
              )}
              {metrics.hasUnsure && (
                <>
                  <span>•</span>
                  <span style={{ color: colors.orange }}>Has uncertainty</span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Chevron */}
        {hasResponses && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.zinc600} strokeWidth="2" style={{ marginTop: 2 }}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        )}
      </div>
    </button>
  );
};

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

const SectionCard = ({ title, icon, clarity, children, onDrillDown }) => {
  return (
    <div style={{
      backgroundColor: colors.surfaceDim,
      borderRadius: 14,
      border: `1px solid ${colors.zinc800}`,
      overflow: 'hidden'
    }}>
      {/* Section Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${colors.zinc800}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ 
            fontSize: 13, 
            color: colors.white, 
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: colors.zinc500 }}>{clarity}%</span>
          <div style={{ width: 60 }}>
            <ClarityBar value={clarity} size="small" />
          </div>
        </div>
      </div>
      
      {/* Section Content */}
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT - PERSONA DETAILS PAGE
// ============================================================================

export default function PersonaDetailsPage() {
  const [drillDownField, setDrillDownField] = useState(null);
  const [drillDownLabel, setDrillDownLabel] = useState('');
  
  const handleDrillDown = (field, label) => {
    setDrillDownField(field);
    setDrillDownLabel(label);
  };
  
  const closeDrillDown = () => {
    setDrillDownField(null);
    setDrillDownLabel('');
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.white,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${colors.zinc800}`,
        backgroundColor: colors.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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
          <span style={{ fontSize: 14, color: colors.white, fontWeight: 600 }}>
            Primary Persona
          </span>
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{
            padding: '8px 14px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.zinc700}`,
            borderRadius: 8,
            color: colors.zinc400,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Continue Sharpening
          </button>
          <button style={{
            padding: '8px 14px',
            backgroundColor: colors.blue,
            border: 'none',
            borderRadius: 8,
            color: colors.white,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Share Validation Link
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ 
        maxWidth: 900, 
        margin: '0 auto', 
        padding: 24,
        paddingRight: drillDownField ? 560 : 24,
        transition: 'padding-right 0.3s ease'
      }}>
        {/* Persona Header Card */}
        <div style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          border: `1px solid ${colors.zinc800}`,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: colors.elevated,
              border: `2px solid ${colors.gold}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0
            }}>
              👤
            </div>
            
            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ 
                  fontSize: 24, 
                  fontWeight: 600, 
                  color: colors.white, 
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  {personaData.name}
                </h1>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: 'rgba(251, 146, 60, 0.15)',
                  borderRadius: 4,
                  fontSize: 10,
                  color: colors.orange,
                  fontWeight: 600
                }}>
                  {mockResponses.filter(r => r.responseType === 'assumption').length} assumptions
                </span>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: 'rgba(74, 222, 128, 0.15)',
                  borderRadius: 4,
                  fontSize: 10,
                  color: colors.green,
                  fontWeight: 600
                }}>
                  {mockResponses.filter(r => r.responseType === 'validation').length} validations
                </span>
              </div>
              <p style={{ fontSize: 14, color: colors.zinc400, margin: '0 0 12px', lineHeight: 1.5 }}>
                {personaData.summary}
              </p>
              
              {/* Quote */}
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(212, 168, 75, 0.08)',
                borderLeft: `3px solid ${colors.gold}`,
                borderRadius: '0 8px 8px 0',
                fontSize: 13,
                color: colors.zinc300,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif'
              }}>
                "{personaData.quote}"
              </div>
            </div>
            
            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 700, 
                  color: personaData.clarity.overall >= 70 ? colors.green : colors.gold,
                  fontFamily: 'Georgia, serif'
                }}>
                  {personaData.clarity.overall}%
                </div>
                <div style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase' }}>
                  Clarity
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 28, 
                  fontWeight: 700, 
                  color: personaData.avgConfidence >= 70 ? colors.green : colors.gold,
                  fontFamily: 'Georgia, serif'
                }}>
                  {personaData.avgConfidence}%
                </div>
                <div style={{ fontSize: 11, color: colors.zinc500, textTransform: 'uppercase' }}>
                  Confidence
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sections Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Identity Section */}
          <SectionCard 
            title="Identity" 
            icon="👤" 
            clarity={personaData.clarity.identity}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ClickableField
                field="demographics.ageRange"
                label="Age Range"
                value={personaData.demographics.ageRange.display}
                onClick={handleDrillDown}
              />
              <ClickableField
                field="demographics.lifestyle"
                label="Lifestyle"
                value={personaData.demographics.lifestyle.display}
                onClick={handleDrillDown}
              />
            </div>
          </SectionCard>
          
          {/* Jobs to be Done Section */}
          <SectionCard 
            title="Jobs to be Done" 
            icon="🎯" 
            clarity={personaData.clarity.goals}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ClickableField
                field="jobs.functional"
                label="Functional Job"
                value={personaData.jobs.functional}
                icon="⚙️"
                onClick={handleDrillDown}
              />
              <ClickableField
                field="jobs.emotional"
                label="Emotional Job"
                value={personaData.jobs.emotional.display}
                icon="💭"
                onClick={handleDrillDown}
              />
              <ClickableField
                field="jobs.social"
                label="Social Job"
                value={personaData.jobs.social.display}
                icon="👥"
                onClick={handleDrillDown}
              />
            </div>
          </SectionCard>
          
          {/* Goals Section */}
          <SectionCard 
            title="Goals" 
            icon="🎯" 
            clarity={personaData.clarity.goals}
          >
            <ClickableField
              field="goals.priorities"
              label="Priority Ranking"
              onClick={handleDrillDown}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {personaData.goals.priorities.slice(0, 3).map((goal, idx) => (
                  <span key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4,
                    fontSize: 12,
                    color: idx === 0 ? colors.gold : colors.zinc400
                  }}>
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: idx === 0 ? colors.gold : colors.zinc700,
                      color: idx === 0 ? colors.bg : colors.zinc400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      {idx + 1}
                    </span>
                    {goal}
                    {idx < 2 && <span style={{ color: colors.zinc600, marginLeft: 4 }}>→</span>}
                  </span>
                ))}
              </div>
            </ClickableField>
          </SectionCard>
          
          {/* Frustrations Section */}
          <SectionCard 
            title="Frustrations" 
            icon="😤" 
            clarity={personaData.clarity.frustrations}
          >
            <ClickableField
              field="frustrations.dealbreakers"
              label="Dealbreakers"
              onClick={handleDrillDown}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {personaData.frustrations.dealbreakers.map((item, idx) => (
                  <span key={idx} style={{
                    padding: '4px 10px',
                    backgroundColor: colors.elevated,
                    borderRadius: 12,
                    fontSize: 12,
                    color: colors.zinc400
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </ClickableField>
          </SectionCard>
          
        </div>
        
        {/* How to Read This Card */}
        <div style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: colors.surface,
          borderRadius: 14,
          border: `1px solid ${colors.zinc800}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span style={{ fontSize: 13, color: colors.blue, fontWeight: 600 }}>
              How to Read This Page
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.blue,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: colors.white
                }}>
                  3
                </div>
                <span style={{ fontSize: 12, color: colors.white, fontWeight: 500 }}>Response Count</span>
              </div>
              <p style={{ fontSize: 11, color: colors.zinc500, margin: 0, lineHeight: 1.5 }}>
                Blue badge shows total responses. Click any field to see all underlying data.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: colors.green, fontWeight: 600 }}>85%</span>
                <span style={{ fontSize: 12, color: colors.white, fontWeight: 500 }}>aligned</span>
              </div>
              <p style={{ fontSize: 11, color: colors.zinc500, margin: 0, lineHeight: 1.5 }}>
                Shows how many validations match your assumption. Below 70% triggers review.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ 
                  padding: '2px 6px',
                  backgroundColor: 'rgba(251, 146, 60, 0.15)',
                  borderRadius: 3,
                  fontSize: 10,
                  color: colors.orange
                }}>
                  Has uncertainty
                </span>
              </div>
              <p style={{ fontSize: 11, color: colors.zinc500, margin: 0, lineHeight: 1.5 }}>
                At least one response was marked "I'm not sure" — prioritize for validation.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Drill Down Panel */}
      {drillDownField && (
        <>
          {/* Backdrop */}
          <div 
            onClick={closeDrillDown}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 99
            }}
          />
          <ResponseDrillDown 
            field={drillDownField} 
            label={drillDownLabel}
            onClose={closeDrillDown} 
          />
        </>
      )}
    </div>
  );
}
