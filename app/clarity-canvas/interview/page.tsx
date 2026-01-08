import { redirect } from 'next/navigation';
import { getUnifiedSession } from '@/lib/client-session-bridge';
import { InterviewClient } from './InterviewClient';

export const metadata = {
  title: 'Interview | Clarity Canvas',
  description: 'Answer quick questions to sharpen your profile',
};

export default async function InterviewPage() {
  const session = await getUnifiedSession();

  if (!session) {
    redirect('/auth/signin?returnTo=/clarity-canvas/interview');
  }

  return <InterviewClient />;
}
