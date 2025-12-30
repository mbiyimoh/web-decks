'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Course } from '@/lib/courses';

interface CourseCardProps {
  course: Course;
  totalMinutes: number;
}

export function CourseCard({ course, totalMinutes }: CourseCardProps) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeLabel = hours > 0
    ? `${hours}h ${minutes}m`
    : `${minutes} min`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        href={`/learning/${course.id}`}
        className="
          block bg-[#111114] border border-white/[0.08] rounded-2xl p-8
          hover:border-[#d4a54a]/30 hover:bg-[#0d0d14]
          transition-all duration-200 group
        "
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-[#f5f5f5] font-display group-hover:text-[#d4a54a] transition-colors">
              {course.title}
            </h3>
            <p className="text-[#888888] mt-2 max-w-xl">
              {course.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-[#555555]">
              <span>{course.modules.length} modules</span>
              <span>•</span>
              <span>{timeLabel}</span>
            </div>
          </div>
          <div className="text-[#555555] group-hover:text-[#d4a54a] transition-colors ml-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
