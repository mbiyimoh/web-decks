'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES, type SectionKey } from '@/lib/clarity-canvas/profile-structure';
import { getScoreColor } from '@/lib/clarity-canvas/types';
import { calculateFieldScore } from '@/lib/clarity-canvas/scoring';
import { ContextInput } from '../components/ContextInput';
import { RecommendationReview } from '../components/RecommendationReview';
import PillarCelebration from '../components/PillarCelebration';
import type {
  ProfileWithSections,
  ProfileScores,
  ExtractOnlyResponse,
  CelebrationData,
  CommitRecommendationsResponse,
} from '@/lib/clarity-canvas/types';

interface PillarPageClientProps {
  pillarKey: SectionKey;
  initialProfile: ProfileWithSections;
  initialScores: ProfileScores;
}

export default function PillarPageClient({
  pillarKey,
  initialProfile,
  initialScores,
}: PillarPageClientProps) {
  const router = useRouter();
  const globalInputRef = useRef<HTMLDivElement>(null);

  // State
  const [profile, setProfile] = useState(initialProfile);
  const [scores, setScores] = useState(initialScores);
  const [isGlobalInputVisible, setIsGlobalInputVisible] = useState(true);
  const [activeInput, setActiveInput] = useState<{
    scope: 'pillar' | 'subsection';
    subsectionKey?: string;
  } | null>(null);
  const [extractionResult, setExtractionResult] =
    useState<ExtractOnlyResponse | null>(null);
  const [sourceType, setSourceType] = useState<'VOICE' | 'TEXT'>('TEXT');
  const [celebrationData, setCelebrationData] =
    useState<CelebrationData | null>(null);

  // Pillar metadata
  const pillar = PROFILE_STRUCTURE[pillarKey];
  const pillarScore = scores.sections[pillarKey] ?? 0;

  // IntersectionObserver for FAB
  useEffect(() => {
    if (!globalInputRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsGlobalInputVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(globalInputRef.current);
    return () => observer.disconnect();
  }, []);

  // Get section data from profile
  const section = profile.sections.find((s) => s.key === pillarKey);

  // Get subsection completion count
  const getSubsectionCompletion = (subsection: {
    fields: { fullContext?: string | null }[];
  }) => {
    const total = subsection.fields.length;
    const completed = subsection.fields.filter(
      (f) => f.fullContext && f.fullContext.trim().length > 0
    ).length;
    return { completed, total };
  };

  // Handle extraction result from ContextInput
  const handleExtracted = (result: ExtractOnlyResponse) => {
    setExtractionResult(result);
  };

  // Handle cancel from ContextInput
  const handleCancelInput = () => {
    setActiveInput(null);
    setExtractionResult(null);
  };

  // Handle commit from RecommendationReview
  const handleCommit = (
    updatedProfile: ProfileWithSections,
    newScores: ProfileScores,
    response?: CommitRecommendationsResponse
  ) => {
    const previousScores = response?.previousScores ?? scores;
    const savedCount = response?.savedCount ?? 0;

    const previousSectionScore = previousScores.sections[pillarKey] ?? 0;
    const newSectionScore = newScores.sections[pillarKey] ?? 0;

    // Only show celebration if score actually improved
    if (newSectionScore > previousSectionScore) {
      setCelebrationData({
        previousScore: previousSectionScore,
        newScore: newSectionScore,
        fieldsUpdated: savedCount,
        pillarName: pillar.name,
        pillarIcon: pillar.icon,
      });
    }

    setProfile(updatedProfile);
    setScores(newScores);
    setExtractionResult(null);
    setActiveInput(null);
  };

  // Handle back from review
  const handleCancelReview = () => {
    setExtractionResult(null);
    // Keep activeInput so user can try again
  };

  // Handle celebration dismiss
  const handleDismissCelebration = () => {
    setCelebrationData(null);
    router.refresh(); // Sync server components
  };

  // Build scope object for ContextInput
  const getInputScope = () => {
    if (!activeInput) return { section: pillarKey };
    if (activeInput.scope === 'pillar') {
      return { section: pillarKey };
    }
    return {
      section: pillarKey,
      subsection: activeInput.subsectionKey,
    };
  };

  // Determine what to show
  const showSubsections = !activeInput && !extractionResult;
  const showContextInput = activeInput && !extractionResult;
  const showReview = extractionResult !== null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-[#0d0d14] border-b border-zinc-800 px-6 py-4"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/clarity-canvas"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{pillar.icon}</span>
              <h1 className="text-xl font-display text-[#f5f5f5]">
                {pillar.name}
              </h1>
            </div>
          </div>
          <div
            className="text-lg font-mono"
            style={{ color: getScoreColor(pillarScore) }}
          >
            {Math.round(pillarScore)}%
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Context Input Mode */}
          {showContextInput && (
            <motion.div
              key="context-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContextInput
                scope={getInputScope()}
                onExtracted={handleExtracted}
                onCancel={handleCancelInput}
                minVoiceDuration={activeInput?.scope === 'subsection' ? 10 : 20}
              />
            </motion.div>
          )}

          {/* Review Mode */}
          {showReview && extractionResult && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RecommendationReview
                extractedChunks={extractionResult.extractedChunks}
                overallThemes={extractionResult.overallThemes}
                suggestedFollowUps={extractionResult.suggestedFollowUps}
                sourceType={sourceType}
                extractionMetadata={extractionResult.extractionMetadata}
                onCommit={handleCommit}
                onBack={handleCancelReview}
              />
            </motion.div>
          )}

          {/* Normal View - Subsection Cards */}
          {showSubsections && (
            <motion.div
              key="subsections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Pillar-global input section */}
              <motion.div
                ref={globalInputRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-6">
                  <p className="text-[#888888] mb-4">
                    Add context to improve all areas of {pillar.name}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSourceType('TEXT');
                        setActiveInput({ scope: 'pillar' });
                      }}
                      className="px-4 py-2 bg-[#d4a54a]/10 text-[#d4a54a] border border-[#d4a54a]/30 rounded-lg hover:bg-[#d4a54a]/20 transition-colors"
                    >
                      Type
                    </button>
                    <button
                      onClick={() => {
                        setSourceType('VOICE');
                        setActiveInput({ scope: 'pillar' });
                      }}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Speak
                    </button>
                    <button
                      onClick={() => {
                        setSourceType('TEXT');
                        setActiveInput({ scope: 'pillar' });
                      }}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Upload File
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Subsection cards */}
              {section?.subsections.map((subsection, index) => {
                const { completed, total } = getSubsectionCompletion(subsection);
                const sortedFields = [...subsection.fields].sort(
                  (a, b) => calculateFieldScore(b) - calculateFieldScore(a)
                );

                return (
                  <motion.div
                    key={subsection.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 2) }}
                    className="mb-6 bg-[#111114] border border-zinc-800 rounded-2xl p-6"
                  >
                    {/* Subsection header */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[#d4a54a] text-xs font-mono tracking-[0.2em] uppercase">
                        {subsection.name}
                      </p>
                      <span className="text-xs text-zinc-500">
                        {completed}/{total} complete
                      </span>
                    </div>

                    {/* Fields */}
                    <div className="space-y-3 mb-4">
                      {sortedFields.map((field) => {
                        const hasData =
                          field.fullContext && field.fullContext.trim().length > 0;
                        const displayName =
                          FIELD_DISPLAY_NAMES[field.key] || field.key;

                        return (
                          <div key={field.key} className="flex items-start gap-3">
                            <span
                              className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                hasData ? 'bg-green-500' : 'bg-zinc-600'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#f5f5f5]">{displayName}</p>
                              <p className="text-xs text-[#888888] truncate">
                                {hasData
                                  ? field.summary || field.fullContext
                                  : 'No data yet'}
                              </p>
                            </div>
                            {hasData && field.sources.length > 0 && (
                              <span className="text-xs text-zinc-500 flex-shrink-0">
                                {field.sources.length} source
                                {field.sources.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add context button */}
                    <button
                      onClick={() =>
                        setActiveInput({
                          scope: 'subsection',
                          subsectionKey: subsection.key,
                        })
                      }
                      className="w-full py-2 text-[#d4a54a] text-sm border border-[#d4a54a]/30 rounded-lg hover:bg-[#d4a54a]/10 transition-colors"
                    >
                      + Add context for {subsection.name}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <AnimatePresence>
        {!isGlobalInputVisible && !activeInput && !extractionResult && (
          <motion.div
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-30"
          >
            <button
              onClick={() => setActiveInput({ scope: 'pillar' })}
              className="w-14 h-14 bg-[#d4a54a] text-black rounded-full shadow-lg flex items-center justify-center hover:bg-[#c4954a] transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrationData && (
          <PillarCelebration
            data={celebrationData}
            onDismiss={handleDismissCelebration}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
