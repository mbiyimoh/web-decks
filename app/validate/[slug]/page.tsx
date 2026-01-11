/**
 * Validation Page Server Component
 *
 * Public page for validators to complete persona questionnaires.
 * No authentication required - accessed via unique slug.
 */

import { Metadata } from 'next';
import { ValidationPageClient } from './ValidationPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Customer Validation | 33 Strategies',
  description: 'Help validate customer persona assumptions',
};

export default async function ValidatePage({ params }: Props) {
  const { slug } = await params;

  return <ValidationPageClient slug={slug} />;
}
