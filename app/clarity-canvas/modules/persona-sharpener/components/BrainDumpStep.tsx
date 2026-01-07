'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceRecorder } from '@/app/clarity-canvas/components/VoiceRecorder';

type InputMode = 'voice' | 'text';

interface BrainDumpStepProps {
  onComplete: (data: {
    inputType: InputMode;
    transcript: string;
    audioBlob?: Blob;
    durationSeconds?: number;
  }) => void;
  onBack?: () => void;
  externalError?: string | null;
}

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 4000;

export function BrainDumpStep({ onComplete, onBack, externalError }: BrainDumpStepProps) {
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [textInput, setTextInput] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [browserSupportsVoice, setBrowserSupportsVoice] = useState(true);

  // Combine internal and external errors for display
  const error = externalError || internalError;
  const setError = setInternalError;

  // Check browser support for voice recording
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const hasGetUserMedia = !!(
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        );
        const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
        setBrowserSupportsVoice(hasGetUserMedia && hasMediaRecorder);

        if (!hasGetUserMedia || !hasMediaRecorder) {
          setInputMode('text');
        }
      } catch {
        setBrowserSupportsVoice(false);
        setInputMode('text');
      }
    };
    checkSupport();
  }, []);

  const handleVoiceComplete = useCallback(
    async (audioBlob: Blob, duration: number) => {
      setIsTranscribing(true);
      setError(null);

      try {
        // Create FormData for transcription
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch('/api/clarity-canvas/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const { transcript } = await response.json();

        if (!transcript || transcript.length < MIN_TEXT_LENGTH) {
          throw new Error(
            'Could not transcribe enough content. Please try again or use text input.'
          );
        }

        onComplete({
          inputType: 'voice',
          transcript,
          audioBlob,
          durationSeconds: duration,
        });
      } catch (err) {
        console.error('Transcription error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Transcription failed. Please try again or use text input.'
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    [onComplete]
  );

  const handleTextSubmit = useCallback(() => {
    if (textInput.length < MIN_TEXT_LENGTH) {
      setError(`Please write at least ${MIN_TEXT_LENGTH} characters.`);
      return;
    }

    onComplete({
      inputType: 'text',
      transcript: textInput.slice(0, MAX_TEXT_LENGTH),
    });
  }, [textInput, onComplete]);

  const canSubmitText = textInput.length >= MIN_TEXT_LENGTH;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-display text-white mb-4">
          Let&apos;s build your customer personas
        </h1>
        <p className="text-lg text-zinc-400 max-w-lg mx-auto">
          Who are you building for? Paint a picture of the person who is going to
          benefit from the thing you are creating.
        </p>
      </motion.div>

      {/* Input mode toggle */}
      {browserSupportsVoice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex bg-zinc-800/50 rounded-lg p-1">
            <button
              onClick={() => setInputMode('voice')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                inputMode === 'voice'
                  ? 'bg-[#D4A84B] text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                Voice
              </span>
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-[#D4A84B] text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
                Text
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Error display */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <AnimatePresence mode="wait">
          {inputMode === 'voice' ? (
            <motion.div
              key="voice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isTranscribing ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="w-12 h-12 border-4 border-[#D4A84B] border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-400">Transcribing your audio...</p>
                </div>
              ) : (
                <VoiceRecorder
                  onRecordingComplete={handleVoiceComplete}
                  minDuration={15}
                  maxDuration={60}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setError(null);
                }}
                placeholder="Describe your ideal customers... For example: 'I'm building a time-tracking app for freelance designers who juggle multiple clients. They're usually 25-40, work from home, and struggle to accurately bill their hours. They need something simple that doesn't interrupt their creative flow...'"
                className="w-full h-48 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-[#D4A84B] focus:ring-1 focus:ring-[#D4A84B]/50 transition-all"
                maxLength={MAX_TEXT_LENGTH}
              />
              <div className="flex justify-between items-center text-sm">
                <span
                  className={`${
                    textInput.length < MIN_TEXT_LENGTH
                      ? 'text-zinc-500'
                      : 'text-green-400'
                  }`}
                >
                  {textInput.length} / {MIN_TEXT_LENGTH} min characters
                </span>
                <span className="text-zinc-500">
                  {textInput.length} / {MAX_TEXT_LENGTH}
                </span>
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={!canSubmitText}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  canSubmitText
                    ? 'bg-[#D4A84B] text-black hover:bg-[#e0b55c]'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-sm text-zinc-500">
          <span className="text-[#D4A84B]">Tip:</span> You can mention up to 3
          different customer types if you have them.
        </p>
      </motion.div>

      {/* Back button */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <button
            onClick={onBack}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            ← Back
          </button>
        </motion.div>
      )}
    </div>
  );
}
