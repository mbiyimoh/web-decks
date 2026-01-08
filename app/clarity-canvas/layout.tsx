import { getUnifiedSession } from '@/lib/client-session-bridge';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Clarity Canvas | 33 Strategies',
  description: 'Build your strategic profile through AI-powered conversations',
};

export default async function ClarityCanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUnifiedSession();

  if (!session) {
    // Get the current path from headers to preserve the full URL for returnTo
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '/clarity-canvas';

    // Use the actual requested path, not a hardcoded value
    const returnTo = pathname.startsWith('/clarity-canvas') ? pathname : '/clarity-canvas';
    redirect(`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}
