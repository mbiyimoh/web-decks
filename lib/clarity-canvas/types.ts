import type {
  ClarityProfile,
  ProfileSection,
  ProfileSubsection,
  ProfileField,
  FieldSource,
  SourceType,
} from '@prisma/client';

// Re-export SourceType for convenience
export { SourceType };

// Full profile with all nested relations
export type ProfileWithSections = ClarityProfile & {
  sections: SectionWithSubsections[];
};

// Section with nested relations
export type SectionWithSubsections = ProfileSection & {
  subsections: SubsectionWithFields[];
};

// Subsection with fields
export type SubsectionWithFields = ProfileSubsection & {
  fields: FieldWithSources[];
};

// Field with sources
export type FieldWithSources = ProfileField & {
  sources: FieldSource[];
};

// Score calculation results
export interface ProfileScores {
  overall: number;
  sections: Record<string, number>;
}

// Score color thresholds
export type ScoreLevel = 'low' | 'medium' | 'high' | 'complete';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return 'complete';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export function getScoreColor(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'complete':
      return '#22c55e'; // green-500
    case 'high':
      return '#eab308'; // yellow-500
    case 'medium':
      return '#f97316'; // orange-500
    case 'low':
      return '#ef4444'; // red-500
  }
}

// Brain dump extraction chunk
export interface ExtractionChunk {
  content: string;
  targetSection: string;
  targetSubsection: string;
  targetField: string;
  summary: string;
  confidence: number;
  insights?: string[];
}

/** @deprecated Use ExtractOnlyResponse + CommitRecommendationsResponse instead. */
export interface BrainDumpResponse {
  extractedChunks: ExtractionChunk[];
  updatedProfile: ProfileWithSections;
  scores: ProfileScores;
}

// Question response structure
export interface QuestionResponse {
  value: string | string[] | number;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'voice' | 'text';
}

// Question response API payload
export interface QuestionResponsePayload {
  questionId: string;
  response: QuestionResponse;
}

// Question response API result
export interface QuestionResponseResult {
  fieldsUpdated: {
    sectionKey: string;
    fieldKey: string;
    previousScore: number;
    newScore: number;
  }[];
  scores: ProfileScores;
}

// Interview question definition
export interface InterviewQuestion {
  id: string;
  text: string;
  category: string;
  targetFields: {
    section: string;
    subsection: string;
    field: string;
  }[];
  responseType: 'text' | 'this-or-that' | 'slider' | 'multiselect' | 'scale' | 'voice';
  options?: string[];
  allowUnsure: boolean;
  priority: number;
}

// Voice recording state
export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  transcript: string;
  isProcessing: boolean;
  error: string | null;
}

// Profile API response
export interface ProfileApiResponse {
  profile: ProfileWithSections | null;
  scores: ProfileScores | null;
}

// Create profile response
export interface CreateProfileResponse {
  profile: ProfileWithSections;
  isNew: boolean;
}

// === Reviewable Recommendations Types ===

// Recommendation state for review screen
export type RecommendationStatus = 'pending' | 'approved' | 'rejected' | 'refined';

export interface Recommendation {
  id: string;
  chunk: ExtractionChunk;
  status: RecommendationStatus;
  refinedContent?: string;
  refinedSummary?: string;
}

// Extract API response (extract-only mode — no DB writes)
export interface ExtractOnlyResponse {
  extractedChunks: ExtractionChunk[];
  overallThemes: string[];
  suggestedFollowUps: string[];
  extractionMetadata?: ExtractionMetadata;
}

// Commit API request
export interface CommitRecommendationsRequest {
  recommendations: {
    targetSection: string;
    targetSubsection: string;
    targetField: string;
    content: string;
    summary: string;
    confidence: number;
    sourceType: 'VOICE' | 'TEXT';
  }[];
}

// Commit API response
export interface CommitRecommendationsResponse {
  updatedProfile: ProfileWithSections;
  scores: ProfileScores;
  previousScores: ProfileScores;
  savedCount: number;
  droppedCount: number;
}

// Refine API request
export interface RefineRecommendationRequest {
  currentContent: string;
  currentSummary: string;
  prompt: string;
  fieldKey: string;
}

// Refine API response
export interface RefineRecommendationResponse {
  refinedContent: string;
  refinedSummary: string;
}

// === Pillar Pages & Contextual Input Types ===

// Scoped extraction request
export interface ScopedExtractRequest {
  transcript: string;
  sourceType: 'VOICE' | 'TEXT';
  scope?: {
    section: string;
    subsection?: string;
  };
}

// File upload response
export interface FileUploadResponse {
  text: string;
  filename: string;
  charCount: number;
  fileType: string;
  wasTruncated: boolean;
}

// Celebration data for pillar score improvement
export interface CelebrationData {
  previousScore: number;
  newScore: number;
  fieldsUpdated: number;
  pillarName: string;
  pillarIcon: string;
}

// === Extraction Metadata Types ===

// Describes a change made during gap analysis
export interface GapAnalysisChange {
  type: 'added' | 'improved' | 'consolidated' | 'recategorized' | 'confidence_adjusted';
  description: string;
  fieldKey?: string;
}

// Metadata about the extraction process
export interface ExtractionMetadata {
  firstPassChunkCount: number;
  finalChunkCount: number;
  gapAnalysisApplied: boolean;
  changes: GapAnalysisChange[];
}
