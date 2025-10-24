// ============================================================================
// DEDUPLICATION SERVICE - Prevent duplicate audit events
// ============================================================================

import { prisma } from '../prisma/client';
import { Redis } from '@upstash/redis';

// Initialize Redis client for fast dedup checks (if available)
let redisClient: Redis | null = null;

if (process.env.ENABLE_CACHE === 'true' && process.env.UPSTASH_REDIS_REST_URL) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });
}

class DedupService {
  /**
   * Check if an event ID has already been processed
   * Uses Redis for fast lookup, falls back to database
   */
  async isDuplicate(eventId: string, sourceService: string): Promise<boolean> {
    if (!eventId) return false;

    try {
      // Try Redis first (fast)
      if (redisClient) {
        const key = `audit:dedup:${eventId}`;
        const exists = await redisClient.get(key);
        if (exists) {
          console.log(`[Dedup] Duplicate event detected (Redis): ${eventId}`);
          return true;
        }
      }

      // Check database
      const existing = await prisma.eventDedup.findUnique({
        where: { eventId },
      });

      if (existing) {
        console.log(`[Dedup] Duplicate event detected (DB): ${eventId}`);
        
        // Cache in Redis if not already there
        if (redisClient) {
          const key = `audit:dedup:${eventId}`;
          await redisClient.set(key, '1', { ex: 3600 }); // 1 hour TTL
        }
        
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[Dedup] Error checking duplicate:', error);
      // On error, allow the event (fail open)
      return false;
    }
  }

  /**
   * Mark an event as processed
   */
  async markAsProcessed(eventId: string, sourceService: string): Promise<void> {
    if (!eventId) return;

    try {
      // Store in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Keep for 7 days

      await prisma.eventDedup.create({
        data: {
          eventId,
          sourceService,
          expiresAt,
        },
      });

      // Store in Redis for fast lookup
      if (redisClient) {
        const key = `audit:dedup:${eventId}`;
        await redisClient.set(key, '1', { ex: 604800 }); // 7 days TTL
      }

      console.log(`[Dedup] Event marked as processed: ${eventId}`);
    } catch (error: any) {
      console.error('[Dedup] Error marking event as processed:', error);
      // Don't throw - dedup failure shouldn't break audit logging
    }
  }

  /**
   * Clean up expired dedup records (run periodically)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.eventDedup.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`[Dedup] Cleaned up ${result.count} expired dedup records`);
      return result.count;
    } catch (error: any) {
      console.error('[Dedup] Error cleaning up expired records:', error);
      return 0;
    }
  }
}

export default new DedupService();
