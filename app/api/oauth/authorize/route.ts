/**
 * OAuth 2.0 Authorization Endpoint
 *
 * Handles the authorization code flow with PKCE support.
 *
 * GET /api/oauth/authorize
 * Query params:
 *   - client_id: OAuth client identifier
 *   - redirect_uri: Callback URL
 *   - response_type: Must be "code"
 *   - scope: Space-separated scopes
 *   - state: CSRF protection token
 *   - code_challenge: PKCE challenge (required for public clients)
 *   - code_challenge_method: Must be "S256"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { validateScopes } from '@/lib/oauth';
import { getAuth } from '@/lib/auth/unified-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract OAuth parameters
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope') || 'read:profile';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  // Validate required parameters
  if (!clientId) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'client_id is required' },
      { status: 400 }
    );
  }

  if (!redirectUri) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: 'redirect_uri is required',
      },
      { status: 400 }
    );
  }

  if (responseType !== 'code') {
    return NextResponse.json(
      {
        error: 'unsupported_response_type',
        error_description: 'Only code response_type is supported',
      },
      { status: 400 }
    );
  }

  if (!state) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: 'state is required for CSRF protection',
      },
      { status: 400 }
    );
  }

  // Validate client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client || !client.isActive) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client not found or inactive' },
      { status: 400 }
    );
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description: 'redirect_uri is not registered for this client',
      },
      { status: 400 }
    );
  }

  // Validate scopes
  if (!validateScopes(scope, client.scope)) {
    return errorRedirect(redirectUri, state, 'invalid_scope', 'Requested scope exceeds allowed scopes');
  }

  // PKCE validation for public clients
  if (!client.clientSecret && !codeChallenge) {
    return errorRedirect(redirectUri, state, 'invalid_request', 'PKCE is required for public clients');
  }

  if (codeChallenge && codeChallengeMethod !== 'S256') {
    return errorRedirect(redirectUri, state, 'invalid_request', 'Only S256 code_challenge_method is supported');
  }

  // Check if user is authenticated
  const auth = await getAuth(request);

  if (!auth.authenticated || !auth.userId) {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For first-party apps, skip consent and issue code directly
  if (client.isFirstParty) {
    return issueAuthorizationCode({
      clientId,
      userId: auth.userId,
      redirectUri,
      scope,
      state,
      codeChallenge,
      codeChallengeMethod,
    });
  }

  // For third-party apps, check existing consent
  const existingConsent = await prisma.oAuthUserConsent.findUnique({
    where: {
      userId_clientId: {
        userId: auth.userId,
        clientId,
      },
    },
  });

  // If user has already consented to these scopes, issue code
  if (existingConsent && validateScopes(scope, existingConsent.scope)) {
    return issueAuthorizationCode({
      clientId,
      userId: auth.userId,
      redirectUri,
      scope,
      state,
      codeChallenge,
      codeChallengeMethod,
    });
  }

  // Redirect to consent screen
  const consentUrl = new URL('/oauth/consent', request.url);
  consentUrl.searchParams.set('client_id', clientId);
  consentUrl.searchParams.set('scope', scope);
  consentUrl.searchParams.set('redirect_uri', redirectUri);
  consentUrl.searchParams.set('state', state);
  if (codeChallenge) {
    consentUrl.searchParams.set('code_challenge', codeChallenge);
    consentUrl.searchParams.set(
      'code_challenge_method',
      codeChallengeMethod || 'S256'
    );
  }

  return NextResponse.redirect(consentUrl);
}

// ============================================================================
// Helper Functions
// ============================================================================

interface AuthCodeParams {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
}

async function issueAuthorizationCode(params: AuthCodeParams) {
  const code = nanoid(32);

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      scope: params.scope,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
    },
  });

  const callbackUrl = new URL(params.redirectUri);
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set('state', params.state);

  return NextResponse.redirect(callbackUrl);
}

function errorRedirect(
  redirectUri: string,
  state: string,
  error: string,
  errorDescription: string
) {
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('error', error);
  callbackUrl.searchParams.set('error_description', errorDescription);
  callbackUrl.searchParams.set('state', state);
  return NextResponse.redirect(callbackUrl);
}
