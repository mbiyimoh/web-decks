'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { VoiceRecorder } from './components/VoiceRecorder';
import { ProfileVisualization } from './components/ProfileVisualization';
import type { ProfileWithSections, ProfileScores } from '@/lib/clarity-canvas/types';

type FlowStep = 'welcome' | 'brain-dump' | 'recording' | 'processing' | 'profile';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
}

interface ClarityCanvasClientProps {
  user: User;
}

export function ClarityCanvasClient({ user }: ClarityCanvasClientProps) {
  const [step, setStep] = useState<FlowStep>('welcome');
  const [profile, setProfile] = useState<ProfileWithSections | null>(null);
  const [scores, setScores] = useState<ProfileScores | null>(null);
  const [previousScores, setPreviousScores] = useState<ProfileScores | null>(null);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  // Fetch existing profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/clarity-canvas/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile(data.profile);
            setScores(data.scores);
            // If profile exists and has content, skip to profile view
            if (data.scores?.overall > 0) {
              setStep('profile');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    }
    fetchProfile();
  }, []);

  const handleStartBrainDump = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create profile if doesn't exist
      const response = await fetch('/api/clarity-canvas/profile', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setStep('brain-dump');
    } catch (err) {
      setError('Failed to initialize profile. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number) => {
    setStep('processing');
    setIsLoading(true);
    setError(null);

    try {
      // Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/clarity-canvas/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { transcript: transcribedText } = await transcribeResponse.json();
      setTranscript(transcribedText);

      // Extract and update profile
      const extractResponse = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcribedText,
          sourceType: 'VOICE',
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract profile information');
      }

      const extractData = await extractResponse.json();
      setProfile(extractData.updatedProfile);
      setScores(extractData.scores);
      setStep('profile');
    } catch (err) {
      setError('Failed to process recording. Please try again.');
      console.error(err);
      setStep('brain-dump');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTextSubmit = async (text: string) => {
    setStep('processing');
    setIsLoading(true);
    setError(null);

    try {
      const extractResponse = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          sourceType: 'TEXT',
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract profile information');
      }

      const extractData = await extractResponse.json();
      setProfile(extractData.updatedProfile);
      setScores(extractData.scores);
      setStep('profile');
    } catch (err) {
      setError('Failed to process text. Please try again.');
      console.error(err);
      setStep('brain-dump');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <WelcomeScreen
            key="welcome"
            userName={user.name || 'there'}
            onStart={handleStartBrainDump}
            isLoading={isLoading}
            error={error}
          />
        )}

        {step === 'brain-dump' && (
          <BrainDumpScreen
            key="brain-dump"
            onStartRecording={() => setStep('recording')}
            onTextSubmit={handleTextSubmit}
          />
        )}

        {step === 'recording' && (
          <RecordingScreen key="recording" onComplete={handleRecordingComplete} />
        )}

        {step === 'processing' && <ProcessingScreen key="processing" />}

        {step === 'profile' && profile && scores && (
          <ProfileScreen
            key="profile"
            profile={profile}
            scores={scores}
            previousScores={previousScores}
            showScoreAnimation={showScoreAnimation}
            onAddMore={() => {
              setShowScoreAnimation(false);
              setStep('brain-dump');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({
  userName,
  onStart,
  isLoading,
  error,
}: {
  userName: string;
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-4xl md:text-5xl font-display text-white mb-6">
          Welcome, <span className="text-[#D4A84B]">{userName}</span>
        </h1>

        <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
          Let&apos;s build your Clarity Canvas — a living map of who you are, what you&apos;re
          building, and where you&apos;re headed.
        </p>

        <p className="text-zinc-500 mb-12">
          We&apos;ll start with a brain dump. Just talk freely about yourself, your work, and your
          goals. Our AI will extract and organize the insights.
        </p>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        <motion.button
          onClick={onStart}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-4 bg-[#D4A84B] text-black font-medium text-lg rounded-lg hover:bg-[#e0b55c] transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : "Let's Begin"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// Brain Dump Screen Component
function BrainDumpScreen({
  onStartRecording,
  onTextSubmit,
}: {
  onStartRecording: () => void;
  onTextSubmit: (text: string) => void;
}) {
  const [mode, setMode] = useState<'choose' | 'text'>('choose');
  const [textInput, setTextInput] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="max-w-2xl w-full text-center">
        <h2 className="text-3xl font-display text-white mb-4">Brain Dump</h2>
        <p className="text-zinc-400 mb-8">
          Share anything about yourself, your work, your company, and your goals. The more context
          you provide, the better we can understand you.
        </p>

        {mode === 'choose' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={onStartRecording}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              Record Voice
            </motion.button>

            <motion.button
              onClick={() => setMode('text')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Type Instead
            </motion.button>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Tell us about yourself, your role, your company, your goals..."
              className="w-full h-64 p-4 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-[#D4A84B]"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setMode('choose')}
                className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => onTextSubmit(textInput)}
                disabled={textInput.trim().length < 50}
                className="px-8 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
            <p className="text-sm text-zinc-500">
              {textInput.length < 50
                ? `${50 - textInput.length} more characters needed`
                : 'Ready to submit'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Recording Screen Component
function RecordingScreen({
  onComplete,
}: {
  onComplete: (audioBlob: Blob, duration: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="max-w-2xl w-full text-center">
        <h2 className="text-3xl font-display text-white mb-4">Recording</h2>
        <p className="text-zinc-400 mb-8">
          Speak naturally about yourself, your work, and your goals. Minimum 30 seconds.
        </p>

        <VoiceRecorder onRecordingComplete={onComplete} minDuration={30} maxDuration={120} />
      </div>
    </motion.div>
  );
}

// Processing Screen Component
function ProcessingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 border-4 border-[#D4A84B] border-t-transparent rounded-full mx-auto mb-6"
        />
        <h2 className="text-2xl font-display text-white mb-2">Processing</h2>
        <p className="text-zinc-400">Extracting insights from your brain dump...</p>
      </div>
    </motion.div>
  );
}

// Profile Screen Component
function ProfileScreen({
  profile,
  scores,
  previousScores,
  showScoreAnimation,
  onAddMore,
}: {
  profile: ProfileWithSections;
  scores: ProfileScores;
  previousScores: ProfileScores | null;
  showScoreAnimation: boolean;
  onAddMore: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-12 px-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display text-white mb-2">Your Clarity Canvas</h1>
          <p className="text-zinc-400">Keep adding context to improve your profile score</p>
        </div>

        {/* Profile Visualization */}
        <div className="mb-12">
          <ProfileVisualization
            profile={profile}
            scores={scores}
            previousScores={previousScores ?? undefined}
            showScoreAnimation={showScoreAnimation}
            onSectionClick={(sectionKey) => {
              console.log('Section clicked:', sectionKey);
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/clarity-canvas/interview">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
            >
              Answer Quick Questions
            </motion.button>
          </Link>

          <motion.button
            onClick={onAddMore}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Add More Context
          </motion.button>
        </div>

        {/* Modules CTA */}
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <Link href="/clarity-canvas/modules">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-[#D4A84B]/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-white font-medium">Explore Modules</p>
                  <p className="text-sm text-zinc-500">
                    Deepen specific aspects of your profile
                  </p>
                </div>
              </div>
              <span className="text-[#D4A84B]">→</span>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
