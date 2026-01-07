export interface QuestionOption {
  value: string;
  label: string;
  description: string;
}

export interface QuestionConfig {
  id: string;
  section: string;
  label: string;
  question: string;
  type: 'this-or-that' | 'slider' | 'multi-select' | 'scale';
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const INTERVIEW_QUESTIONS: QuestionConfig[] = [
  {
    id: 'q1',
    section: 'Goals',
    label: 'Success Vision',
    question: 'When you imagine success, which feels more true?',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Users come back every day', description: 'Retention is the north star' },
      { value: 'b', label: 'Users tell their friends about it', description: 'Organic growth is the north star' },
    ],
  },
  {
    id: 'q2',
    section: 'Individual',
    label: 'Problem Approach',
    question: 'When facing a new problem, you typically:',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Research extensively first', description: 'Data-driven decision making' },
      { value: 'b', label: 'Jump in and iterate', description: 'Action generates clarity' },
    ],
  },
  {
    id: 'q3',
    section: 'Organization',
    label: 'Runway',
    question: 'How many months of runway do you have?',
    type: 'slider',
    min: 0,
    max: 24,
    step: 1,
    unit: 'months',
  },
  {
    id: 'q4',
    section: 'Role',
    label: 'Constraints',
    question: 'What are your biggest constraints right now?',
    type: 'multi-select',
    options: [
      { value: 'time', label: 'Time', description: 'Not enough hours in the day' },
      { value: 'money', label: 'Capital', description: 'Budget limitations' },
      { value: 'team', label: 'Team', description: 'Talent or headcount gaps' },
      { value: 'tech', label: 'Technical', description: 'Technical debt or capabilities' },
      { value: 'clarity', label: 'Strategic clarity', description: 'Unclear direction' },
      { value: 'market', label: 'Market access', description: 'Reaching customers' },
    ],
  },
  {
    id: 'q5',
    section: 'Role',
    label: 'Role Need',
    question: 'Right now, your company needs you to be more of a:',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Visionary', description: 'Setting direction and inspiring' },
      { value: 'b', label: 'Operator', description: 'Executing and getting things done' },
    ],
  },
  {
    id: 'q6',
    section: 'Goals',
    label: 'Validation Level',
    question: 'How validated is your core hypothesis?',
    type: 'scale',
    options: [
      { value: '0', label: 'Pure assumption', description: 'Untested hypothesis' },
      { value: '1', label: 'Some signals', description: 'Early indicators but not conclusive' },
      { value: '2', label: 'Strong evidence', description: 'Growing confidence from data' },
      { value: '3', label: 'Validated', description: 'Proven with solid data' },
    ],
  },
  {
    id: 'q7',
    section: 'Goals',
    label: '12-Month Outcome',
    question: 'In 12 months, which outcome matters more?',
    type: 'this-or-that',
    options: [
      { value: 'a', label: 'Profitable and sustainable', description: 'Control your own destiny' },
      { value: 'b', label: 'Rapid growth with funding', description: 'Raise and accelerate' },
    ],
  },
  {
    id: 'q8',
    section: 'Network',
    label: 'Help Needed',
    question: 'What kind of help would be most valuable right now?',
    type: 'multi-select',
    options: [
      { value: 'technical', label: 'Technical expertise', description: 'Engineering or product help' },
      { value: 'fundraising', label: 'Fundraising intros', description: 'Investor connections' },
      { value: 'strategy', label: 'Strategic thinking partner', description: 'Thought partnership' },
      { value: 'design', label: 'Design/UX help', description: 'Visual and experience design' },
      { value: 'hiring', label: 'Hiring/recruiting', description: 'Finding talent' },
      { value: 'customers', label: 'Customer intros', description: 'Business development' },
    ],
  },
];

export interface QuestionResponse {
  value: string | string[] | number;
  isUnsure: boolean;
  confidence: number;
}

export interface FieldMapping {
  targetSection: string;
  targetSubsection: string;
  targetField: string;
  value: string;
}

