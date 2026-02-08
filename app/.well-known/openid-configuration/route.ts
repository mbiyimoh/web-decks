/**
 * OpenID Connect Discovery Document
 *
 * GET /.well-known/openid-configuration
 *
 * Returns metadata about the OAuth/OIDC provider endpoints and capabilities.
 */

import { NextResponse } from 'next/server';
import { OAUTH_SCOPES } from '@/lib/oauth';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://33strategies.ai';

export async function GET() {
  return NextResponse.json({
    // Issuer identifier
    issuer: BASE_URL,

    // Endpoints
    authorization_endpoint: `${BASE_URL}/api/oauth/authorize`,
    token_endpoint: `${BASE_URL}/api/oauth/token`,
    userinfo_endpoint: `${BASE_URL}/api/oauth/userinfo`,
    revocation_endpoint: `${BASE_URL}/api/oauth/revoke`,
    jwks_uri: `${BASE_URL}/.well-known/jwks.json`,

    // Supported features
    scopes_supported: Object.keys(OAUTH_SCOPES),
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256'],

    // Claims (subset of OIDC - we're not fully OIDC compliant)
    claims_supported: [
      'sub',
      'email',
      'name',
      'picture',
      'user_type',
      'client_portal_id',
      'created_at',
    ],

    // Service documentation
    service_documentation: `${BASE_URL}/docs/oauth`,

    // UI locales
    ui_locales_supported: ['en'],
  });
}
