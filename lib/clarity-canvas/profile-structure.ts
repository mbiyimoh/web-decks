export const PROFILE_STRUCTURE = {
  individual: {
    name: 'Individual',
    icon: '👤',
    order: 1,
    subsections: {
      background: {
        name: 'Background & Identity',
        order: 1,
        fields: ['career', 'education', 'expertise', 'experience_years', 'industry'],
      },
      thinking: {
        name: 'Thinking Style',
        order: 2,
        fields: ['decision_making', 'problem_solving', 'risk_tolerance', 'learning_style'],
      },
      working: {
        name: 'Working Style',
        order: 3,
        fields: ['collaboration_preference', 'communication_style', 'work_pace', 'autonomy_level'],
      },
      values: {
        name: 'Values & Motivations',
        order: 4,
        fields: ['core_values', 'motivations', 'mission', 'passions'],
      },
    },
  },
  role: {
    name: 'Role',
    icon: '💼',
    order: 2,
    subsections: {
      responsibilities: {
        name: 'Core Responsibilities',
        order: 1,
        fields: ['title', 'primary_duties', 'key_metrics', 'team_size'],
      },
      scope: {
        name: 'Scope & Authority',
        order: 2,
        fields: ['decision_authority', 'budget_control', 'strategic_input', 'execution_focus'],
      },
      constraints: {
        name: 'Constraints & Challenges',
        order: 3,
        fields: ['time_constraints', 'resource_constraints', 'organizational_constraints', 'skill_gaps'],
      },
    },
  },
  organization: {
    name: 'Organization',
    icon: '🏢',
    order: 3,
    subsections: {
      fundamentals: {
        name: 'Company Fundamentals',
        order: 1,
        fields: ['company_name', 'org_industry', 'stage', 'size', 'founded', 'location'],
      },
      product: {
        name: 'Product & Strategy',
        order: 2,
        fields: ['core_product', 'value_proposition', 'business_model', 'competitive_advantage'],
      },
      market: {
        name: 'Market Position',
        order: 3,
        fields: ['target_market', 'customer_segments', 'market_size', 'competitive_landscape'],
      },
      financials: {
        name: 'Financial Context',
        order: 4,
        fields: ['funding_status', 'runway', 'revenue_stage', 'burn_rate'],
      },
    },
  },
  goals: {
    name: 'Goals',
    icon: '🎯',
    order: 4,
    subsections: {
      immediate: {
        name: 'Immediate Objectives',
        order: 1,
        fields: ['current_focus', 'this_week', 'this_month', 'blockers'],
      },
      medium: {
        name: 'Medium-term Aspirations',
        order: 2,
        fields: ['quarterly_goals', 'annual_goals', 'milestones'],
      },
      metrics: {
        name: 'Success Metrics',
        order: 3,
        fields: ['north_star', 'kpis', 'success_definition', 'validation_level'],
      },
      strategy: {
        name: 'Strategic Direction',
        order: 4,
        fields: ['growth_strategy', 'profitability_priority', 'exit_vision'],
      },
    },
  },
  network: {
    name: 'Network',
    icon: '🔗',
    order: 5,
    subsections: {
      stakeholders: {
        name: 'Key Stakeholders',
        order: 1,
        fields: ['investors', 'board', 'key_customers', 'key_partners'],
      },
      team: {
        name: 'Team & Reports',
        order: 2,
        fields: ['direct_reports', 'key_collaborators', 'cross_functional'],
      },
      support: {
        name: 'Support Network',
        order: 3,
        fields: ['advisors', 'mentors', 'peer_network', 'help_needed'],
      },
    },
  },
  projects: {
    name: 'Projects',
    icon: '📁',
    order: 6,
    subsections: {
      active: {
        name: 'Active Initiatives',
        order: 1,
        fields: ['current_projects', 'project_priorities', 'resource_allocation'],
      },
      upcoming: {
        name: 'Upcoming Priorities',
        order: 2,
        fields: ['planned_projects', 'next_quarter', 'backlog'],
      },
      completed: {
        name: 'Recent Completions',
        order: 3,
        fields: ['recent_wins', 'lessons_learned', 'portfolio'],
      },
    },
  },
} as const;

export type SectionKey = keyof typeof PROFILE_STRUCTURE;
export type ProfileStructure = typeof PROFILE_STRUCTURE;

