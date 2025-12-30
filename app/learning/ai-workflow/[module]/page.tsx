import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getModule } from '@/lib/courses';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic imports for each module's deck component
const moduleComponents: Record<string, React.ComponentType> = {
  'getting-started': dynamic(() => import('../getting-started/GettingStartedDeck')),
  'claude-code-workflow': dynamic(() => import('../claude-code-workflow/ClaudeCodeWorkflowDeck')),
  'existing-codebases': dynamic(() => import('../existing-codebases/ExistingCodebasesDeck')),
  'orchestration-system': dynamic(() => import('../orchestration-system/OrchestrationSystemDeck')),
};

interface Props {
  params: Promise<{ module: string }>;
}

export default async function ModulePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect('/learning');
  }

  const { module: moduleSlug } = await params;
  const module = getModule('ai-workflow', moduleSlug);

  if (!module) {
    notFound();
  }

  // Redirect if module is locked (prevents direct URL access)
  if (module.locked) {
    redirect('/learning/ai-workflow');
  }

  const DeckComponent = moduleComponents[moduleSlug];

  // Placeholder while deck components are being migrated
  if (!DeckComponent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-[#d4a54a] uppercase tracking-[0.2em] text-xs font-mono mb-4">
            Module {module.order}
          </p>
          <h1 className="text-3xl font-bold text-[#f5f5f5] font-display mb-4">
            {module.title}
          </h1>
          <p className="text-[#888888] mb-8">
            {module.description}
          </p>
          <p className="text-[#555555] text-sm mb-6">
            Content coming soon...
          </p>
          <Link
            href="/learning/ai-workflow"
            className="text-[#d4a54a] hover:text-[#e4b55a] text-sm transition-colors"
          >
            ← Back to course
          </Link>
        </div>
      </div>
    );
  }

  return <DeckComponent />;
}

export async function generateMetadata({ params }: Props) {
  const { module: moduleSlug } = await params;
  const module = getModule('ai-workflow', moduleSlug);

  if (!module) {
    return { title: 'Module Not Found' };
  }

  return {
    title: `${module.title} | 33 Strategies Learning`,
    description: module.description,
  };
}
