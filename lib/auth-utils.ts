/**
 * Utility functions for authentication flows
 */

/**
 * Validates and sanitizes the returnTo parameter to prevent open redirects.
 * Only allows relative paths to known protected routes.
 */
export function validateReturnTo(returnTo: string | undefined): string {
  const defaultDestination = '/learning';

  if (!returnTo) {
    return defaultDestination;
  }

  // Only allow relative paths starting with /
  if (!returnTo.startsWith('/')) {
    console.warn(`Invalid returnTo (not relative): ${returnTo}`);
    return defaultDestination;
  }

  // Block protocol-relative URLs (//evil.com)
  if (returnTo.startsWith('//')) {
    console.warn(`Invalid returnTo (protocol-relative): ${returnTo}`);
    return defaultDestination;
  }

  // Block javascript: and data: URIs
  if (returnTo.toLowerCase().match(/^(javascript|data|vbscript):/)) {
    console.warn(`Invalid returnTo (dangerous protocol): ${returnTo}`);
    return defaultDestination;
  }

  // Allowlist of valid route prefixes
  const allowedPrefixes = ['/learning', '/clarity-canvas', '/auth'];
  const isAllowed = allowedPrefixes.some((prefix) => returnTo.startsWith(prefix));

  if (!isAllowed) {
    console.warn(`Invalid returnTo (not in allowlist): ${returnTo}`);
    return defaultDestination;
  }

  return returnTo;
}
