import type { Question } from './types';

export const questionBank: Record<string, Question[]> = {
  identity: [
    {
      id: 'age-range',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics.ageRange',
      question: 'Your ideal customer is more likely to be...',
      validationQuestion: 'Which age range best describes you?',
      options: [
        {
          value: 'younger',
          label: '18-35',
          sublabel: 'Digital native, mobile-first',
        },
        {
          value: 'middle',
          label: '35-50',
          sublabel: 'Established career, time-poor',
        },
        {
          value: 'older',
          label: '50+',
          sublabel: 'More deliberate, values quality',
        },
      ],
    },
    {
      id: 'lifestyle',
      type: 'this-or-that',
      category: 'identity',
      field: 'demographics.lifestyle',
      question: 'Which better describes their lifestyle?',
      validationQuestion: 'Which better describes your lifestyle?',
      options: [
        {
          value: 'busy-professional',
          label: 'Busy Professional',
          sublabel: 'Career-focused, optimizes for efficiency',
        },
        {
          value: 'balanced-seeker',
          label: 'Balance Seeker',
          sublabel: 'Prioritizes work-life harmony',
        },
      ],
    },
    {
      id: 'tech-savvy',
      type: 'slider',
      category: 'identity',
      field: 'demographics.techSavviness',
      question: 'How tech-savvy is your typical customer?',
      validationQuestion: 'How tech-savvy would you say you are?',
      min: 'Prefers simplicity',
      max: 'Power user',
      defaultValue: 50,
    },
    {
      id: 'decision-style',
      type: 'this-or-that',
      category: 'identity',
      field: 'behaviors.decisionStyle',
      question: 'When trying something new, they typically...',
      validationQuestion: 'When trying something new, you typically...',
      options: [
        {
          value: 'researcher',
          label: 'Research First',
          sublabel: 'Reads reviews, compares options',
        },
        {
          value: 'action-taker',
          label: 'Jump In',
          sublabel: 'Figures it out as they go',
        },
      ],
    },
  ],

  goals: [
    {
      id: 'primary-goal',
      type: 'ranking',
      category: 'goals',
      field: 'goals.priorities',
      question: 'Rank what matters most to your customer:',
      validationQuestion: 'Rank what matters most to you:',
      items: [
        { id: 'save-time', label: 'Save time' },
        { id: 'save-money', label: 'Save money' },
        { id: 'look-good', label: 'Look/feel good' },
        { id: 'be-healthy', label: 'Be healthier' },
        { id: 'reduce-stress', label: 'Reduce stress' },
        { id: 'achieve-more', label: 'Achieve more' },
      ],
    },
    {
      id: 'success-scenario',
      type: 'fill-blank',
      category: 'goals',
      field: 'goals.successDefinition',
      question: "Complete this from your customer's perspective:",
      validationQuestion: 'Complete this from your perspective:',
      template:
        'I would consider this product a success if it helped me {blank} within {timeframe}.',
      blanks: [
        { id: 'blank', placeholder: 'achieve what outcome?' },
        {
          id: 'timeframe',
          placeholder: 'what timeframe?',
          suggestions: ['a week', 'a month', '3 months'],
        },
      ],
    },
    {
      id: 'functional-job',
      type: 'scenario',
      category: 'goals',
      field: 'jobs.functional',
      question:
        "When your customer uses your product, what's the primary task they're trying to accomplish?",
      validationQuestion:
        "When you use products like this, what's the primary task you're trying to accomplish?",
      placeholder:
        "e.g., 'Fit a workout into their lunch break' or 'Find the right gift in under 5 minutes'",
      helperText:
        "Focus on the functional job - what they literally need to get done",
    },
  ],

  frustrations: [
    {
      id: 'past-failures',
      type: 'scenario',
      category: 'frustrations',
      field: 'frustrations.pastFailures',
      question:
        "What have they tried before that didn't work? Why did it fail them?",
      validationQuestion:
        "What have you tried before that didn't work? Why did it fail you?",
      placeholder:
        "e.g., 'They tried fitness apps but hated logging every meal...'",
      helperText: 'Understanding past failures reveals what NOT to do',
    },
    {
      id: 'dealbreakers',
      type: 'multi-select',
      category: 'frustrations',
      field: 'frustrations.dealbreakers',
      question:
        'Which of these would make them abandon a product like yours?',
      validationQuestion:
        'Which of these would make you abandon a product like this?',
      options: [
        { value: 'too-complex', label: 'Too complicated to set up' },
        { value: 'too-slow', label: 'Takes too long to see results' },
        { value: 'too-expensive', label: 'Costs too much' },
        { value: 'too-needy', label: 'Requires too much daily effort' },
        { value: 'too-generic', label: 'Feels generic, not personalized' },
        { value: 'bad-support', label: 'Poor customer support' },
        { value: 'privacy', label: 'Privacy/data concerns' },
        { value: 'social-required', label: 'Forces social features' },
      ],
      maxSelections: 3,
      instruction: 'Select up to 3',
    },
    {
      id: 'current-workaround',
      type: 'fill-blank',
      category: 'frustrations',
      field: 'frustrations.currentWorkaround',
      question:
        'How do they currently solve this problem (without your product)?',
      validationQuestion: 'How do you currently solve this problem?',
      template:
        'Right now, they {workaround}, but they hate it because {reason}.',
      blanks: [
        { id: 'workaround', placeholder: 'what do they do?' },
        { id: 'reason', placeholder: 'why is it frustrating?' },
      ],
    },
  ],

  emotional: [
    {
      id: 'emotional-job',
      type: 'this-or-that',
      category: 'emotional',
      field: 'jobs.emotional',
      question: 'When using your product, they primarily want to feel...',
      validationQuestion:
        'When using products like this, you primarily want to feel...',
      options: [
        {
          value: 'in-control',
          label: 'In Control',
          sublabel: 'Confident, organized, on top of things',
        },
        {
          value: 'accomplished',
          label: 'Accomplished',
          sublabel: 'Proud, successful, making progress',
        },
        {
          value: 'cared-for',
          label: 'Cared For',
          sublabel: 'Supported, understood, not alone',
        },
        {
          value: 'free',
          label: 'Free',
          sublabel: 'Unburdened, relaxed, without worry',
        },
      ],
    },
    {
      id: 'quote-capture',
      type: 'scenario',
      category: 'emotional',
      field: 'quote',
      question:
        "In your customer's voice, what would they say is their biggest frustration?",
      validationQuestion:
        "In your own words, what's your biggest frustration in this area?",
      placeholder: "Write naturally - we're capturing authentic language",
      helperText: 'This quote will appear on the persona card',
    },
    {
      id: 'recommendation-trigger',
      type: 'scenario',
      category: 'emotional',
      field: 'emotional.recommendationTrigger',
      question: 'What would make them tell a friend about your product?',
      validationQuestion:
        'What would make you tell a friend about a product like this?',
      placeholder:
        "e.g., 'If they finally stuck with a routine for more than 2 weeks...'",
      helperText: "This reveals the emotional payoff they're really seeking",
    },
  ],

  social: [
    {
      id: 'social-job',
      type: 'this-or-that',
      category: 'social',
      field: 'jobs.social',
      question: 'How do they want to be perceived by others?',
      validationQuestion:
        'How do you want to be perceived by others in this area?',
      options: [
        {
          value: 'competent',
          label: 'Competent',
          sublabel: 'Has their act together',
        },
        {
          value: 'aspirational',
          label: 'Aspirational',
          sublabel: 'Someone to look up to',
        },
        {
          value: 'relatable',
          label: 'Relatable',
          sublabel: 'Down to earth, authentic',
        },
        {
          value: 'innovative',
          label: 'Innovative',
          sublabel: 'Ahead of the curve',
        },
      ],
    },
    {
      id: 'influence-sources',
      type: 'multi-select',
      category: 'social',
      field: 'behaviors.influences',
      question: 'Who influences their decisions in this area?',
      validationQuestion: 'Who influences your decisions in this area?',
      options: [
        { value: 'friends', label: 'Friends & family' },
        { value: 'colleagues', label: 'Colleagues & peers' },
        { value: 'influencers', label: 'Social media influencers' },
        { value: 'experts', label: 'Industry experts' },
        { value: 'reviews', label: 'Online reviews' },
        { value: 'nobody', label: 'Research independently' },
      ],
      maxSelections: 2,
      instruction: 'Select top 2',
    },
  ],

  behaviors: [
    {
      id: 'discovery-channel',
      type: 'ranking',
      category: 'behaviors',
      field: 'behaviors.discoveryChannels',
      question: 'Where are they most likely to discover products like yours?',
      validationQuestion:
        'Where are you most likely to discover products like this?',
      items: [
        { id: 'social', label: 'Social media' },
        { id: 'search', label: 'Google search' },
        { id: 'friend', label: 'Friend recommendation' },
        { id: 'content', label: 'Blog/article/podcast' },
        { id: 'app-store', label: 'App store browsing' },
        { id: 'ads', label: 'Paid ads' },
      ],
    },
    {
      id: 'usage-time',
      type: 'this-or-that',
      category: 'behaviors',
      field: 'behaviors.usageTime',
      question: 'When would they most likely use your product?',
      validationQuestion:
        'When would you most likely use a product like this?',
      options: [
        {
          value: 'morning',
          label: 'Morning',
          sublabel: 'Part of their wake-up routine',
        },
        {
          value: 'workday',
          label: 'During Work',
          sublabel: 'Micro-moments between tasks',
        },
        {
          value: 'evening',
          label: 'Evening',
          sublabel: 'Wind-down or planning time',
        },
        {
          value: 'weekend',
          label: 'Weekend',
          sublabel: 'Dedicated personal time',
        },
      ],
    },
    {
      id: 'time-available',
      type: 'slider',
      category: 'behaviors',
      field: 'behaviors.timeAvailable',
      question: 'How much time can they realistically dedicate to this?',
      validationQuestion:
        'How much time can you realistically dedicate to this?',
      min: '< 5 min/day',
      max: '30+ min/day',
      defaultValue: 30,
    },
  ],

  antiPatterns: [
    {
      id: 'not-customer',
      type: 'multi-select',
      category: 'antiPatterns',
      field: 'antiPatterns',
      question: 'Who is explicitly NOT your customer?',
      validationQuestion: null,
      options: [
        { value: 'price-sensitive', label: 'People who only care about price' },
        { value: 'experts', label: 'People who already know everything' },
        { value: 'no-problem', label: "People who don't have this problem" },
        { value: 'no-change', label: 'People resistant to change' },
        { value: 'wrong-platform', label: 'People on wrong platforms' },
        { value: 'wrong-stage', label: 'People at wrong life stage' },
      ],
      maxSelections: 3,
      instruction: 'Select up to 3',
    },
  ],
};

// Build interleaved question sequence for engagement
export const questionSequence: Question[] = [
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
  ...questionBank.antiPatterns,
];

export function getQuestionById(id: string): Question | undefined {
  return questionSequence.find((q) => q.id === id);
}

export function getQuestionsByCategory(category: string): Question[] {
  return questionBank[category] || [];
}

export function getTotalQuestions(): number {
  return questionSequence.length;
}
