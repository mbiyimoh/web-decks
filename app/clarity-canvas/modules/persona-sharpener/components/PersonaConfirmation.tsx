'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtractedPersona {
  id: string;
  displayName: string;
  confidence: number;
  questionCount: number;
  estimatedMinutes: number;
}

interface PersonaConfirmationProps {
  personas: ExtractedPersona[];
  suggestedStartPersonaId: string;
  productDescription: string;
  onStartPersona: (personaId: string) => void;
  onAddManualPersona?: () => void;
  onBack?: () => void;
}

function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (confidence >= 0.7) {
    return {
      label: 'High confidence',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    };
  }
  if (confidence >= 0.4) {
    return {
      label: 'Medium confidence',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    };
  }
  return {
    label: 'Low confidence',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
  };
}

export function PersonaConfirmation({
  personas,
  suggestedStartPersonaId,
  productDescription,
  onStartPersona,
  onAddManualPersona,
  onBack,
}: PersonaConfirmationProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    suggestedStartPersonaId
  );
  const [showAllPersonas, setShowAllPersonas] = useState(personas.length <= 2);

  const suggestedPersona = personas.find((p) => p.id === suggestedStartPersonaId);

  const handleStart = () => {
    if (selectedPersonaId) {
      onStartPersona(selectedPersonaId);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A84B]/20 rounded-full text-[#D4A84B] text-sm mb-4">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Analysis complete
        </div>
        <h1 className="text-3xl md:text-4xl font-display text-white mb-3">
          We identified {personas.length} persona{personas.length !== 1 ? 's' : ''}
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          Based on your description of {productDescription.slice(0, 100)}
          {productDescription.length > 100 ? '...' : ''}
        </p>
      </motion.div>

      {/* Persona Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 mb-8"
      >
        <AnimatePresence>
          {(showAllPersonas ? personas : personas.slice(0, 2)).map(
            (persona, index) => {
              const confidence = getConfidenceLevel(persona.confidence);
              const isSelected = selectedPersonaId === persona.id;
              const isSuggested = persona.id === suggestedStartPersonaId;

              return (
                <motion.button
                  key={persona.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`
                    w-full text-left p-5 rounded-xl border-2 transition-all
                    ${
                      isSelected
                        ? 'border-[#D4A84B] bg-[#D4A84B]/10'
                        : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Persona Name */}
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            isSelected ? 'bg-[#D4A84B]/20' : 'bg-zinc-700/50'
                          }`}
                        >
                          👤
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {persona.displayName}
                          </h3>
                          {isSuggested && (
                            <span className="text-xs text-[#D4A84B]">
                              Recommended to start
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {/* Confidence Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${confidence.bgColor} ${confidence.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              persona.confidence >= 0.7
                                ? 'bg-green-400'
                                : persona.confidence >= 0.4
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                            }`}
                          />
                          {confidence.label}
                        </span>

                        {/* Question Count */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-700/50 text-zinc-300">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {persona.questionCount} questions
                        </span>

                        {/* Time Estimate */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-zinc-700/50 text-zinc-300">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          ~{persona.estimatedMinutes} min
                        </span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#D4A84B] bg-[#D4A84B]'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            }
          )}
        </AnimatePresence>

        {/* Show More Button */}
        {personas.length > 2 && !showAllPersonas && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowAllPersonas(true)}
            className="text-zinc-400 hover:text-white text-sm py-2 transition-colors"
          >
            Show {personas.length - 2} more persona
            {personas.length - 2 !== 1 ? 's' : ''}
          </motion.button>
        )}
      </motion.div>

      {/* Suggestion Text */}
      {suggestedPersona && selectedPersonaId === suggestedStartPersonaId && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-zinc-400 text-sm mb-6"
        >
          We suggest starting with &ldquo;{suggestedPersona.displayName}&rdquo; — we
          captured the most detail about them from your description.
        </motion.p>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <button
          onClick={handleStart}
          disabled={!selectedPersonaId}
          className={`w-full py-4 rounded-xl font-medium transition-all ${
            selectedPersonaId
              ? 'bg-[#D4A84B] text-black hover:bg-[#e0b55c]'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {selectedPersonaId
            ? `Start with ${personas.find((p) => p.id === selectedPersonaId)?.displayName}`
            : 'Select a persona to continue'}
        </button>

        {/* Secondary Actions */}
        <div className="flex justify-center gap-6 text-sm">
          {onAddManualPersona && (
            <button
              onClick={onAddManualPersona}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              + Add another persona
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Re-record brain dump
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
