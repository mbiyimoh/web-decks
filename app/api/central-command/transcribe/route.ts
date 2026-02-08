import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import OpenAI from 'openai';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );
  if (!isSessionValidForCentralCommand(session)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 400 });
    }

    const startTime = Date.now();
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });

    const processingTime = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration ?? 0,
      processingTime,
    });
  } catch (error) {
    console.error('[central-command/transcribe] Error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
