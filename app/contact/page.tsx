import { Suspense } from 'react';
import ContactPageClient from './ContactPageClient';

export const metadata = {
  title: 'Contact | 33 Strategies',
  description:
    'Get in touch with 33 Strategies. Tell us about your interest in our AI-powered products and services.',
};

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ContactPageClient />
    </Suspense>
  );
}
