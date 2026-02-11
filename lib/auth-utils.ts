import { timingSafeEqual } from 'crypto';

/**
 * Utility functions for authentication flows
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 * Always returns false if lengths don't match (after constant-time self-comparison).
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Compare against self to maintain constant time
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes the returnTo parameter to prevent open redirects.
 * Only allows relative paths to known protected routes.
 */
export function validateReturnTo(returnTo: string | undefined): string {
  const defaultDestination = '/learning';

  if (!returnTo) {
    return defaultDestination;
  }

  // Handle full URLs - extract path if it's our domain
  let pathToValidate = returnTo;
  if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
    try {
      const url = new URL(returnTo);
      const allowedHosts = ['33strategies.ai', 'localhost:3033', 'localhost:3000'];
      if (!allowedHosts.some(host => url.host === host || url.host.endsWith('.' + host))) {
        console.warn(`Invalid returnTo (external host): ${returnTo}`);
        return defaultDestination;
      }
      // Extract path + search params for validation
      pathToValidate = url.pathname + url.search;
    } catch {
      console.warn(`Invalid returnTo (malformed URL): ${returnTo}`);
      return defaultDestination;
    }
  }

  // Only allow relative paths starting with /
  if (!pathToValidate.startsWith('/')) {
    console.warn(`Invalid returnTo (not relative): ${returnTo}`);
    return defaultDestination;
  }

  // Block protocol-relative URLs (//evil.com)
  if (pathToValidate.startsWith('//')) {
    console.warn(`Invalid returnTo (protocol-relative): ${returnTo}`);
    return defaultDestination;
  }

  // Block javascript: and data: URIs (already handled if full URL, but check path too)
  if (pathToValidate.toLowerCase().match(/^(javascript|data|vbscript):/)) {
    console.warn(`Invalid returnTo (dangerous protocol): ${returnTo}`);
    return defaultDestination;
  }

  // Allowlist of valid route prefixes
  const allowedPrefixes = [
    '/learning',
    '/clarity-canvas',
    '/auth',
    '/api/oauth',        // OAuth authorization flow callbacks
    '/client-portals',   // Client portal auth
    '/strategist-portals', // Strategist portal auth
    '/central-command',  // Central command auth
  ];
  const isAllowed = allowedPrefixes.some((prefix) => pathToValidate.startsWith(prefix));

  if (!isAllowed) {
    console.warn(`Invalid returnTo (not in allowlist): ${returnTo}`);
    return defaultDestination;
  }

  // Return the original URL (full or relative) - it's been validated
  return returnTo;
}
