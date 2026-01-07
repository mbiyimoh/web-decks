'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { PersonaInfo } from './types';

interface PersonaSwitcherProps {
  personas: PersonaInfo[];
  currentPersonaId: string;
  onSwitchPersona: (personaId: string) => void;
  className?: string;
}

export function PersonaSwitcher({
  personas,
  currentPersonaId,
  onSwitchPersona,
  className = '',
}: PersonaSwitcherProps) {
  const completedCount = personas.filter((p) => p.isComplete).length;
  const totalCount = personas.length;

  if (personas.length <= 1) {
    return null;
  }

  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 ${className}`}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">
          Personas
        </span>
        <span className="text-xs text-zinc-400">
          {completedCount}/{totalCount} complete
        </span>
      </div>

      {/* Persona tabs */}
      <div className="flex gap-2">
        {personas.map((persona) => {
          const isActive = persona.id === currentPersonaId;
          const isComplete = persona.isComplete;

          return (
            <motion.button
              key={persona.id}
              onClick={() => onSwitchPersona(persona.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-[#D4A84B]/20 text-[#D4A84B] border border-[#D4A84B]/50'
                    : isComplete
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                {/* Status icon */}
                {isComplete ? (
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-[#D4A84B] animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                )}

                {/* Persona name - truncate if too long */}
                <span className="truncate max-w-[100px]">
                  {persona.displayName}
                </span>
              </div>

              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="activePersonaIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A84B] rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
