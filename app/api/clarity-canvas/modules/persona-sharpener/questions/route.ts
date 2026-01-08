import { NextResponse } from 'next/server';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';
import { questionSequence } from '@/lib/clarity-canvas/modules/persona-sharpener/questions';

export async function GET() {
  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      questions: questionSequence,
      totalQuestions: questionSequence.length,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
