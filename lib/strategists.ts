import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface ContentItem {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;      // ISO date string (YYYY-MM-DD)
  lastUpdated?: string;  // ISO date string (YYYY-MM-DD)
  tagOverride?: string;  // Optional custom tag to display instead of type label
  component: ComponentType;
}

export interface StrategistEntry {
  id: string;
  name: string;
  email: string;           // Reference email (metadata, not for auth)
  passwordEnvVar: string;
  content: ContentItem[];
}

// Lazy-load components for code splitting
const SherrilRoleProposal = dynamic(
  () => import('@/components/strategists/sherril/SherrilRoleProposal'),
  { ssr: true }
);

export const strategists: Record<string, StrategistEntry> = {
  'sherril': {
    id: 'sherril',
    name: 'Sherril',
    email: 'sherril@33strategies.ai',
    passwordEnvVar: 'SHERRIL_PASSWORD',
    content: [
      {
        slug: 'role-proposal',
        type: 'proposal',
        title: 'The Opportunity',
        description: 'Build the future of both companies',
        addedOn: '2025-01-07',
        component: SherrilRoleProposal,
      },
    ],
  },
};

export function getStrategist(strategistId: string): StrategistEntry | undefined {
  // Case-insensitive lookup - normalize to lowercase
  return strategists[strategistId.toLowerCase()];
}

export function getStrategistContent(
  strategistId: string,
  slug: string
): ContentItem | undefined {
  const strategist = getStrategist(strategistId);
  if (!strategist) return undefined;
  return strategist.content.find((item) => item.slug === slug);
}

export function getStrategistPassword(strategistId: string): string | undefined {
  const strategist = getStrategist(strategistId);
  if (!strategist) return undefined;
  return process.env[strategist.passwordEnvVar];
}

export function getAllStrategistIds(): string[] {
  return Object.keys(strategists);
}
