'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  minDuration?: number; // seconds
  maxDuration?: number; // seconds
}

export function VoiceRecorder({
  onRecordingComplete,
  minDuration = 30,
  maxDuration = 120,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const durationRef = useRef(0);

  const canStop = duration >= minDuration;

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];
      durationRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, durationRef.current);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);
      setError(null);

      // Start duration timer
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => {
          const newDuration = d + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return d;
          }
          return newDuration;
        });
      }, 1000);

      // Start audio level analysis
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
      console.error('Recording error:', err);
    }
  }, [maxDuration, onRecordingComplete, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Recording button */}
      <motion.button
        onClick={isRecording ? (canStop ? stopRecording : undefined) : startRecording}
        disabled={isRecording && !canStop}
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#D4A84B] hover:bg-[#e0b55c]'}
          ${isRecording && !canStop ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {isRecording ? (
          <div className="w-8 h-8 bg-white rounded-sm" />
        ) : (
          <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </motion.button>

      {/* Waveform visualization */}
      {isRecording && (
        <div className="flex items-center gap-1 h-16">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-[#D4A84B] rounded-full"
              animate={{
                height: `${20 + audioLevel * 40 * Math.sin((i + Date.now() / 100) * 0.5)}px`,
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      )}

      {/* Timer */}
      <div className="text-center">
        <p className="text-2xl font-mono text-white">
          {formatTime(duration)} / {formatTime(minDuration)}
        </p>
        {isRecording && !canStop && (
          <p className="text-sm text-zinc-400 mt-2">Minimum {minDuration} seconds required</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#D4A84B]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((duration / minDuration) * 100, 100)}%` }}
        />
      </div>

      {/* Done button */}
      {isRecording && canStop && (
        <motion.button
          onClick={stopRecording}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 py-3 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
        >
          Done Recording
        </motion.button>
      )}
    </div>
  );
}
