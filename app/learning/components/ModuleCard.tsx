'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { LearningModule } from '@/lib/courses';
import { isModuleCompleted } from '@/lib/progress';

interface ModuleCardProps {
  module: LearningModule;
  courseId: string;
  index: number;
}

export function ModuleCard({ module, courseId, index }: ModuleCardProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isModuleCompleted(courseId, module.slug));
  }, [courseId, module.slug]);

  const isLocked = module.locked === true;

  // Locked module card (non-clickable)
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
      >
        <div
          className="
            flex items-center gap-6
            bg-[#0d0d10] border border-white/[0.04] rounded-xl p-6
            opacity-60 cursor-not-allowed
          "
        >
          {/* Lock Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0a0a0f] border border-white/[0.06] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#444444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#666666]">
              {module.title}
            </h3>
            <p className="text-[#555555] text-sm mt-1 truncate">
              {module.description}
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-[#d4a54a]/60 text-xs font-medium uppercase tracking-wider">
              Coming soon...
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Unlocked module card (clickable)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/learning/${courseId}/${module.slug}`}
        className="
          flex items-center gap-6
          bg-[#111114] border border-white/[0.08] rounded-xl p-6
          hover:border-[#d4a54a]/30 hover:bg-[#0d0d14]
          transition-all duration-200 group
        "
      >
        {/* Order Number */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0a0a0f] border border-white/[0.08] flex items-center justify-center">
          {completed ? (
            <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-[#555555] text-sm font-mono">{module.order}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#f5f5f5] group-hover:text-[#d4a54a] transition-colors">
            {module.title}
          </h3>
          <p className="text-[#888888] text-sm mt-1 truncate">
            {module.description}
          </p>
        </div>

        {/* Duration & Arrow */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-[#555555] text-sm">{module.estimatedMinutes} min</span>
          <svg
            className="w-5 h-5 text-[#555555] group-hover:text-[#d4a54a] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
