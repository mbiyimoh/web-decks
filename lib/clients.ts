import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface ContentItem {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  component: ComponentType;
}

export interface ClientEntry {
  id: string;
  name: string;
  passwordEnvVar: string;
  content: ContentItem[];
}

// Lazy-load components for code splitting
const TradeblockAIInflection = dynamic(
  () => import('@/components/clients/tradeblock/TradeblockAIInflection'),
  { ssr: true }
);

const PLYAProposal = dynamic(
  () => import('@/components/clients/plya/PLYAProposal'),
  { ssr: true }
);

export const clients: Record<string, ClientEntry> = {
  'tradeblock': {
    id: 'tradeblock',
    name: 'Tradeblock',
    passwordEnvVar: 'TRADEBLOCK_PASSWORD',
    content: [
      {
        slug: 'ai-inflection',
        type: 'deck',
        title: 'The AI Inflection',
        description: 'Investor pitch deck - November 2025',
        component: TradeblockAIInflection,
      },
    ],
  },
  'plya': {
    id: 'plya',
    name: 'PLYA',
    passwordEnvVar: 'PLYA_PASSWORD',
    content: [
      {
        slug: 'project-proposal',
        type: 'proposal',
        title: 'Project Proposal',
        description: 'Interactive consulting proposal',
        component: PLYAProposal,
      },
    ],
  },
};

export function getClient(clientId: string): ClientEntry | undefined {
  // Case-insensitive lookup - normalize to lowercase
  return clients[clientId.toLowerCase()];
}

export function getClientContent(
  clientId: string,
  slug: string
): ContentItem | undefined {
  const client = getClient(clientId);
  if (!client) return undefined;
  return client.content.find((item) => item.slug === slug);
}

export function getClientPassword(clientId: string): string | undefined {
  const client = getClient(clientId);
  if (!client) return undefined;
  return process.env[client.passwordEnvVar];
}

export function getAllClientIds(): string[] {
  return Object.keys(clients);
}
