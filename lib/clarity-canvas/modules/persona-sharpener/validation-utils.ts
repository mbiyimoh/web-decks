/**
 * Utility functions for persona validation sharing
 */

import { randomBytes } from 'crypto';

/**
 * Generate a secure 16-character hex slug for validation links
 */
export function generateValidationSlug(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Build the full validation URL from a slug
 */
export function buildValidationUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3033';
  return `${baseUrl}/validate/${slug}`;
}

/**
 * Parse a validation URL to extract the slug
 */
export function parseValidationSlug(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const validateIndex = pathParts.indexOf('validate');
    if (validateIndex !== -1 && pathParts[validateIndex + 1]) {
      return pathParts[validateIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate that a slug matches the expected format (16 hex chars)
 */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-f0-9]{16}$/.test(slug);
}

/**
 * Format response values for display in validation views
 * @param value - Response value of any type
 * @param truncate - Whether to truncate long values (for compact views)
 */
export function formatResponseValue(value: unknown, truncate = false): string {
  if (value === null || value === undefined) return truncate ? 'Skipped' : 'No answer';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (truncate && value.length > 2) {
      return value.slice(0, 2).join(', ') + '...';
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('label' in obj) return String(obj.label);
    if ('text' in obj) return String(obj.text);
    return truncate ? '...' : JSON.stringify(value);
  }
  return String(value);
}

/**
 * Format a date as relative time (e.g., "2h ago", "Yesterday")
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes === 0) return 'Just now';
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
