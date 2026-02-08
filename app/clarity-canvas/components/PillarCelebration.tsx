'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import type { CelebrationData } from '@/lib/clarity-canvas/types';

type CelebrationPhase = 'initial' | 'score-animating' | 'score-complete' | 'summary' | 'complete';

interface PillarCelebrationProps {
  data: CelebrationData;
  onDismiss: () => void;
}

export default function PillarCelebration({ data, onDismiss }: PillarCelebrationProps) {
  const [phase, setPhase] = useState<CelebrationPhase>('initial');
  const [displayScore, setDisplayScore] = useState(data.previousScore);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Derived visibility
  const showScoreBar = phase !== 'initial';
  const showDelta = ['score-complete', 'summary', 'complete'].includes(phase);
  const showSummary = ['summary', 'complete'].includes(phase);
  const showCTA = phase === 'complete';

  // Spring animation for score bar fill
  const springValue = useSpring(data.previousScore, { stiffness: 50, damping: 20 });
  const width = useTransform(springValue, [0, 100], ['0%', '100%']);

  // Get gradient color based on score value
  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'from-green-500 to-green-600';
    if (score >= 50) return 'from-amber-500 to-amber-600';
    if (score >= 25) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  // Number ticker animation with RAF
  useEffect(() => {
    if (phase !== 'score-animating' && phase !== 'score-complete') return;

    const duration = 1500; // ms
    const startScore = data.previousScore;
    const targetScore = data.newScore;
    const delta = targetScore - startScore;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out quadratic
      const eased = 1 - Math.pow(1 - progress, 2);
      const currentScore = startScore + delta * eased;

      setDisplayScore(Math.round(currentScore));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        startTimeRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, data.previousScore, data.newScore]);

  // Play C major chord chime
  const playScoreComplete = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C major chord (C5, E5, G5)

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gainNode.gain.setValueAtTime(0.15, now + i * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.0);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(now + i * 0.08);
        oscillator.stop(now + i * 0.08 + 1.0);
      });
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  // Timeline state machine
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPhase('score-animating'), 300));
    timers.push(setTimeout(() => {
      setPhase('score-complete');
      playScoreComplete();
    }, 1800));
    timers.push(setTimeout(() => setPhase('summary'), 2100));
    timers.push(setTimeout(() => setPhase('complete'), 2600));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Trigger spring animation when phase changes
  useEffect(() => {
    if (phase !== 'initial') {
      springValue.set(data.newScore);
    }
  }, [phase, data.newScore, springValue]);

  const scoreDelta = data.newScore - data.previousScore;
  const isPositive = scoreDelta >= 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center justify-center space-y-8 px-8 max-w-2xl w-full">
          {/* Pillar Icon & Name */}
          <motion.div
            className="flex flex-col items-center space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="text-6xl mb-2">{data.pillarIcon}</div>
            <h2 className="text-3xl font-display text-[#f5f5f5]">
              {data.pillarName} <span className="text-[#d4a54a]">Clarity</span>
            </h2>
          </motion.div>

          {/* Score Bar */}
          {showScoreBar && (
            <motion.div
              className="w-full space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <motion.div
                  className="text-5xl font-display text-[#f5f5f5] tabular-nums"
                  key={displayScore}
                >
                  {displayScore}%
                </motion.div>

                {/* Delta Badge */}
                <AnimatePresence>
                  {showDelta && (
                    <motion.div
                      className={`px-4 py-2 rounded-full text-xl font-mono font-semibold ${
                        isPositive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isPositive ? '+' : ''}{scoreDelta}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-6 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getScoreColor(data.newScore)} rounded-full`}
                  style={{ width }}
                />
              </div>
            </motion.div>
          )}

          {/* Update Summary */}
          <AnimatePresence>
            {showSummary && (
              <motion.div
                className="flex flex-col items-center space-y-2 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-xl text-[#f5f5f5] font-body">
                  <span className="font-semibold">{data.fieldsUpdated}</span> field{data.fieldsUpdated !== 1 ? 's' : ''} updated in{' '}
                  <span className="text-[#d4a54a]">{data.pillarName}</span>
                </p>
                <p className="text-lg text-[#888888] font-mono">
                  <span className={data.previousScore < 50 ? 'text-orange-400' : 'text-amber-400'}>
                    {data.previousScore}%
                  </span>
                  {' → '}
                  <span className={data.newScore >= 75 ? 'text-green-400' : data.newScore >= 50 ? 'text-amber-400' : 'text-orange-400'}>
                    {data.newScore}%
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <AnimatePresence>
            {showCTA && (
              <motion.button
                onClick={onDismiss}
                className="px-8 py-4 bg-[#d4a54a] text-black font-body font-semibold text-lg rounded-lg hover:bg-[#e5b55b] transition-colors duration-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue Exploring
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
