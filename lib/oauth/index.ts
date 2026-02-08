/**
 * OAuth 2.0 Module Index
 *
 * Re-exports all OAuth utilities for convenient importing.
 */

// Keys
export { getPrivateKey, getPublicKey, getPublicJWK, areKeysConfigured } from './keys';

// Tokens
export {
  generateAccessToken,
  validateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TOKEN_EXPIRY,
  type AccessTokenPayload,
  type RefreshTokenData,
} from './tokens';

// Refresh token rotation
export {
  createTokenPair,
  rotateRefreshToken,
  revokeTokensForUser,
  revokeTokensForClient,
  revokeTokenFamily,
  cleanupExpiredTokens,
  type TokenPair,
  type RotationResult,
} from './refresh';

// Middleware
export {
  withTokenAuth,
  getTokenAuth,
  requireScopes,
  type AuthenticatedRequest,
} from './middleware';

// Scopes
export {
  OAUTH_SCOPES,
  PUBLIC_SCOPES,
  SENSITIVE_SCOPES,
  ADMIN_SCOPES,
  validateScopes,
  hasAdminScopes,
  filterValidScopes,
  getScopeDescriptions,
  getScopeDetails,
  DEFAULT_PORTAL_SCOPES,
  DEFAULT_COMPANION_SCOPES,
  type OAuthScope,
} from './scopes';
