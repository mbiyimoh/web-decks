export interface LearningModule {
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  order: number;
  locked?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modules: LearningModule[];
}

export const courses: Record<string, Course> = {
  'ai-workflow': {
    id: 'ai-workflow',
    title: '33 Strategies AI Workflow: For Builders',
    description: 'Master the spec-based development workflow for AI-assisted coding with Claude Code',
    modules: [
      {
        slug: 'claude-code-workflow',
        title: 'The Claude Code Workflow',
        description: 'The 5-stage pipeline: Ideate → Spec → Validate → Decompose → Execute',
        estimatedMinutes: 25,
        order: 0,
      },
      {
        slug: 'getting-started',
        title: 'Getting Started',
        description: 'Loading your AI collaborator with the context it needs to succeed',
        estimatedMinutes: 15,
        order: 1,
        locked: true,
      },
      {
        slug: 'existing-codebases',
        title: 'Working with Existing Codebases',
        description: 'Start small, scale smart — safely introducing AI to your codebase',
        estimatedMinutes: 20,
        order: 2,
        locked: true,
      },
      {
        slug: 'orchestration-system',
        title: 'Building Your Orchestration System',
        description: 'How to systematically improve your AI\'s understanding over time',
        estimatedMinutes: 20,
        order: 3,
        locked: true,
      },
    ],
  },
};

export function getCourse(courseId: string): Course | undefined {
  return courses[courseId];
}

export function getModule(courseId: string, moduleSlug: string): LearningModule | undefined {
  const course = courses[courseId];
  if (!course) return undefined;
  return course.modules.find((m) => m.slug === moduleSlug);
}

export function getAllCourses(): Course[] {
  return Object.values(courses);
}

export function getTotalEstimatedTime(course: Course): number {
  return course.modules.reduce((sum, m) => sum + m.estimatedMinutes, 0);
}
