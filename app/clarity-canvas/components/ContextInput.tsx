'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExtractOnlyResponse } from '@/lib/clarity-canvas/types';
import { PROFILE_STRUCTURE } from '@/lib/clarity-canvas/profile-structure';
import { VoiceRecorder } from './VoiceRecorder';

type InputStep = 'choose' | 'text' | 'recording' | 'uploading' | 'processing';

interface ContextInputProps {
  scope: {
    section: string;
    subsection?: string;
  };
  onExtracted: (result: ExtractOnlyResponse) => void;
  onCancel: () => void;
  minVoiceDuration?: number;
}

export function ContextInput({
  scope,
  onExtracted,
  onCancel,
  minVoiceDuration,
}: ContextInputProps) {
  const [step, setStep] = useState<InputStep>('choose');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingPhase, setProcessingPhase] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get context-aware labels
  const isPillarGlobal = !scope.subsection;
  const sectionData = PROFILE_STRUCTURE[scope.section as keyof typeof PROFILE_STRUCTURE];

  // Type-safe subsection access - use unknown with type guards
  let subsectionName = scope.subsection;
  if (scope.subsection && sectionData) {
    const subsections = sectionData.subsections as unknown as Record<string, { name: string }>;
    const subsection = subsections[scope.subsection];
    if (subsection && typeof subsection === 'object' && 'name' in subsection) {
      subsectionName = subsection.name;
    }
  }

  const contextLabel = isPillarGlobal
    ? `Add context to ${sectionData?.name || scope.section}`
    : `Add context for ${subsectionName || scope.subsection}`;

  const placeholder = isPillarGlobal
    ? `Share more about your ${sectionData?.name?.toLowerCase() || scope.section}...`
    : `Tell us about your ${subsectionName?.toLowerCase() || scope.subsection}...`;

  const defaultMinVoiceDuration = isPillarGlobal ? 20 : 10;
  const actualMinVoiceDuration = minVoiceDuration ?? defaultMinVoiceDuration;

  // Handle text submission
  const handleTextSubmit = async () => {
    if (textInput.trim().length < 50) {
      setError('Please provide at least 50 characters');
      return;
    }

    setError(null);
    setStep('processing');
    setProcessingPhase('Extracting insights...');

    try {
      const response = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textInput,
          sourceType: 'TEXT',
          scope,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract information');
      }

      const result = await response.json();
      onExtracted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text input');
      setStep('text');
    }
  };

  // Handle voice recording completion
  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setStep('processing');
    setProcessingPhase('Transcribing audio...');

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/clarity-canvas/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const { transcript } = await transcribeResponse.json();

      // Step 2: Extract information
      setProcessingPhase('Extracting insights...');

      const extractResponse = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          sourceType: 'VOICE',
          scope,
        }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract information');
      }

      const result = await extractResponse.json();
      onExtracted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process recording');
      setStep('choose');
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext)) {
      setError('Unsupported file type. Please upload .txt, .md, .pdf, .doc, or .docx');
      return;
    }

    // Validate file size
    const maxSize = ['pdf', 'doc', 'docx'].includes(ext) ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setStep('processing');
    setProcessingPhase('Reading file...');

    try {
      // Step 1: Upload and extract text
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/clarity-canvas/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const { text, wasTruncated } = await uploadResponse.json();

      // Step 2: Extract information
      setProcessingPhase('Extracting insights...');

      const extractResponse = await fetch('/api/clarity-canvas/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          sourceType: 'TEXT',
          scope,
        }),
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'Failed to extract information');
      }

      const result = await extractResponse.json();

      // Add warning if file was truncated
      if (wasTruncated) {
        console.warn('File was truncated to 50,000 characters');
      }

      onExtracted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      setStep('uploading');
    }
  };

  // Reset to choose mode
  const handleBack = () => {
    setStep('choose');
    setTextInput('');
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* Choose Input Method */}
        {step === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl text-white font-display mb-2">{contextLabel}</h2>
              <p className="text-zinc-400">Choose how you'd like to add context</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Button */}
              <button
                onClick={() => setStep('text')}
                className="p-6 bg-[#111114] border border-zinc-800 rounded-lg hover:border-[#d4a54a] transition-all group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  ⌨️
                </div>
                <h3 className="text-white font-medium mb-1">Type</h3>
                <p className="text-sm text-zinc-500">Write your thoughts</p>
              </button>

              {/* Speak Button */}
              <button
                onClick={() => setStep('recording')}
                className="p-6 bg-[#111114] border border-zinc-800 rounded-lg hover:border-[#d4a54a] transition-all group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  🎤
                </div>
                <h3 className="text-white font-medium mb-1">Speak</h3>
                <p className="text-sm text-zinc-500">Record a voice memo</p>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => setStep('uploading')}
                className="p-6 bg-[#111114] border border-zinc-800 rounded-lg hover:border-[#d4a54a] transition-all group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  📄
                </div>
                <h3 className="text-white font-medium mb-1">Upload File</h3>
                <p className="text-sm text-zinc-500">Upload a document</p>
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={onCancel}
                className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Text Input Mode */}
        {step === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl text-white font-display mb-2">{contextLabel}</h2>
              <p className="text-zinc-400">Share your thoughts (minimum 50 characters)</p>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={placeholder}
              className="w-full h-64 p-4 bg-[#111114] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-[#d4a54a] focus:outline-none resize-none"
              autoFocus
            />

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                {textInput.length} / 50 characters minimum
              </span>
              <span
                className={`text-sm ${textInput.length >= 50 ? 'text-green-400' : 'text-zinc-500'}`}
              >
                {textInput.length >= 50 ? '✓ Ready' : 'Keep typing...'}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleTextSubmit}
                disabled={textInput.length < 50}
                className="flex-1 px-6 py-3 bg-[#d4a54a] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </motion.div>
        )}

        {/* Voice Recording Mode */}
        {step === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl text-white font-display mb-2">{contextLabel}</h2>
              <p className="text-zinc-400">
                Record at least {actualMinVoiceDuration} seconds
              </p>
            </div>

            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              minDuration={actualMinVoiceDuration}
              maxDuration={120}
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleBack}
                className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* File Upload Mode */}
        {step === 'uploading' && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl text-white font-display mb-2">{contextLabel}</h2>
              <p className="text-zinc-400">Upload a document (.txt, .md, .pdf, .doc, .docx)</p>
            </div>

            <div className="border-2 border-dashed border-zinc-800 rounded-lg p-12 text-center hover:border-[#d4a54a] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div>
                  <div className="text-6xl mb-4">📁</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-[#d4a54a] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors"
                  >
                    Choose File
                  </button>
                  <p className="text-sm text-zinc-500 mt-4">
                    Max 5MB for .pdf/.doc/.docx, 1MB for .txt/.md
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">✓</div>
                  <p className="text-white font-medium mb-2">{selectedFile.name}</p>
                  <p className="text-sm text-zinc-500 mb-4">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Choose different file
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile}
                className="flex-1 px-6 py-3 bg-[#d4a54a] text-black font-medium rounded-lg hover:bg-[#e0b55c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload & Process
              </button>
            </div>
          </motion.div>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-16 text-center"
          >
            {/* Animated loader (matching ProcessingStep style) */}
            <div className="mb-12">
              <div className="relative w-32 h-32 mx-auto">
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-[#d4a54a]/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                {/* Middle ring */}
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-[#d4a54a]/50"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3,
                  }}
                />
                {/* Inner circle */}
                <motion.div
                  className="absolute inset-8 rounded-full bg-[#d4a54a]/20 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <svg
                    className="w-8 h-8 text-[#d4a54a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </motion.div>
              </div>
            </div>

            <p className="text-xl text-white mb-4">{processingPhase}</p>
            <p className="text-sm text-zinc-500">This may take a moment...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
