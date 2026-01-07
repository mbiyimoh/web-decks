import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { InterviewClient } from './InterviewClient';

export const metadata = {
  title: 'Interview | Clarity Canvas',
  description: 'Answer quick questions to sharpen your profile',
};

export default async function InterviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/clarity-canvas/interview');
  }

  return <InterviewClient />;
}
