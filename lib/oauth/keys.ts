/**
 * RSA Key Management for OAuth JWT Signing
 *
 * Keys are stored as base64-encoded PEM in environment variables.
 * Generate keys with:
 *   openssl genrsa -out private.pem 2048
 *   openssl rsa -in private.pem -pubout -out public.pem
 *   cat private.pem | base64 | tr -d '\n'
 *   cat public.pem | base64 | tr -d '\n'
 */

import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';

let privateKey: KeyObject | null = null;
let publicKey: KeyObject | null = null;

function decodeBase64Key(base64Key: string): string {
  return Buffer.from(base64Key, 'base64').toString('utf-8');
}

/**
 * Get the private key for signing JWTs.
 */
export function getPrivateKey(): KeyObject {
  if (!privateKey) {
    const keyData = process.env.OAUTH_PRIVATE_KEY;
    if (!keyData) {
      throw new Error('OAUTH_PRIVATE_KEY environment variable is required');
    }
    privateKey = createPrivateKey(decodeBase64Key(keyData));
  }
  return privateKey;
}

/**
 * Get the public key for verifying JWTs.
 */
export function getPublicKey(): KeyObject {
  if (!publicKey) {
    const keyData = process.env.OAUTH_PUBLIC_KEY;
    if (!keyData) {
      throw new Error('OAUTH_PUBLIC_KEY environment variable is required');
    }
    publicKey = createPublicKey(decodeBase64Key(keyData));
  }
  return publicKey;
}

/**
 * Get the public key as JWK for the JWKS endpoint.
 */
export function getPublicJWK(): object {
  const key = getPublicKey();
  const jwk = key.export({ format: 'jwk' });
  return {
    ...jwk,
    kid: 'primary', // Key ID for rotation support
    use: 'sig',
    alg: 'RS256',
  };
}

/**
 * Check if OAuth keys are configured.
 */
export function areKeysConfigured(): boolean {
  return !!(process.env.OAUTH_PRIVATE_KEY && process.env.OAUTH_PUBLIC_KEY);
}
