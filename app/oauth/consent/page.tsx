/**
 * OAuth Consent Screen
 *
 * Displays requested scopes and allows user to approve or deny access
 * for third-party applications.
 */

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth/unified-auth';
import { getScopeDetails } from '@/lib/oauth';
import { nanoid } from 'nanoid';
import { Shield, Check, X } from 'lucide-react';

interface ConsentPageProps {
  searchParams: Promise<{
    client_id: string;
    scope: string;
    redirect_uri: string;
    state: string;
    code_challenge?: string;
    code_challenge_method?: string;
  }>;
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const params = await searchParams;
  const auth = await getAuth();

  // Require authentication
  if (!auth.authenticated || !auth.userId) {
    redirect('/auth/signin');
  }

  // Validate required params
  if (!params.client_id || !params.redirect_uri || !params.state) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111114] rounded-lg p-8 border border-[#222] text-center">
          <p className="text-[#f87171]">Invalid authorization request</p>
        </div>
      </div>
    );
  }

  // Fetch client info
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: params.client_id },
  });

  if (!client || !client.isActive) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111114] rounded-lg p-8 border border-[#222] text-center">
          <p className="text-[#f87171]">Unknown application</p>
        </div>
      </div>
    );
  }

  const scopeDetails = getScopeDetails(params.scope || 'read:profile');

  // Server action to handle consent
  async function handleConsent(formData: FormData) {
    'use server';

    const approved = formData.get('action') === 'approve';

    if (!approved) {
      // User denied - redirect with error
      const callbackUrl = new URL(params.redirect_uri);
      callbackUrl.searchParams.set('error', 'access_denied');
      callbackUrl.searchParams.set('error_description', 'User denied the request');
      callbackUrl.searchParams.set('state', params.state);
      redirect(callbackUrl.toString());
    }

    // User approved - store consent and issue code
    await prisma.oAuthUserConsent.upsert({
      where: {
        userId_clientId: {
          userId: auth.userId!,
          clientId: params.client_id,
        },
      },
      update: {
        scope: params.scope,
        grantedAt: new Date(),
      },
      create: {
        userId: auth.userId!,
        clientId: params.client_id,
        scope: params.scope,
      },
    });

    // Generate authorization code
    const code = nanoid(32);

    await prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        clientId: params.client_id,
        userId: auth.userId!,
        redirectUri: params.redirect_uri,
        scope: params.scope,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        codeChallenge: params.code_challenge || null,
        codeChallengeMethod: params.code_challenge_method || null,
      },
    });

    // Redirect with code
    const callbackUrl = new URL(params.redirect_uri);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', params.state);
    redirect(callbackUrl.toString());
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#111114] border border-[#222] mb-4">
            <Shield className="w-8 h-8 text-[#d4a54a]" />
          </div>
          <h1 className="text-2xl font-display text-[#f5f5f5]">
            Authorize Access
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-[#111114] rounded-lg border border-[#222] overflow-hidden">
          {/* App Info */}
          <div className="p-6 border-b border-[#222]">
            <p className="text-[#888] text-sm mb-1">Application</p>
            <p className="text-[#f5f5f5] text-lg font-medium">
              {client.clientName}
            </p>
          </div>

          {/* Requested Permissions */}
          <div className="p-6 border-b border-[#222]">
            <p className="text-[#888] text-xs font-mono uppercase tracking-wider mb-4">
              This will allow {client.clientName} to:
            </p>
            <ul className="space-y-3">
              {scopeDetails.map(({ scope, description }) => (
                <li key={scope} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#4ade80] mt-0.5 flex-shrink-0" />
                  <span className="text-[#f5f5f5] text-sm">{description}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-[#222] bg-[#0d0d12]">
            <p className="text-[#888] text-xs font-mono uppercase tracking-wider mb-2">
              Authorizing as
            </p>
            <p className="text-[#f5f5f5] text-sm">
              {auth.email || auth.clientId}
            </p>
          </div>

          {/* Actions */}
          <form action={handleConsent} className="p-6">
            <div className="flex gap-3">
              <button
                type="submit"
                name="action"
                value="deny"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1f] text-[#888] rounded-lg hover:bg-[#222] hover:text-[#f5f5f5] transition-colors"
              >
                <X className="w-4 h-4" />
                Deny
              </button>
              <button
                type="submit"
                name="action"
                value="approve"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#d4a54a] text-[#0a0a0f] rounded-lg hover:bg-[#e5b85b] transition-colors font-medium"
              >
                <Check className="w-4 h-4" />
                Allow
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[#555] text-xs mt-6">
          You can revoke this access at any time from your account settings.
        </p>
      </div>
    </div>
  );
}
