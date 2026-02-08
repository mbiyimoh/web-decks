// types.ts — TypeScript interfaces for Central Command Pipeline Dashboard

import { PipelineClient, PipelineRecord, TeamCapacity } from '@prisma/client';

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

// ============ ENUMS ============

export type DecisionStatus = 'yes' | 'no' | 'pending';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type EnrichmentStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ClientStatusType = 'active' | 'paused' | 'at-risk';
export type PipelineStatusType = 'intent' | 'funnel' | 'closed';

// ============ SCORING ============

export interface PriorityScores {
  strategic: number;  // 1-10: How strategic is this client for 33S?
  value: number;      // 1-10: Deal value relative to pipeline
  readiness: number;  // 1-10: How ready are they to move forward?
  timeline: number;   // 1-10: How urgent is their timeline?
  bandwidth: number;  // 1-10: Do we have capacity to serve them?
}

// ============ CONTACTS ============

export interface Contact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

// ============ STAGE HISTORY ============

export interface StageHistoryEntry {
  stage: StageId;
  completed: boolean;
  date?: string;        // ISO date string
  notes?: string;
  duration?: string;    // e.g., "45 min"
  metadata?: {
    proposalLink?: string;
    documents?: string[];
    signedDate?: string;
    paymentMethod?: string;
  };
}

// ============ TEAM ============

export interface TeamAllocation {
  client: string;
  percent: number;
}

// ============ CONFIDENCE (AI Enrichment) ============

export interface ConfidenceScore {
  score: number;      // 0-100
  status: string;     // 'verified' | 'partial' | 'estimated' | 'needs-research' | etc.
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

// ============ ENRICHMENT FINDINGS (stored as JSON on PipelineClient) ============

export interface EnrichmentScoreAssessment {
  score: number;
  rationale: string;
  evidence: string[];
  confidence: number;
}

export interface Stakeholder {
  name: string;
  title: string | null;
  role: string;
  context: string;
  contactInfo?: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
  };
  confidence: number;
}

export interface EnrichmentFindings {
  companyOverview?: string;
  goalsAndVision?: string;
  painAndBlockers?: string;
  decisionDynamics?: string;
  strategicAssessment?: string;
  recommendedApproach?: string;
  scoreAssessments?: Record<string, EnrichmentScoreAssessment>;
  stakeholders?: Stakeholder[];
}

// ============ SYNTHESIS VERSIONING ============

import type { Version } from './utils';

export type SynthesisVersions = {
  [K in keyof Omit<EnrichmentFindings, 'scoreAssessments'>]?: Version[];
};

// ============ PENDING REFINEMENTS (from global synthesis refinement) ============

/**
 * Pending refinements awaiting user acceptance.
 * Contains updated sections and/or scores from AI refinement.
 */
export interface PendingRefinements {
  updatedSections?: Record<string, {
    refinedContent: string;
    changeSummary: string;
  }>;
  updatedScores?: Record<string, EnrichmentScoreAssessment & {
    changeSummary: string;
  }>;
}

// ============ PROSPECT WITH RELATIONS ============

export type ProspectWithRecord = PipelineClient & {
  pipelineRecord: PipelineRecord | null;
};

// ============ DASHBOARD DATA ============

export interface ProspectsData {
  intentClients: ProspectWithRecord[];
  funnelClients: ProspectWithRecord[];
  closedDeals: ProspectWithRecord[];
  stats: {
    intentCount: number;
    intentValue: number;
    funnelCount: number;
    funnelValue: number;
    closedCount: number;
  };
}
