/**
 * Clarity Companion API
 *
 * Public exports for the context delivery layer.
 */

// Types
export * from './types';

// Synthesis
export {
  generateBaseSynthesis,
  estimateTokens,
  estimateObjectTokens,
  calculateProfileHash,
  generateVersion,
} from './synthesis';

// Caching
export {
  getCachedSynthesis,
  isSynthesisStale,
  invalidateSynthesis,
  getSectionVersion,
} from './cache';

// Middleware
export {
  validateCompanionAuth,
  createAuthErrorResponse,
  type CompanionAuth,
  type CompanionAuthResult,
  type CompanionAuthError,
} from './middleware';

// Tools
export {
  CLARITY_CANVAS_TOOLS,
  getToolsForClaude,
  getToolsForOpenAI,
} from './tools';

// Prompts
export { getProductSystemPrompt, getMinimalPrompt } from './prompts';

// Logging
export { logAccess, getProductStats } from './logging';
