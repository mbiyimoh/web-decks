'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createEmptyPersonaDisplay } from '@/lib/clarity-canvas/modules/persona-sharpener/scoring';
import type {
  PersonaDisplay,
  BrainDumpProject,
} from '@/lib/clarity-canvas/modules/persona-sharpener/types';
import { BrainDumpStep } from './components/BrainDumpStep';
import { ProcessingStep } from './components/ProcessingStep';
import { PersonaConfirmation } from './components/PersonaConfirmation';

type Step =
  | 'welcome'
  | 'brain-dump'
  | 'processing'
  | 'confirmation';

interface User {
  id?: string;
  name?: string | null;
}

interface Props {
  user: User;
}

interface ExtractedPersonaInfo {
  id: string;
  displayName: string;
  confidence: number;
  questionCount: number;
  estimatedMinutes: number;
  isComplete?: boolean;
}

interface BrainDumpResult {
  brainDumpId: string;
  personas: ExtractedPersonaInfo[];
  overallContext: {
    productDescription: string;
    marketContext: string | null;
  };
  suggestedStartPersonaId: string;
}

export function PersonaSharpenerClient({ user }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [persona, setPersona] = useState<PersonaDisplay | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Brain dump state
  const [profileId, setProfileId] = useState<string | null>(null);
  const [brainDumpResult, setBrainDumpResult] = useState<BrainDumpResult | null>(
    null
  );
  const [brainDumpInputType, setBrainDumpInputType] = useState<'voice' | 'text'>(
    'text'
  );

  // Brain dump projects state (from API)
  const [brainDumpProjects, setBrainDumpProjects] = useState<BrainDumpProject[]>([]);
  const [activeProject, setActiveProject] = useState<BrainDumpProject | null>(null);
  const [hasCompletedPersonas, setHasCompletedPersonas] = useState(false);

  // Delete confirmation state - use Set for per-project tracking to avoid race conditions
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Check for incomplete session and get profile on mount
  useEffect(() => {
    async function checkForIncompleteSession() {
      try {
        const response = await fetch(
          '/api/clarity-canvas/modules/persona-sharpener/personas'
        );
        if (response.ok) {
          const data = await response.json();

          // Store brain dump projects info
          if (data.brainDumpProjects) {
            setBrainDumpProjects(data.brainDumpProjects);
          }
          if (data.activeProject) {
            setActiveProject(data.activeProject);
          }
          if (data.hasCompletedPersonas) {
            setHasCompletedPersonas(true);
          }

          // Show resume dialog if there are existing projects
          if (data.hasProjects && data.activeProject) {
            const personas = data.activeProject.personas || [];
            const hasIncomplete = personas.some(
              (p: BrainDumpProject['personas'][0]) => !p.hasCompletedSession
            );

            if (hasIncomplete) {
              setShowResumeDialog(true);
              // Resume with first incomplete persona, not just first persona
              const firstIncomplete = personas.find(
                (p: BrainDumpProject['personas'][0]) => !p.hasCompletedSession
              );
              if (firstIncomplete) {
                setPersonaId(firstIncomplete.id);
              }
            } else if (data.hasCompletedPersonas) {
              // Has completed work but nothing incomplete - still show to let user continue or start fresh
              setShowResumeDialog(true);
              // Set to first persona (all are complete)
              if (personas[0]) {
                setPersonaId(personas[0].id);
              }
            }
          }
        }

        // Get profile ID
        const profileResponse = await fetch('/api/clarity-canvas/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfileId(profileData.profile?.id || null);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    checkForIncompleteSession();
  }, []);

  // Handle brain dump submission
  const handleBrainDumpComplete = async (data: {
    inputType: 'voice' | 'text';
    transcript: string;
    audioBlob?: Blob;
    durationSeconds?: number;
  }) => {
    setStep('processing');
    setBrainDumpInputType(data.inputType);
    setError(null);

    try {
      // Ensure we have a profile
      let currentProfileId = profileId;
      if (!currentProfileId) {
        const profileResponse = await fetch('/api/clarity-canvas/profile', {
          method: 'POST',
        });
        if (!profileResponse.ok) {
          throw new Error('Failed to create profile');
        }
        const profileData = await profileResponse.json();
        currentProfileId = profileData.profile.id;
        setProfileId(currentProfileId);
      }

      // TODO: If voice, upload audio to storage first
      // For now, we just use the transcript

      // Call brain dump API
      const response = await fetch(
        '/api/clarity-canvas/modules/persona-sharpener/brain-dump',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId: currentProfileId,
            inputType: data.inputType,
            transcript: data.transcript,
            durationSeconds: data.durationSeconds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process brain dump');
      }

      const result = await response.json();
      setBrainDumpResult(result);
      setStep('confirmation');
    } catch (err) {
      console.error('Brain dump processing error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to process brain dump'
      );
      setStep('brain-dump');
    }
  };

  // Handle persona selection from confirmation
  const handleStartPersona = async (selectedPersonaId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      setPersonaId(selectedPersonaId);

      // Fetch full persona data with extracted information from brain dump
      try {
        const personaResponse = await fetch(
          `/api/clarity-canvas/modules/persona-sharpener/personas/${selectedPersonaId}`
        );

        if (!personaResponse.ok) {
          const errorData = await personaResponse.json().catch(() => ({}));
          console.error('Failed to fetch persona:', errorData);

          if (personaResponse.status === 404) {
            throw new Error('Persona not found. Please refresh and try again.');
          } else if (personaResponse.status === 403) {
            throw new Error('You do not have access to this persona.');
          }
          // For other errors, fall through to fallback
        }

        if (personaResponse.ok) {
          const { persona: fullPersona } = await personaResponse.json();
          if (fullPersona) {
            setPersona(fullPersona);
          } else {
            throw new Error('Invalid persona data received.');
          }
        } else {
          // Fallback with warning
          console.warn('Falling back to empty persona display');
          const selectedPersona = brainDumpResult?.personas.find(
            (p) => p.id === selectedPersonaId
          );
          setPersona(
            createEmptyPersonaDisplay(selectedPersonaId, selectedPersona?.displayName)
          );
        }
      } catch (fetchError) {
        // Re-throw critical errors (404, 403), but continue with fallback for others
        if (fetchError instanceof Error &&
            (fetchError.message.includes('not found') || fetchError.message.includes('access'))) {
          throw fetchError;
        }
        console.error('Error fetching persona, using fallback:', fetchError);
        const selectedPersona = brainDumpResult?.personas.find(
          (p) => p.id === selectedPersonaId
        );
        setPersona(
          createEmptyPersonaDisplay(selectedPersonaId, selectedPersona?.displayName)
        );
      }

      // Create session
      const sessionResponse = await fetch(
        '/api/clarity-canvas/modules/persona-sharpener/sessions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId: selectedPersonaId }),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const { session } = await sessionResponse.json();

      // Navigate to the session URL - the session page handles the questionnaire
      router.push(`/clarity-canvas/modules/persona-sharpener/${session.id}`);
    } catch (err) {
      console.error('Error starting persona:', err);
      setError('Failed to start. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resume existing persona from active project
  const handleLegacyStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Find the first incomplete persona from active project
      const incompletePersona = activeProject?.personas.find(
        (p) => !p.hasCompletedSession
      );

      if (!incompletePersona) {
        // All personas complete - go to first one to view
        const firstPersona = activeProject?.personas[0];
        if (firstPersona?.completedSessionId) {
          router.push(`/clarity-canvas/modules/persona-sharpener/${firstPersona.completedSessionId}`);
          return;
        }
        throw new Error('No personas found to resume');
      }

      // If persona already has an in-progress session, navigate directly to it
      if (incompletePersona.inProgressSessionId) {
        router.push(`/clarity-canvas/modules/persona-sharpener/${incompletePersona.inProgressSessionId}`);
        return;
      }

      // Otherwise, create a new session for this existing persona
      const sessionResponse = await fetch(
        '/api/clarity-canvas/modules/persona-sharpener/sessions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personaId: incompletePersona.id }),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const { session } = await sessionResponse.json();

      // Navigate to the session URL
      router.push(`/clarity-canvas/modules/persona-sharpener/${session.id}`);
    } catch (err) {
      console.error('Error resuming sharpener:', err);
      setError('Failed to resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a brain dump project and all associated data
  const handleDeleteProject = async (brainDumpId: string) => {
    setDeletingIds((prev) => new Set(prev).add(brainDumpId));
    setError(null);

    try {
      const response = await fetch(
        `/api/clarity-canvas/modules/persona-sharpener/brain-dump/${brainDumpId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      // Remove from local state
      setBrainDumpProjects((prev) => prev.filter((p) => p.id !== brainDumpId));

      // Clear active project if it was deleted
      if (activeProject?.id === brainDumpId) {
        setActiveProject(null);
      }

      // Reset delete confirmation
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(brainDumpId);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <WelcomeScreen
            key="welcome"
            onStart={() => setStep('brain-dump')}
            isLoading={isLoading || isCheckingSession}
            error={error}
            showResumeDialog={showResumeDialog}
            onResume={handleLegacyStart}
            onStartFresh={() => {
              setShowResumeDialog(false);
              setStep('brain-dump');
            }}
            activeProject={activeProject}
            hasCompletedPersonas={hasCompletedPersonas}
            brainDumpProjects={brainDumpProjects}
            deleteConfirmId={deleteConfirmId}
            isDeleting={deletingIds.size > 0}
            onRequestDelete={(id) => setDeleteConfirmId(id)}
            onCancelDelete={() => setDeleteConfirmId(null)}
            onConfirmDelete={handleDeleteProject}
          />
        )}

        {step === 'brain-dump' && (
          <motion.div
            key="brain-dump"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BrainDumpStep
              onComplete={handleBrainDumpComplete}
              onBack={() => setStep('welcome')}
              externalError={error}
            />
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProcessingStep inputType={brainDumpInputType} />
          </motion.div>
        )}

        {step === 'confirmation' && brainDumpResult && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PersonaConfirmation
              personas={brainDumpResult.personas}
              suggestedStartPersonaId={brainDumpResult.suggestedStartPersonaId}
              productDescription={
                brainDumpResult.overallContext.productDescription
              }
              onStartPersona={handleStartPersona}
              onBack={() => setStep('brain-dump')}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// Welcome Screen
function WelcomeScreen({
  onStart,
  isLoading,
  error,
  showResumeDialog,
  onResume,
  onStartFresh,
  activeProject,
  hasCompletedPersonas,
  brainDumpProjects,
  deleteConfirmId,
  isDeleting,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
  showResumeDialog?: boolean;
  onResume?: () => void;
  onStartFresh?: () => void;
  activeProject?: BrainDumpProject | null;
  hasCompletedPersonas?: boolean;
  brainDumpProjects?: BrainDumpProject[];
  deleteConfirmId?: string | null;
  isDeleting?: boolean;
  onRequestDelete?: (id: string) => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-6 py-12"
    >
      <div className="max-w-xl text-center">
        {/* Header section - always on top */}
        <span className="text-6xl mb-6 block">👤</span>
        <h1 className="text-4xl font-display text-white mb-4">
          Persona Sharpener
        </h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Tell us about your ideal customers and we'll help you build detailed
          personas. Start with a quick brain dump, then answer targeted questions
          to fill in the gaps.
        </p>

        {/* Brain Dump Projects - Show ALL projects as tiles */}
        {brainDumpProjects && brainDumpProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            <h2 className="text-lg font-medium text-zinc-300 mb-3">
              Your Persona Projects
            </h2>

            {brainDumpProjects.map((project) => {
              const isComplete = project.completedPersonaCount === project.personaCount;
              const isConfirmingDelete = deleteConfirmId === project.id;

              return (
                <div
                  key={project.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isConfirmingDelete
                      ? 'bg-red-500/10 border-red-500/30'
                      : isComplete
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-zinc-900/50 border-zinc-700/50'
                  }`}
                >
                  {/* Delete confirmation */}
                  {isConfirmingDelete ? (
                    <div className="text-center py-2">
                      <p className="text-zinc-300 mb-3">
                        Delete this project and all {project.personaCount} persona{project.personaCount !== 1 ? 's' : ''}?
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={onCancelDelete}
                          disabled={isDeleting}
                          className="px-4 py-2 text-sm rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => onConfirmDelete?.(project.id)}
                          disabled={isDeleting}
                          className="px-4 py-2 text-sm rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isDeleting ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Project header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isComplete ? (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span className={`font-medium ${isComplete ? 'text-green-300' : 'text-zinc-200'}`}>
                            {project.personaCount} Persona{project.personaCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">
                            {project.completedPersonaCount}/{project.personaCount} complete
                          </span>
                          {/* Delete button */}
                          <button
                            onClick={() => onRequestDelete?.(project.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                  {/* Personas list */}
                  <div className="space-y-2">
                    {project.personas.map((p) => {
                      const sessionId = p.inProgressSessionId || p.completedSessionId;
                      const hasSession = !!sessionId;

                      return hasSession ? (
                        <Link
                          key={p.id}
                          href={`/clarity-canvas/modules/persona-sharpener/${sessionId}`}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                            p.isComplete
                              ? 'bg-green-500/20 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50'
                          }`}
                        >
                          <span className={p.isComplete ? 'text-green-300' : 'text-zinc-300'}>
                            {p.name || 'Persona'}
                          </span>
                          {p.isComplete ? (
                            <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              View
                            </span>
                          ) : (
                            <span className="text-amber-400 text-sm font-medium">Resume →</span>
                          )}
                        </Link>
                      ) : (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
                            p.isComplete
                              ? 'bg-green-500/20 border border-green-500/30'
                              : 'bg-zinc-800/50 border border-zinc-700/50'
                          }`}
                        >
                          <span className={p.isComplete ? 'text-green-300' : 'text-zinc-300'}>
                            {p.name || 'Persona'}
                          </span>
                          <span className="text-zinc-500 text-sm">Not started</span>
                        </div>
                      );
                    })}
                  </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Start fresh button below all projects */}
            <button
              onClick={onStartFresh}
              className="w-full px-4 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Persona Project
            </button>
          </motion.div>
        )}

        {/* How it works section - only show if no existing projects */}
        {(!brainDumpProjects || brainDumpProjects.length === 0) && (
          <div className="space-y-4 text-left bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-[#D4A84B]">✓</span>
              <p className="text-zinc-300">
                <strong className="text-white">30-second brain dump</strong> —
                describe who you're building for
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#D4A84B]">✓</span>
              <p className="text-zinc-300">
                <strong className="text-white">AI-powered extraction</strong> —
                we'll identify 1-3 personas
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#D4A84B]">✓</span>
              <p className="text-zinc-300">
                <strong className="text-white">Smart questions</strong> — only ask
                what we don't already know
              </p>
            </div>
          </div>
        )}

        {/* Session management tip */}
        {(brainDumpProjects?.length || 0) > 0 && (
          <div className="text-xs text-zinc-500 bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 mb-6">
            <span className="text-zinc-400">Tip:</span> Keep one session per
            persona group. Create separate sessions for different audiences (e.g.,
            customers vs. advisors).
          </div>
        )}

        {error && (
          <div className="text-red-400 bg-red-400/10 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Only show Get Started button when no projects exist */}
        {(!brainDumpProjects || brainDumpProjects.length === 0) && (
          <motion.button
            onClick={onStart}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-[#D4A84B] text-black font-medium rounded-lg hover:bg-[#e0b55c] disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              'Get Started →'
            )}
          </motion.button>
        )}

        <Link
          href="/clarity-canvas/modules"
          className="block mt-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to Modules
        </Link>
      </div>
    </motion.div>
  );
}

