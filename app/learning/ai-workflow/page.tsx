import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCourse, getTotalEstimatedTime } from '@/lib/courses';
import { ModuleCard } from '../components/ModuleCard';
import { LogoutButton } from '../components/LogoutButton';
import Link from 'next/link';

export default async function AIWorkflowCourse() {
  const session = await auth();

  if (!session?.user) {
    redirect('/learning');
  }

  const course = getCourse('ai-workflow');
  if (!course) {
    redirect('/learning');
  }

  const totalMinutes = getTotalEstimatedTime(course);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/learning"
            className="text-[#888888] hover:text-[#f5f5f5] text-sm transition-colors"
          >
            ← Back to courses
          </Link>
          <LogoutButton />
        </div>

        {/* Course Header */}
        <header className="mb-12">
          <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono mb-2">
            Course
          </p>
          <h1 className="text-4xl font-bold text-[#f5f5f5] font-display mb-4">
            {course.title}
          </h1>
          <p className="text-[#888888] mb-4 max-w-2xl">
            {course.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-[#555555]">
            <span>{course.modules.length} modules</span>
            <span>•</span>
            <span>{hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`}</span>
          </div>
        </header>

        {/* Module List */}
        <section>
          <h2 className="text-xl font-semibold text-[#f5f5f5] mb-6">
            Modules
          </h2>
          <div className="space-y-4">
            {course.modules.map((module, index) => (
              <ModuleCard
                key={module.slug}
                module={module}
                courseId={course.id}
                index={index}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI Workflow Course | 33 Strategies Learning',
  description: 'Master the spec-based development workflow for AI-assisted coding',
};
