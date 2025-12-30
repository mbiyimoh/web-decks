import { auth } from '@/lib/auth';
import { getAllCourses, getTotalEstimatedTime } from '@/lib/courses';
import { AuthGate } from './components/AuthGate';
import { CourseCard } from './components/CourseCard';
import { LogoutButton } from './components/LogoutButton';

export default async function LearningDashboard() {
  const session = await auth();

  if (!session?.user) {
    return <AuthGate />;
  }

  const courses = getAllCourses();

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono">
              33 Strategies
            </p>
            <LogoutButton />
          </div>
          <h1 className="text-4xl font-bold text-[#f5f5f5] font-display">
            Learning Platform
          </h1>
          <p className="text-[#888888] mt-2">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-[#f5f5f5] mb-6">
            Your Courses
          </h2>
          <div className="grid gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                totalMinutes={getTotalEstimatedTime(course)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Learning | 33 Strategies',
  description: 'Internal training platform for 33 Strategies team members',
};