// Field display name mapping for all 60+ fields
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  // Individual - Background
  career: 'Career Path',
  education: 'Education',
  expertise: 'Areas of Expertise',
  experience_years: 'Years of Experience',
  industry: 'Industry Background',

  // Individual - Thinking
  decision_making: 'Decision Making Style',
  problem_solving: 'Problem Solving Approach',
  risk_tolerance: 'Risk Tolerance',
  learning_style: 'Learning Style',

  // Individual - Working
  collaboration_preference: 'Collaboration Preference',
  communication_style: 'Communication Style',
  work_pace: 'Work Pace',
  autonomy_level: 'Autonomy Level',

  // Individual - Values
  core_values: 'Core Values',
  motivations: 'Key Motivations',
  mission: 'Personal Mission',
  passions: 'Passions & Interests',

  // Role - Responsibilities
  title: 'Job Title',
  primary_duties: 'Primary Duties',
  key_metrics: 'Key Metrics Owned',
  team_size: 'Team Size',

  // Role - Scope
  decision_authority: 'Decision Authority',
  budget_control: 'Budget Control',
  strategic_input: 'Strategic Input',
  execution_focus: 'Execution Focus',

  // Role - Constraints
  time_constraints: 'Time Constraints',
  resource_constraints: 'Resource Constraints',
  organizational_constraints: 'Organizational Constraints',
  skill_gaps: 'Skill Gaps',

  // Organization - Fundamentals
  company_name: 'Company Name',
  org_industry: 'Industry',
  stage: 'Company Stage',
  size: 'Company Size',
  founded: 'Year Founded',
  location: 'Headquarters Location',

  // Organization - Product
  core_product: 'Core Product/Service',
  value_proposition: 'Value Proposition',
  business_model: 'Business Model',
  competitive_advantage: 'Competitive Advantage',

  // Organization - Market
  target_market: 'Target Market',
  customer_segments: 'Customer Segments',
  market_size: 'Market Size',
  competitive_landscape: 'Competitive Landscape',

  // Organization - Financials
  funding_status: 'Funding Status',
  runway: 'Runway',
  revenue_stage: 'Revenue Stage',
  burn_rate: 'Burn Rate',

  // Goals - Immediate
  current_focus: 'Current Focus',
  this_week: 'This Week',
  this_month: 'This Month',
  blockers: 'Current Blockers',

  // Goals - Medium
  quarterly_goals: 'Quarterly Goals',
  annual_goals: 'Annual Goals',
  milestones: 'Key Milestones',

  // Goals - Metrics
  north_star: 'North Star Metric',
  kpis: 'Key KPIs',
  success_definition: 'Success Definition',
  validation_level: 'Validation Level',

  // Goals - Strategy
  growth_strategy: 'Growth Strategy',
  profitability_priority: 'Profitability Priority',
  exit_vision: 'Exit Vision',

  // Network - Stakeholders
  investors: 'Investors',
  board: 'Board Members',
  key_customers: 'Key Customers',
  key_partners: 'Key Partners',

  // Network - Team
  direct_reports: 'Direct Reports',
  key_collaborators: 'Key Collaborators',
  cross_functional: 'Cross-functional Teams',

  // Network - Support
  advisors: 'Advisors',
  mentors: 'Mentors',
  peer_network: 'Peer Network',
  help_needed: 'Help Needed',

  // Projects - Active
  current_projects: 'Current Projects',
  project_priorities: 'Project Priorities',
  resource_allocation: 'Resource Allocation',

  // Projects - Upcoming
  planned_projects: 'Planned Projects',
  next_quarter: 'Next Quarter Focus',
  backlog: 'Project Backlog',

  // Projects - Completed
  recent_wins: 'Recent Wins',
  lessons_learned: 'Lessons Learned',
  portfolio: 'Project Portfolio',
};

// Helper to get all field keys from the structure
export function getAllFieldKeys(): string[] {
  const fields: string[] = [];
  for (const section of Object.values(PROFILE_STRUCTURE)) {
    for (const subsection of Object.values(section.subsections)) {
      fields.push(...subsection.fields);
    }
  }
  return fields;
}

// Helper to count total fields
export function getTotalFieldCount(): number {
  return getAllFieldKeys().length;
}
