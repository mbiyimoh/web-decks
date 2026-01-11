'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonaDisplay } from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import type { PersonaInfo } from './types';
import { ValidationShareButton } from './ValidationShareButton';

interface Props {
  persona: PersonaDisplay;
  isLoading?: boolean;
  // Multi-persona dropdown props
  allPersonas?: PersonaInfo[];
  currentPersonaId?: string;
  onSwitchPersona?: (personaId: string) => void;
  showDropdown?: boolean;
  // Validation sharing props
  showValidationShare?: boolean;
}

export function PersonaCard({
  persona,
  isLoading,
  allPersonas,
  currentPersonaId,
  onSwitchPersona,
  showDropdown = false,
  showValidationShare = false,
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getClarityColor = (value: number) => {
    if (value >= 70) return '#4ADE80';
    if (value >= 40) return '#D4A84B';
    return '#FB923C';
  };

  const hasMultiplePersonas = allPersonas && allPersonas.length > 1 && showDropdown;
  const currentPersona = allPersonas?.find(p => p.id === currentPersonaId);
  const otherPersonas = allPersonas?.filter(p => p.id !== currentPersonaId) || [];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
      {/* Header with Dropdown */}
      <div className="text-center relative" ref={dropdownRef}>
        {hasMultiplePersonas ? (
          <>
            {/* Persona Dropdown Header */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group w-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <h3 className="text-2xl font-display text-white">
                {persona.archetype}
              </h3>
              <svg
                className={`w-5 h-5 text-zinc-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-4 right-4 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  {/* Current Persona (selected) */}
                  <div className="px-4 py-3 bg-[#D4A84B]/10 border-b border-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D4A84B] animate-pulse" />
                      <span className="text-sm font-medium text-white">
                        {currentPersona?.displayName || persona.archetype}
                      </span>
                      <span className="text-xs text-[#D4A84B] ml-auto">Current</span>
                    </div>
                  </div>

                  {/* Other Personas */}
                  {otherPersonas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSwitchPersona?.(p.id);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-zinc-700/50 transition-colors text-left"
                    >
                      {p.isComplete ? (
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
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                      )}
                      <span className="text-sm text-zinc-300">{p.displayName}</span>
                      {p.isComplete && (
                        <span className="text-xs text-green-400 ml-auto">Done</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <h3 className="text-2xl font-display text-white mb-1">
            {persona.archetype}
          </h3>
        )}

        {/* Summary - always show below header */}
        <p className="text-zinc-400 text-sm mt-1">{persona.summary}</p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-6 text-center">
        <div>
          <div
            className="text-3xl font-display"
            style={{ color: getClarityColor(persona.clarity.overall) }}
          >
            {persona.clarity.overall}%
          </div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            Clarity
          </p>
        </div>
        <div className="w-px h-10 bg-zinc-700" />
        <div>
          <div
            className="text-3xl font-display"
            style={{ color: getClarityColor(persona.avgConfidence) }}
          >
            {persona.avgConfidence}%
          </div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            Confidence
          </p>
        </div>
        {persona.unsureCount > 0 && (
          <>
            <div className="w-px h-10 bg-zinc-700" />
            <div>
              <div className="text-3xl font-display text-amber-500">
                {persona.unsureCount}
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">
                Unsure
              </p>
            </div>
          </>
        )}
      </div>

      {/* Category Bars */}
      <div className="space-y-3">
        <ClarityBar label="Identity" value={persona.clarity.identity} />
        <ClarityBar label="Goals" value={persona.clarity.goals} />
        <ClarityBar label="Frustrations" value={persona.clarity.frustrations} />
        <ClarityBar label="Emotional" value={persona.clarity.emotional} />
        <ClarityBar label="Behaviors" value={persona.clarity.behaviors} />
      </div>

      {/* Quote */}
      {persona.quote && (
        <div className="border-l-2 border-[#D4A84B] pl-4 py-2">
          <p className="text-zinc-300 italic">"{persona.quote}"</p>
        </div>
      )}

      {/* Jobs to be Done */}
      {(persona.jobs.functional ||
        persona.jobs.emotional ||
        persona.jobs.social) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Jobs to be Done
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {persona.jobs.functional && (
              <JobCard
                type="Functional"
                value={persona.jobs.functional}
                icon="⚙️"
              />
            )}
            {persona.jobs.emotional && (
              <JobCard
                type="Emotional"
                value={formatEmotional(persona.jobs.emotional)}
                icon="❤️"
              />
            )}
            {persona.jobs.social && (
              <JobCard
                type="Social"
                value={formatSocial(persona.jobs.social)}
                icon="👥"
              />
            )}
          </div>
        </div>
      )}

      {/* Anti-patterns */}
      {persona.antiPatterns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Not Your Customer
          </h4>
          <div className="flex flex-wrap gap-2">
            {persona.antiPatterns.map((pattern) => (
              <span
                key={pattern}
                className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded"
              >
                {formatAntiPattern(pattern)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Validation Share Button */}
      {showValidationShare && persona.id && (
        <div className="pt-4 border-t border-zinc-800">
          <ValidationShareButton
            personaId={persona.id}
            personaName={persona.archetype}
          />
        </div>
      )}
    </div>
  );
}

function ClarityBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-green-500';
    if (v >= 40) return 'bg-[#D4A84B]';
    if (v > 0) return 'bg-orange-500';
    return 'bg-zinc-700';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-400 w-24">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-sm text-zinc-500 w-10 text-right">{value}%</span>
    </div>
  );
}

function JobCard({
  type,
  value,
  icon,
}: {
  type: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-xs text-zinc-500 mt-1">{type}</p>
      <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{value}</p>
    </div>
  );
}

function formatEmotional(value: string): string {
  const map: Record<string, string> = {
    'in-control': 'Feel in control',
    accomplished: 'Feel accomplished',
    'cared-for': 'Feel cared for',
    free: 'Feel free',
  };
  return map[value] || value;
}

function formatSocial(value: string): string {
  const map: Record<string, string> = {
    competent: 'Look competent',
    aspirational: 'Be aspirational',
    relatable: 'Be relatable',
    innovative: 'Be innovative',
  };
  return map[value] || value;
}

function formatAntiPattern(value: string): string {
  const map: Record<string, string> = {
    'price-sensitive': 'Price-focused only',
    experts: 'Already experts',
    'no-problem': 'No problem',
    'no-change': 'Resistant to change',
    'wrong-platform': 'Wrong platform',
    'wrong-stage': 'Wrong life stage',
  };
  return map[value] || value;
}
