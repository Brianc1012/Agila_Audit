// ============================================================================
// HASH UTILITY - SHA-256 HASHING FOR API KEYS
// ============================================================================

import crypto from 'crypto';

/**
 * Hash a string using SHA-256
 * @param value - The string to hash
 * @returns The hashed string in hexadecimal format
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Compare a raw value with a hashed value
 * @param rawValue - The raw string to compare
 * @param hashedValue - The hashed string to compare against
 * @returns True if the values match
 */
export function compareHash(rawValue: string, hashedValue: string): boolean {
  const hashedInput = hashValue(rawValue);
  return hashedInput === hashedValue;
}

/**
 * Generate a random API key
 * @param prefix - Optional prefix for the key (e.g., 'finance', 'hr')
 * @returns A random API key string
 */
export function generateApiKey(prefix?: string): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix ? `${prefix}_${randomBytes}` : randomBytes;
}
