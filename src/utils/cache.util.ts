/**
 * ========================================
 * 🚀 Hybrid Cache Utility (Redis + LRU)
 * ========================================
 * 
 * Provides caching functionality using:
 * 1. Upstash Redis (primary) - for distributed caching
 * 2. LRU Cache (fallback) - for local in-memory caching
 * 
 * Features:
 * - Upstash Redis support with automatic retry
 * - Local LRU cache fallback when Redis unavailable
 * - REST API fallback for serverless environments (Vercel Edge)
 * - Cache key generation (namespace-based, user-aware)
 * - CRUD operations: getCache, setCache, deleteCache
 * - Pattern-based invalidation
 * - Wrapper function for easy cache integration
 * - No crashes if Redis fails - automatic fallback
 * 
 * Environment Variables:
 *   ENABLE_CACHE=true|false
 *   REDIS_URL=rediss://...  (for ioredis TCP connection)
 *   UPSTASH_REDIS_REST_URL=https://...  (optional REST fallback)
 *   UPSTASH_REDIS_REST_TOKEN=...  (optional REST token)
 *   CACHE_TTL_SECONDS=300
 * 
 * Usage:
 *   import cache from './utils/cache.util';
 *   
 *   // Simple usage
 *   await cache.setCache('stats:today', data, 3600);
 *   const stats = await cache.getCache('stats:today');
 *   await cache.deleteCache('stats:today');
 *   
 *   // With wrapper
 *   const result = await cache.withCache('stats:today', 3600, async () => {
 *     return await expensiveDatabaseQuery();
 *   });
 */

import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

// ────────────────────────────────────────
// Configuration
// ────────────────────────────────────────
const ENABLE_CACHE = process.env.ENABLE_CACHE === 'true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

// ────────────────────────────────────────
// LRU Cache Configuration (Fallback)
// ────────────────────────────────────────
const lruCache = new LRUCache<string, string>({
  max: 500, // Maximum 500 items
  maxSize: 50 * 1024 * 1024, // 50MB max size
  sizeCalculation: (value) => value.length,
  ttl: DEFAULT_TTL * 1000, // Convert seconds to milliseconds
  updateAgeOnGet: true,
  updateAgeOnHas: false,
});

// ────────────────────────────────────────
// Cache Mode Tracking
// ────────────────────────────────────────
type CacheMode = 'redis' | 'lru' | 'disabled';
let currentCacheMode: CacheMode = 'disabled';
let redisClient: Redis | null = null;
let startupMessageShown = false;

// ────────────────────────────────────────
// Redis Client Initialization
// ────────────────────────────────────────
function initializeRedis(): void {
  if (!ENABLE_CACHE) {
    currentCacheMode = 'disabled';
    if (!startupMessageShown) {
      console.log('ℹ️  Cache disabled (ENABLE_CACHE=false)');
      startupMessageShown = true;
    }
    return;
  }

  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 3) {
          if (!startupMessageShown) {
            console.warn('⚠️  Redis unavailable. Local cache fallback active.');
            startupMessageShown = true;
          }
          currentCacheMode = 'lru';
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000); // Exponential backoff
      },
    });

    redisClient.on('connect', () => {
      currentCacheMode = 'redis';
      if (!startupMessageShown) {
        console.log(`✅ Redis cache enabled: ${REDIS_URL.replace(/:[^:@]+@/, ':***@')}`);
        startupMessageShown = true;
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      currentCacheMode = 'lru';
    });

    redisClient.on('close', () => {
      currentCacheMode = 'lru';
    });
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    currentCacheMode = 'lru';
    if (!startupMessageShown) {
      console.warn('⚠️  Local cache fallback active.');
      startupMessageShown = true;
    }
  }
}

// Initialize Redis on module load
initializeRedis();

// ────────────────────────────────────────
// REST API Fallback (for Serverless)
// ────────────────────────────────────────
async function restGet(key: string): Promise<string | null> {
  if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) return null;

  try {
    const response = await fetch(`${UPSTASH_REST_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REST_TOKEN}` },
    });
    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('REST GET error:', error);
    return null;
  }
}

async function restSet(key: string, value: string, ttl?: number): Promise<void> {
  if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) return;

  try {
    const command = ttl ? ['SET', key, value, 'EX', ttl.toString()] : ['SET', key, value];
    await fetch(UPSTASH_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
  } catch (error) {
    console.error('REST SET error:', error);
  }
}

async function restDel(key: string): Promise<void> {
  if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) return;

  try {
    await fetch(UPSTASH_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['DEL', key]),
    });
  } catch (error) {
    console.error('REST DEL error:', error);
  }
}

// ────────────────────────────────────────
// Cache Operations
// ────────────────────────────────────────