export function mapQuestionResponseToFields(
  questionId: string,
  response: QuestionResponse
): FieldMapping[] {
  const mappings: FieldMapping[] = [];

  switch (questionId) {
    case 'q1': // Success Vision
      mappings.push({
        targetSection: 'goals',
        targetSubsection: 'metrics',
        targetField: 'north_star',
        value:
          response.value === 'a'
            ? 'Retention-focused: Users returning daily is the primary success signal'
            : 'Growth-focused: Organic user referrals are the primary success signal',
      });
      mappings.push({
        targetSection: 'goals',
        targetSubsection: 'metrics',
        targetField: 'success_definition',
        value:
          response.value === 'a'
            ? 'Success = high retention and daily active usage'
            : 'Success = viral growth and word-of-mouth expansion',
      });
      break;

    case 'q2': // Problem Approach
      mappings.push({
        targetSection: 'individual',
        targetSubsection: 'thinking',
        targetField: 'decision_making',
        value:
          response.value === 'a'
            ? 'Data-first: Relies on metrics and evidence before making decisions'
            : 'Intuition-led: Trusts gut instinct and iterates based on action',
      });
      mappings.push({
        targetSection: 'individual',
        targetSubsection: 'thinking',
        targetField: 'problem_solving',
        value:
          response.value === 'a'
            ? 'Analytical approach - deep research before action'
            : 'Experimental approach - action generates clarity',
      });
      break;

    case 'q3': // Runway
      const months = response.value as number;
      mappings.push({
        targetSection: 'organization',
        targetSubsection: 'financials',
        targetField: 'runway',
        value: `${months} months of runway`,
      });
      mappings.push({
        targetSection: 'organization',
        targetSubsection: 'financials',
        targetField: 'funding_status',
        value:
          months <= 6
            ? 'Tight runway - fundraising likely needed soon'
            : months <= 12
              ? 'Moderate runway'
              : 'Comfortable runway - 12+ months',
      });
      break;

    case 'q4': // Constraints
      const constraints = response.value as string[];
      if (constraints.includes('time')) {
        mappings.push({
          targetSection: 'role',
          targetSubsection: 'constraints',
          targetField: 'time_constraints',
          value: 'Time is a major constraint',
        });
      }
      const resourceConstraints = constraints
        .filter((c) => ['money', 'team', 'tech'].includes(c))
        .map(
          (c) =>
            ({ money: 'Capital', team: 'Team/talent', tech: 'Technical capabilities' })[c] || c
        );
      if (resourceConstraints.length > 0) {
        mappings.push({
          targetSection: 'role',
          targetSubsection: 'constraints',
          targetField: 'resource_constraints',
          value: resourceConstraints.join(', '),
        });
      }
      const orgConstraints = constraints
        .filter((c) => ['clarity', 'market'].includes(c))
        .map((c) => ({ clarity: 'Strategic clarity', market: 'Market access' })[c] || c);
      if (orgConstraints.length > 0) {
        mappings.push({
          targetSection: 'role',
          targetSubsection: 'constraints',
          targetField: 'organizational_constraints',
          value: orgConstraints.join(', '),
        });
      }
      break;

    case 'q5': // Role Need
      mappings.push({
        targetSection: 'role',
        targetSubsection: 'scope',
        targetField: 'execution_focus',
        value:
          response.value === 'b'
            ? 'Currently in operator mode - focused on execution and getting things done'
            : 'Currently in visionary mode - focused on setting direction',
      });
      mappings.push({
        targetSection: 'role',
        targetSubsection: 'scope',
        targetField: 'strategic_input',
        value:
          response.value === 'a'
            ? 'Primary focus on vision and inspiring others'
            : 'Primary focus on operational execution',
      });
      break;

    case 'q6': // Validation Level
      const validationLabels = [
        'Pure assumption - untested hypothesis',
        'Some signals - early indicators but not conclusive',
        'Strong evidence - growing confidence from data',
        'Validated - proven with solid data',
      ];
      mappings.push({
        targetSection: 'goals',
        targetSubsection: 'metrics',
        targetField: 'validation_level',
        value: validationLabels[parseInt(response.value as string)] || 'Unknown',
      });
      break;

    case 'q7': // 12-Month Outcome
      mappings.push({
        targetSection: 'goals',
        targetSubsection: 'strategy',
        targetField: 'profitability_priority',
        value:
          response.value === 'a'
            ? 'Profitability and sustainability are the priority'
            : 'Growth is the priority, willing to burn capital',
      });
      mappings.push({
        targetSection: 'goals',
        targetSubsection: 'strategy',
        targetField: 'growth_strategy',
        value:
          response.value === 'a'
            ? 'Organic, sustainable growth path'
            : 'Venture-scale growth with funding',
      });
      break;

    case 'q8': // Help Needed
      const helpItems = response.value as string[];
      const helpLabels: Record<string, string> = {
        technical: 'Technical expertise (engineering/product)',
        fundraising: 'Fundraising introductions',
        strategy: 'Strategic thinking partner',
        design: 'Design/UX help',
        hiring: 'Hiring/recruiting support',
        customers: 'Customer introductions',
      };
      if (helpItems.length > 0) {
        mappings.push({
          targetSection: 'network',
          targetSubsection: 'support',
          targetField: 'help_needed',
          value: helpItems.map((h) => helpLabels[h] || h).join(', '),
        });
      }
      break;
  }

  return mappings;
}
