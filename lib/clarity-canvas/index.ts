// Profile structure and constants
export { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES, getAllFieldKeys, getTotalFieldCount } from './profile-structure';
export type { SectionKey, ProfileStructure } from './profile-structure';

// Types
export * from './types';

// Scoring utilities
export {
  calculateFieldScore,
  calculateSubsectionScore,
  calculateSectionScore,
  calculateOverallScore,
  calculateAllScores,
  getWeakFields,
  getSectionCompletion,
} from './scoring';

// Profile seeding
export { seedProfileForUser, deleteProfileForUser, getProfileStats } from './seed-profile';

// Extraction schemas
export { extractionChunkSchema, brainDumpExtractionSchema } from './extraction-schema';
export type { ExtractionChunk, BrainDumpExtraction } from './extraction-schema';

// Prompts
export { BRAIN_DUMP_EXTRACTION_PROMPT, EXTRACTION_SYSTEM_PROMPT, QUESTION_RESPONSE_PROMPT } from './prompts';