/**
 * Get value from cache
 * @param key Cache key
 * @returns Parsed value or null if not found
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  if (!ENABLE_CACHE) return null;

  try {
    // Try Redis first
    if (currentCacheMode === 'redis' && redisClient) {
      const value = await redisClient.get(key);
      if (value) {
        console.log(`✅ Cache hit (Redis): ${key}`);
        return JSON.parse(value);
      }
    }

    // Try REST API fallback
    if (currentCacheMode === 'lru' && UPSTASH_REST_URL) {
      const value = await restGet(key);
      if (value) {
        console.log(`✅ Cache hit (REST): ${key}`);
        return JSON.parse(value);
      }
    }

    // Try LRU cache
    const lruValue = lruCache.get(key);
    if (lruValue) {
      console.log(`✅ Cache hit (LRU): ${key}`);
      return JSON.parse(lruValue);
    }

    console.log(`❌ Cache miss: ${key}`);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache
 * @param key Cache key
 * @param value Value to cache (will be JSON stringified)
 * @param ttlInSeconds Time to live in seconds (optional)
 */
export async function setCache(key: string, value: any, ttlInSeconds?: number): Promise<void> {
  if (!ENABLE_CACHE) return;

  try {
    const stringValue = JSON.stringify(value);
    const ttl = ttlInSeconds || DEFAULT_TTL;

    // Set in Redis
    if (currentCacheMode === 'redis' && redisClient) {
      await redisClient.set(key, stringValue, 'EX', ttl);
      console.log(`💾 Cached (Redis): ${key} [TTL: ${ttl}s]`);
    }

    // Set in REST API
    if (currentCacheMode === 'lru' && UPSTASH_REST_URL) {
      await restSet(key, stringValue, ttl);
      console.log(`💾 Cached (REST): ${key} [TTL: ${ttl}s]`);
    }

    // Always set in LRU as additional fallback
    lruCache.set(key, stringValue, { ttl: ttl * 1000 });
    if (currentCacheMode === 'lru') {
      console.log(`💾 Cached (LRU): ${key} [TTL: ${ttl}s]`);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete value from cache
 * @param key Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  if (!ENABLE_CACHE) return;

  try {
    // Delete from Redis
    if (currentCacheMode === 'redis' && redisClient) {
      await redisClient.del(key);
    }

    // Delete from REST API
    if (currentCacheMode === 'lru' && UPSTASH_REST_URL) {
      await restDel(key);
    }

    // Delete from LRU
    lruCache.delete(key);
    
    console.log(`🗑️  Deleted cache: ${key}`);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

// ────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────

/**
 * Generate cache key with namespace and parameters
 */
export function generateCacheKey(namespace: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});
  return `audit:${namespace}:${JSON.stringify(sortedParams)}`;
}

/**
 * Generate user-aware cache key (includes user ID and role)
 */
export function generateUserCacheKey(
  namespace: string,
  userId: string,
  userRole: string,
  params: Record<string, any> = {}
): string {
  return generateCacheKey(namespace, { ...params, userId, userRole });
}

/**
 * Invalidate all cache keys matching a pattern (Redis only)
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  if (!ENABLE_CACHE || currentCacheMode !== 'redis' || !redisClient) {
    // For LRU, clear all matching keys
    if (currentCacheMode === 'lru') {
      const keys = Array.from(lruCache.keys()).filter(key => key.includes(pattern));
      keys.forEach(key => lruCache.delete(key));
      console.log(`🗑️  Invalidated ${keys.length} cache keys (LRU) matching: ${pattern}`);
      return keys.length;
    }
    return 0;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`🗑️  Invalidated ${keys.length} cache keys (Redis) matching: ${pattern}`);
    }
    return keys.length;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate all cache for a specific service
 */
export async function invalidateService(serviceName: string): Promise<number> {
  return await invalidatePattern(`audit:*serviceName*${serviceName}*`);
}

/**
 * Invalidate all summaries cache
 */
export async function invalidateSummaries(): Promise<number> {
  return await invalidatePattern('audit:summaries:*');
}

/**
 * Invalidate all stats cache
 */
export async function invalidateStats(): Promise<number> {
  return await invalidatePattern('audit:stats:*');
}

/**
 * Invalidate all recent activity cache
 */
export async function invalidateRecent(): Promise<number> {
  return await invalidatePattern('audit:recent:*');
}

/**
 * Wrapper function for easy cache integration
 * @param key Cache key
 * @param fetchFunction Function to fetch data if cache miss
 * @param ttl Time to live in seconds (optional, defaults to DEFAULT_TTL)
 * @returns Cached or fetched data
 */
export async function withCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  const data = await fetchFunction();

  // Store in cache
  await setCache(key, data, ttl);

  return data;
}

/**
 * Disconnect Redis client (for graceful shutdown)
 */
export async function disconnect(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis cache disconnected');
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAll(): Promise<void> {
  if (!ENABLE_CACHE) return;

  try {
    // Clear Redis
    if (currentCacheMode === 'redis' && redisClient) {
      await redisClient.flushdb();
      console.log('🗑️  Cleared all Redis cache');
    }

    // Clear LRU
    lruCache.clear();
    console.log('🗑️  Cleared all LRU cache');
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

// ────────────────────────────────────────
// Export Cache Utility
// ────────────────────────────────────────
export default {
  getCache,
  setCache,
  deleteCache,
  generateCacheKey,
  generateUserCacheKey,
  invalidatePattern,
  invalidateService,
  invalidateSummaries,
  invalidateStats,
  invalidateRecent,
  withCache,
  disconnect,
  clearAll,
  
  // Legacy compatibility
  getCached: getCache,
  setCached: setCache,
  deleteCached: deleteCache,
};
