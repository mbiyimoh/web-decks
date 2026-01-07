import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthGate } from '@/app/learning/components/AuthGate';
import { validateReturnTo } from '@/lib/auth-utils';

interface SignInPageProps {
  searchParams: Promise<{ returnTo?: string }>;
}

/**
 * Unified authentication gateway for 33 Strategies
 *
 * All protected areas redirect here with a returnTo param:
 * - /learning → /auth/signin?returnTo=/learning
 * - /clarity-canvas → /auth/signin?returnTo=/clarity-canvas
 * - /[future-feature] → /auth/signin?returnTo=/[future-feature]
 *
 * After successful auth, user is redirected to their original destination.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const { returnTo } = await searchParams;

  // Validate and sanitize returnTo to prevent open redirects
  const destination = validateReturnTo(returnTo);

  // If already authenticated, redirect to destination
  if (session?.user) {
    redirect(destination);
  }

  return <AuthGate returnTo={destination} />;
}
