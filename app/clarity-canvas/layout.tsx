import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Clarity Canvas | 33 Strategies',
  description: 'Build your strategic profile through AI-powered conversations',
};

export default async function ClarityCanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?returnTo=/clarity-canvas');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}
