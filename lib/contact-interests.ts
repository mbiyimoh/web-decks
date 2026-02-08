export interface ContactInterest {
  id: string;
  label: string;
  description?: string;
  category: 'product' | 'service';
}

export const CONTACT_INTERESTS: ContactInterest[] = [
  // Products
  { id: 'talking-docs', label: 'TalkingDocs.ai', category: 'product' },
  { id: 'better-contacts', label: 'BetterContacts.ai', category: 'product' },
  { id: 'm33t', label: 'M33T ("Better Networking")', category: 'product' },
  { id: 'marketing-automation', label: 'Marketing Automation', category: 'product' },

  // Services
  {
    id: 'hard-reset',
    label: 'Hard Reset: 33-Day AI Transformation',
    description:
      "We leave clients with: 1) extensive business context; 2) core data connections and automation; 3) an educated team thinking about what's possible in a whole new way",
    category: 'service',
  },
  {
    id: 'ai-development',
    label: 'AI-driven Development Services',
    description:
      'We help you build things like a traditional dev firm would... just better, faster, and cheaper.',
    category: 'service',
  },
];

// Helper to get interests by category
export const getInterestsByCategory = (category: 'product' | 'service') =>
  CONTACT_INTERESTS.filter((i) => i.category === category);

// Helper to get interest by ID
export const getInterestById = (id: string) =>
  CONTACT_INTERESTS.find((i) => i.id === id);
