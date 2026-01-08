import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

export interface ContentItem {
  slug: string;
  type: 'deck' | 'proposal' | 'document';
  title: string;
  description?: string;
  addedOn?: string;      // ISO date string (YYYY-MM-DD) - when first published
  lastUpdated?: string;  // ISO date string (YYYY-MM-DD) - when last modified
  tagOverride?: string;  // Optional custom tag to display instead of type label
  component: ComponentType;
}

export interface ClientEntry {
  id: string;
  name: string;
  passwordEnvVar: string;
  emailEnvVar: string;  // e.g., 'PLYA_EMAIL' - required for User creation
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

const IPFrameworkDeck = dynamic(
  () => import('@/components/clients/plya/IPFrameworkDeck'),
  { ssr: true }
);

const WSBCFinalProposal = dynamic(
  () => import('@/components/clients/wsbc/WSBCFinalProposal'),
  { ssr: true }
);

export const clients: Record<string, ClientEntry> = {
  'tradeblock': {
    id: 'tradeblock',
    name: 'Tradeblock',
    passwordEnvVar: 'TRADEBLOCK_PASSWORD',
    emailEnvVar: 'TRADEBLOCK_EMAIL',
    content: [
      {
        slug: 'ai-inflection',
        type: 'deck',
        title: 'The AI Inflection',
        description: 'Investor pitch deck - November 2025',
        addedOn: '2024-11-15',
        lastUpdated: '2024-12-03',
        component: TradeblockAIInflection,
      },
    ],
  },
  'plya': {
    id: 'plya',
    name: 'PLYA',
    passwordEnvVar: 'PLYA_PASSWORD',
    emailEnvVar: 'PLYA_EMAIL',
    content: [
      {
        slug: 'project-proposal',
        type: 'proposal',
        title: 'The Path Forward',
        description: 'Explore your personalized roadmap to launch',
        addedOn: '2024-12-01',
        component: PLYAProposal,
      },
      {
        slug: 'ip-framework',
        type: 'deck',
        title: 'IP: Protecting Both Yours and Ours',
        description: 'How we think about intellectual property in the context of client engagements',
        addedOn: '2024-12-24',
        component: IPFrameworkDeck,
      },
    ],
  },
  'wsbc': {
    id: 'wsbc',
    name: 'WSBC',
    passwordEnvVar: 'WSBC_PASSWORD',
    emailEnvVar: 'WSBC_EMAIL',
    content: [
      {
        slug: 'final-proposal',
        type: 'deck',
        title: 'WSBC VIP Experience Proposal',
        description: 'Interactive proposal for the Wisconsin Sports Business Conference VIP experience',
        addedOn: '2024-12-27',
        tagOverride: 'DEMO + PROPOSAL',
        component: WSBCFinalProposal,
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

export function getClientEmail(clientId: string): string | undefined {
  const client = getClient(clientId);
  if (!client) return undefined;
  return process.env[client.emailEnvVar];
}

export function getAllClientIds(): string[] {
  return Object.keys(clients);
}
