export type ProductStatus = 'available' | 'by-request' | 'beta';

export interface ProductBenefit {
  icon: 'ai' | 'chat' | 'link' | 'clock' | 'search' | 'users' | 'target' | 'spark' | 'calendar' | 'grid' | 'mic' | 'brain' | 'context';
  title: string;
  description: string;
}

export interface ProductMockup {
  type: 'desktop' | 'mobile';
  label: string;
  imageSrc?: string;
}

export interface Product {
  id: string;
  name: string;
  nameGold: string;
  nameWhite: string;
  tagline: string;
  benefits: ProductBenefit[];
  mockups: ProductMockup[];
  status: ProductStatus;
  externalUrl?: string;
  contactFormProduct?: string;
  ctaLabel: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'talking-docs',
    name: 'TalkingDocs.ai',
    nameGold: 'Talking',
    nameWhite: 'Docs',
    tagline:
      "Let's be honest: nobody reads the documents you send them. Now they don't have to.",
    benefits: [
      {
        icon: 'ai',
        title: 'Train an AI that represents you',
        description: 'Answer a few questions, get an agent that speaks your language.',
      },
      {
        icon: 'chat',
        title: 'Deliver docs via conversation',
        description: 'Recipients ask questions instead of scrolling through decks.',
      },
      {
        icon: 'link',
        title: 'One link, instant access',
        description: 'No logins, no friction. Share a URL and they get answers.',
      },
    ],
    mockups: [],
    status: 'available',
    externalUrl: 'https://talkingdocs.ai',
    ctaLabel: 'Try TalkingDocs.ai',
  },
  {
    id: 'better-contacts',
    name: 'Better Contacts',
    nameGold: 'Better',
    nameWhite: 'Contacts',
    tagline:
      "Your contacts are missing the context that lives only in your head. Let's fix that.",
    benefits: [
      {
        icon: 'brain',
        title: 'Capture the context only you know',
        description: 'How you met, who introduced you, what matters to YOU specifically.',
      },
      {
        icon: 'mic',
        title: '30-second voice enrichment',
        description: 'Talk through what you know. AI extracts and structures it.',
      },
      {
        icon: 'search',
        title: 'Your network, queryable',
        description: 'Ask "who should I talk to about X?" and get real recommendations.',
      },
    ],
    mockups: [],
    status: 'available',
    externalUrl: 'https://bettercontacts.ai',
    ctaLabel: 'Try BetterContacts.ai',
  },
  {
    id: 'm33t',
    name: 'Better Networking',
    nameGold: 'Better',
    nameWhite: 'Networking',
    tagline: 'The right people. The right context. BEFORE you arrive.',
    benefits: [
      {
        icon: 'target',
        title: 'End random networking',
        description: 'Find the 3-4 people who actually align with your goals.',
      },
      {
        icon: 'spark',
        title: 'Know who to meet & why',
        description: 'AI surfaces matches with specific reasons to connect.',
      },
      {
        icon: 'users',
        title: 'Two-sided intent',
        description: 'They know to find you too. Both sides arrive prepared.',
      },
    ],
    mockups: [],
    status: 'by-request',
    contactFormProduct: 'm33t',
    ctaLabel: 'Request Access',
  },
  {
    id: 'marketing-automation',
    name: 'Marketing Machine',
    nameGold: 'Marketing',
    nameWhite: 'Machine',
    tagline:
      'Stop recreating the same campaigns. Drag reusable content blocks, swap the details, ship.',
    benefits: [
      {
        icon: 'grid',
        title: 'Reusable content blocks',
        description: 'Templatize launches, releases, promos. Same structure, new details.',
      },
      {
        icon: 'calendar',
        title: 'Drag-and-drop campaigns',
        description: 'Build 30-post campaigns in minutes on a visual calendar.',
      },
      {
        icon: 'ai',
        title: 'Plan with AI, export to builder',
        description: 'Brainstorm with ChatGPT, export directly into the builder.',
      },
    ],
    mockups: [],
    status: 'beta',
    contactFormProduct: 'marketing-automation',
    ctaLabel: 'Join Beta Waitlist',
  },
];
