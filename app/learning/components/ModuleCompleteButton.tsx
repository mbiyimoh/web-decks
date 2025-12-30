'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { markModuleCompleted, isModuleCompleted } from '@/lib/progress';

interface ModuleCompleteButtonProps {
  courseId: string;
  moduleId: string;
}

export function ModuleCompleteButton({ courseId, moduleId }: ModuleCompleteButtonProps) {
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCompleted(isModuleCompleted(courseId, moduleId));
  }, [courseId, moduleId]);

  const handleComplete = () => {
    markModuleCompleted(courseId, moduleId);
    setCompleted(true);
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16 pb-8">
        <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-16 pb-8">
      {completed ? (
        <div className="flex items-center gap-3 px-8 py-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <svg
            className="w-5 h-5 text-green-500"
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
          <span className="text-green-500 font-medium">Module Completed</span>
        </div>
      ) : (
        <button
          onClick={handleComplete}
          className="
            px-8 py-3
            bg-[#d4a54a] hover:bg-[#e4b55a]
            text-[#0a0a0f] font-medium
            rounded-lg
            transition-all duration-200
            hover:shadow-[0_0_20px_rgba(212,165,74,0.3)]
          "
        >
          Mark as Complete
        </button>
      )}

      <Link
        href={`/learning/${courseId}`}
        className="text-[#888888] hover:text-[#d4a54a] text-sm transition-colors"
      >
        ← Back to course
      </Link>
    </div>
  );
}
