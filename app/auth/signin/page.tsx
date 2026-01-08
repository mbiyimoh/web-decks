import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { validateReturnTo } from '@/lib/auth-utils';
import { UnifiedAuthGate } from './UnifiedAuthGate';

interface SignInPageProps {
  searchParams: Promise<{ returnTo?: string }>;
}

/**
 * Unified authentication gateway for 33 Strategies
 *
 * Supports two user types:
 * 1. Team Members - Google OAuth or @33strategies.ai email/password
 * 2. Clients - Email/password (checked against all configured clients)
 *
 * All protected areas redirect here with a returnTo param:
 * - /learning → /auth/signin?returnTo=/learning
 * - /clarity-canvas → /auth/signin?returnTo=/clarity-canvas
 * - /[future-feature] → /auth/signin?returnTo=/[future-feature]
 *
 * After successful auth, user is redirected to their original destination.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { returnTo } = await searchParams;

  // Validate and sanitize returnTo to prevent open redirects
  const destination = validateReturnTo(returnTo);

  // Single unified check - handles both NextAuth and client portal sessions
  const session = await getUnifiedSession();
  if (session) {
    redirect(destination);
  }

  return <UnifiedAuthGate returnTo={destination} />;
}
