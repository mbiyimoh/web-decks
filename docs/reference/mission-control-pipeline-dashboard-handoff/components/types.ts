// types.ts — TypeScript interfaces for Mission Control Dashboard

// ============ PIPELINE STAGES ============

export type StageId = 
  | 'lead' 
  | 'discovery' 
  | 'assessment' 
  | 'proposal' 
  | 'negotiation' 
  | 'contract' 
  | 'payment' 
  | 'kickoff';

export interface Stage {
  id: StageId;
  name: string;
  short: string; // 2-letter abbreviation for compact display
}

export const STAGES: Stage[] = [
  { id: 'lead', name: 'Lead', short: 'LD' },
  { id: 'discovery', name: 'Discovery', short: 'DS' },
  { id: 'assessment', name: 'Assessment', short: 'AS' },
  { id: 'proposal', name: 'Proposal', short: 'PR' },
  { id: 'negotiation', name: 'Negotiation', short: 'NG' },
  { id: 'contract', name: 'Contract', short: 'CT' },
  { id: 'payment', name: 'Payment', short: 'PY' },
  { id: 'kickoff', name: 'Kickoff', short: 'KO' }
];

// ============ SCORING ============

export interface PriorityScores {
  strategic: number;  // 1-10: How strategic is this client for 33S?
  value: number;      // 1-10: Deal value relative to pipeline
  readiness: number;  // 1-10: How ready are they to move forward?
  timeline: number;   // 1-10: How urgent is their timeline?
  bandwidth: number;  // 1-10: Do we have capacity to serve them?
}

export const SCORE_WEIGHTS: Record<keyof PriorityScores, number> = {
  strategic: 20,
  value: 20,
  readiness: 20,
  timeline: 20,
  bandwidth: 20
};

// ============ CONTACTS ============

export interface Contact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

// ============ CONFIDENCE (AI Enrichment) ============

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type ConfidenceStatus = 'verified' | 'partial' | 'estimated' | 'needs-research' | 'needs-discovery' | 'unknown' | 'blocked' | 'discussed' | 'validated' | 'strong' | 'flexible' | 'known';

export interface ConfidenceScore {
  score: number;      // 0-100
  status: ConfidenceStatus;
  notes: string;
}

export interface ClientConfidence {
  overall: ConfidenceLevel;
  companyInfo?: ConfidenceScore;
  contactInfo?: ConfidenceScore;
  problemFit?: ConfidenceScore;
  budget?: ConfidenceScore;
  timeline?: ConfidenceScore;
}

// ============ AI ENRICHMENT ============

export type EnrichmentStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface AIEnrichment {
  status: EnrichmentStatus;
  lastRun: string | null;  // ISO date string
  findings?: Record<string, any>;
  suggestedActions?: string[];
}

// ============ STAGE JOURNEY (for detailed tracking) ============

export interface StageData {
  complete: boolean;
  date?: string;        // ISO date string
  notes?: string;
  duration?: string;    // e.g., "45 min"
  documents?: string[]; // file names
  link?: string;        // proposal link, etc.
  password?: string;    // proposal password
  signedDate?: string;  // for contract stage
  method?: string;      // for payment stage
}

export type ClientJourney = Partial<Record<StageId, StageData>>;

// ============ INTENT CLIENTS (Active Pipeline) ============

export interface IntentClient {
  id: string;
  name: string;
  industry: string;
  color: string;        // Hex color for avatar/badges
  value: number;        // Contract value in dollars
  currentStage: StageId;
  stageIndex: number;   // 0-7 index into STAGES array
  scores: PriorityScores;
  nextAction: string;
  nextActionDate: string;
  daysInStage: number;
  contact: Contact;
  proposalLink?: string;
  status: 'active' | 'paused' | 'at-risk';
  journey?: ClientJourney;
}

// ============ FUNNEL CLIENTS (Top of Funnel) ============

export type DecisionStatus = 'yes' | 'no' | 'pending';

export interface FunnelClient {
  id: string;
  name: string;
  industry: string;
  color: string;
  potentialValue: number;
  scores: PriorityScores;
  discoveryComplete: boolean;
  assessmentComplete: boolean;
  readinessPercent: number;  // 0-100
  decision: DecisionStatus;
  decisionReason?: string;   // If decision is 'no'
  contact: Contact;
  notes?: string;
  portalLink?: string;
  website?: string;
  productFocus?: string;     // Which 33S product is best fit
  isNew?: boolean;           // Highlight as new prospect
  intakeMethod?: 'granola' | 'canvas' | 'manual' | 'portal';
  intakeDate?: string;
  confidence?: ClientConfidence;
  aiEnrichment?: AIEnrichment;
}

// ============ CLOSED DEALS ============

export interface ClosedDeal {
  id: string;
  name: string;
  industry: string;
  color: string;
  value: number;
  stageReached: StageId;
  stageIndex: number;
  closedDate: string;
  reason: string;
  reasonDetail?: string;
  contact: Contact;
  journey?: ClientJourney;
  lessonsLearned?: string;
  reengageDate?: string;
  reengageNotes?: string;
}

// ============ TEAM ============

export interface TeamAllocation {
  client: string;
  percent: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  utilization: number;  // 0-100 percent
  allocated: TeamAllocation[];
}

// ============ INTAKE ============

export type IntakeMethod = 'granola' | 'canvas' | 'manual' | 'portal';

export interface IntakeFormData {
  method: IntakeMethod;
  companyName?: string;
  contactName?: string;
  industry?: string;
  notes?: string;
  granolaTranscript?: string;
  portalUrl?: string;
}

// ============ DASHBOARD STATE ============

export interface DashboardFilters {
  showClosed: boolean;
  sortBy: 'priority' | 'value' | 'date' | 'name';
  filterByDecision?: DecisionStatus;
}

// ============ UTILITY FUNCTIONS ============

export function calculatePriority(scores: PriorityScores): number {
  return Object.keys(scores).reduce((total, key) => {
    const k = key as keyof PriorityScores;
    return total + scores[k] * (SCORE_WEIGHTS[k] / 100);
  }, 0);
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount;
}

export function getStageByIndex(index: number): Stage {
  return STAGES[index] || STAGES[0];
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  const colors: Record<ConfidenceLevel, string> = {
    high: '#4ADE80',
    medium: '#D4A84B',
    low: '#ef4444',
    unknown: '#71717a'
  };
  return colors[level];
}
