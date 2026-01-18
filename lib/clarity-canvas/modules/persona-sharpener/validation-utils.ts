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
    // Map each item - extract readable text from objects
    const formatted = value.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        // Check for common properties that hold display text
        if ('label' in obj) return String(obj.label);
        if ('text' in obj) return String(obj.text);
        if ('value' in obj) return String(obj.value);
        if ('id' in obj) return String(obj.id);
        return JSON.stringify(item);
      }
      return String(item);
    });

    if (truncate && formatted.length > 2) {
      return formatted.slice(0, 2).join(', ') + '...';
    }
    return formatted.join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // Handle empty objects
    const keys = Object.keys(obj);
    if (keys.length === 0) return truncate ? 'Skipped' : 'No answer';

    // Check for common properties that hold display text (same order as array handling)
    if ('label' in obj) return String(obj.label);
    if ('text' in obj) return String(obj.text);
    if ('value' in obj) return String(obj.value);
    if ('id' in obj) return String(obj.id);

    // Handle fill-blank style objects (e.g., {blank: "...", timeframe: "..."})
    // Extract all string values and join them naturally
    const stringValues = keys
      .map((key) => obj[key])
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '');

    if (stringValues.length > 0) {
      const joined = stringValues.join(', ');
      if (truncate && joined.length > 50) {
        return joined.substring(0, 50) + '...';
      }
      return joined;
    }

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
