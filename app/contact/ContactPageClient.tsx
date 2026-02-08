'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CONTACT_INTERESTS, getInterestsByCategory } from '@/lib/contact-interests';
import { GOLD, BG_PRIMARY, BG_SURFACE, TEXT_PRIMARY, TEXT_MUTED, TEXT_DIM } from '@/lib/design-tokens';
import { submitContactForm } from './actions';

export default function ContactPageClient() {
  const searchParams = useSearchParams();
  const preSelectedProduct = searchParams.get('product');

  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [checkedInterests, setCheckedInterests] = useState<string[]>(
    preSelectedProduct && CONTACT_INTERESTS.some((i) => i.id === preSelectedProduct)
      ? [preSelectedProduct]
      : []
  );

  // Field errors
  const [errors, setErrors] = useState<{ name?: string; email?: string; interests?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Please enter your name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (checkedInterests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    startTransition(async () => {
      const result = await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        interests: checkedInterests,
        message: message.trim() || undefined,
        source: preSelectedProduct || undefined,
      });

      if (result.success) {
        setFormState('success');
      } else {
        setFormState('error');
        setErrorMessage(result.error || 'Something went wrong');
      }
    });
  };

  const toggleInterest = (id: string) => {
    setCheckedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    // Clear interests error when user selects something
    if (errors.interests) {
      setErrors((prev) => ({ ...prev, interests: undefined }));
    }
  };

  if (formState === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-16"
        style={{ background: BG_PRIMARY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-5xl mb-6" style={{ color: GOLD }}>
            ✓
          </div>
          <h2 className="text-3xl font-display text-white mb-4">Message Sent</h2>
          <p style={{ color: TEXT_MUTED }} className="mb-8">
            Thanks for reaching out! We&apos;ll get back to you soon.
          </p>
          <Link href="/products" style={{ color: GOLD }} className="hover:underline">
            ← Back to Products
          </Link>
        </motion.div>
      </div>
    );
  }

  const products = getInterestsByCategory('product');
  const services = getInterestsByCategory('service');

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: BG_PRIMARY }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Back link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-colors hover:text-white"
          style={{ color: TEXT_MUTED }}
        >
          ← Back to Products
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-5xl font-display" style={{ color: GOLD }}>
              33
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-white mb-2">Get in Touch</h1>
          <p style={{ color: TEXT_MUTED }}>Tell us what you&apos;re interested in.</p>
        </div>

        {/* Error banner */}
        {formState === 'error' && (
          <div
            className="mb-6 p-4 rounded-lg text-sm"
            style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm mb-2" style={{ color: TEXT_PRIMARY }}>
              Name <span style={{ color: GOLD }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg outline-none transition-colors focus:border-[#d4a54a]"
              style={{
                background: BG_SURFACE,
                border: errors.name ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                color: TEXT_PRIMARY,
              }}
            />
            {errors.name && (
              <p className="mt-1 text-sm" style={{ color: '#f87171' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2" style={{ color: TEXT_PRIMARY }}>
              Email <span style={{ color: GOLD }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="you@company.com"
              className="w-full px-4 py-3 rounded-lg outline-none transition-colors focus:border-[#d4a54a]"
              style={{
                background: BG_SURFACE,
                border: errors.email ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                color: TEXT_PRIMARY,
              }}
            />
            {errors.email && (
              <p className="mt-1 text-sm" style={{ color: '#f87171' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm mb-4" style={{ color: TEXT_PRIMARY }}>
              I&apos;m interested in: <span style={{ color: GOLD }}>*</span>
            </label>

            {/* Products */}
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3"
              style={{ color: GOLD }}
            >
              Products
            </p>
            <div className="space-y-2 mb-6">
              {products.map((interest) => (
                <label
                  key={interest.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                    style={{
                      border: checkedInterests.includes(interest.id)
                        ? `2px solid ${GOLD}`
                        : '2px solid rgba(255,255,255,0.2)',
                      background: checkedInterests.includes(interest.id) ? GOLD : 'transparent',
                    }}
                  >
                    {checkedInterests.includes(interest.id) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={BG_PRIMARY}
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={checkedInterests.includes(interest.id)}
                    onChange={() => toggleInterest(interest.id)}
                    className="sr-only"
                  />
                  <span style={{ color: TEXT_PRIMARY }}>{interest.label}</span>
                </label>
              ))}
            </div>

            {/* Services */}
            <p
              className="text-xs font-mono tracking-widest uppercase mb-3"
              style={{ color: GOLD }}
            >
              Services
            </p>
            <div className="space-y-4">
              {services.map((interest) => (
                <label key={interest.id} className="flex items-start gap-3 cursor-pointer group w-full">
                  <div
                    className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center transition-colors mt-0.5"
                    style={{
                      border: checkedInterests.includes(interest.id)
                        ? `2px solid ${GOLD}`
                        : '2px solid rgba(255,255,255,0.2)',
                      background: checkedInterests.includes(interest.id) ? GOLD : 'transparent',
                    }}
                  >
                    {checkedInterests.includes(interest.id) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={BG_PRIMARY}
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={checkedInterests.includes(interest.id)}
                    onChange={() => toggleInterest(interest.id)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span style={{ color: TEXT_PRIMARY }}>{interest.label}</span>
                    {interest.description && (
                      <p className="text-sm mt-1" style={{ color: TEXT_DIM }}>
                        {interest.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {errors.interests && (
              <p className="mt-3 text-sm" style={{ color: '#f87171' }}>
                {errors.interests}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2" style={{ color: TEXT_PRIMARY }}>
              Message <span style={{ color: TEXT_DIM }}>(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more about what you're looking for..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg outline-none transition-colors resize-none focus:border-[#d4a54a]"
              style={{
                background: BG_SURFACE,
                border: '1px solid rgba(255,255,255,0.1)',
                color: TEXT_PRIMARY,
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded-lg font-semibold transition-opacity hover:opacity-90"
            style={{
              background: GOLD,
              color: BG_PRIMARY,
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isPending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
