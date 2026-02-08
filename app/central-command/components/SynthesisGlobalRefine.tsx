'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  GOLD,
  GREEN,
  BG_ELEVATED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_DIM,
} from '@/components/portal/design-tokens';
import type { EnrichmentFindings, EnrichmentScoreAssessment, PendingRefinements } from '@/lib/central-command/types';

// ============================================================================
// TYPES
// ============================================================================

interface SynthesisGlobalRefineProps {
  currentSynthesis: EnrichmentFindings;
  currentScores?: Record<string, EnrichmentScoreAssessment>;
  onRefinementComplete: (updates: PendingRefinements) => void;
}

type RefineState = 'idle' | 'recording' | 'transcribing' | 'refining';

// ============================================================================
// SYNTHESIS GLOBAL REFINE
// ============================================================================

export default function SynthesisGlobalRefine({
  currentSynthesis,
  currentScores,
  onRefinementComplete,
}: SynthesisGlobalRefineProps) {
  const [state, setState] = useState<RefineState>('idle');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);

  // ============================================================================
  // VOICE RECORDING
  // ============================================================================

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      setState('transcribing');
      setError(null);

      try {
        // Transcribe audio
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const transcribeRes = await fetch('/api/central-command/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!transcribeRes.ok) throw new Error('Transcription failed');

        const { transcript } = await transcribeRes.json();
        if (!transcript?.trim()) {
          setState('idle');
          setError('No speech detected. Try again.');
          return;
        }

        // Auto-submit transcript to refine-synthesis
        await submitRefinement(transcript);
      } catch (err) {
        console.error('Voice refinement error:', err);
        setState('idle');
        setError('Failed to process recording. Try again.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSynthesis]
  );

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        handleRecordingComplete(audioBlob);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setState('recording');
      setDuration(0);
      setError(null);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= 300) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setError('Microphone access denied.');
    }
  }

  function handleStopRecording() {
    stopRecording();
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // ============================================================================
  // REFINEMENT SUBMISSION
  // ============================================================================

  async function submitRefinement(text: string) {
    setState('refining');
    setError(null);

    try {
      const res = await fetch('/api/central-command/refine-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSynthesis: {
            companyOverview: currentSynthesis.companyOverview || '',
            goalsAndVision: currentSynthesis.goalsAndVision || '',
            painAndBlockers: currentSynthesis.painAndBlockers || '',
            decisionDynamics: currentSynthesis.decisionDynamics || '',
            strategicAssessment: currentSynthesis.strategicAssessment || '',
            recommendedApproach: currentSynthesis.recommendedApproach || '',
          },
          currentScores: currentScores || undefined,
          prompt: text,
        }),
      });

      if (!res.ok) throw new Error('Refinement failed');

      const data = await res.json();

      // Filter out null values from response (OpenAI schema returns null for unchanged items)
      const filteredSections = data.updatedSections
        ? Object.fromEntries(
            Object.entries(data.updatedSections).filter(([, v]) => v !== null)
          )
        : {};
      const filteredScores = data.updatedScores
        ? Object.fromEntries(
            Object.entries(data.updatedScores).filter(([, v]) => v !== null)
          )
        : {};

      const hasUpdatedSections = Object.keys(filteredSections).length > 0;
      const hasUpdatedScores = Object.keys(filteredScores).length > 0;

      if (!hasUpdatedSections && !hasUpdatedScores) {
        setState('idle');
        setError('No changes needed based on your input.');
        return;
      }

      onRefinementComplete({
        updatedSections: hasUpdatedSections ? filteredSections : undefined,
        updatedScores: hasUpdatedScores ? filteredScores : undefined,
      } as PendingRefinements);
      setPrompt('');
      setState('idle');
    } catch (err) {
      console.error('Refinement error:', err);
      setState('idle');
      setError('Refinement failed. Try again.');
    }
  }

  function handleTextSubmit() {
    if (!prompt.trim()) return;
    submitRefinement(prompt.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }

  // ============================================================================
  // FORMAT HELPERS
  // ============================================================================

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const isProcessing = state === 'transcribing' || state === 'refining';

  return (
    <div className="flex items-center gap-2">
      {/* Error display */}
      {error && (
        <span className="text-[10px] font-mono" style={{ color: '#f87171' }}>
          {error}
        </span>
      )}

      {/* Recording state */}
      {state === 'recording' ? (
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono animate-pulse"
            style={{ color: '#f87171' }}
          >
            REC {formatTime(duration)}
          </span>
          <button
            onClick={handleStopRecording}
            className="px-2 py-1 rounded text-[10px] font-mono transition-all hover:opacity-80"
            style={{ background: '#f87171', color: BG_ELEVATED }}
            disabled={duration < 5}
            title={duration < 5 ? `Min ${5 - duration}s` : 'Stop recording'}
          >
            Stop
          </button>
        </div>
      ) : isProcessing ? (
        <span
          className="text-[10px] font-mono animate-pulse"
          style={{ color: GOLD }}
        >
          {state === 'transcribing' ? 'Transcribing...' : 'Analyzing...'}
        </span>
      ) : (
        <>
          {/* Text input */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Refine all sections..."
            disabled={isProcessing}
            className="px-2 py-1 rounded text-[10px] focus:outline-none font-mono border transition-colors w-48"
            style={{
              background: BG_ELEVATED,
              color: TEXT_PRIMARY,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />

          {/* Submit button */}
          <button
            onClick={handleTextSubmit}
            disabled={!prompt.trim() || isProcessing}
            className="p-1 rounded transition-all disabled:opacity-30 hover:bg-white/5"
            style={{ color: TEXT_MUTED }}
            title="Submit refinement"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </button>

          {/* Mic button */}
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="p-1 rounded transition-all disabled:opacity-30 hover:bg-white/5"
            style={{ color: TEXT_DIM }}
            title="Record voice refinement"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
