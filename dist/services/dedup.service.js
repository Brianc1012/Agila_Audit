"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const redis_1 = require("@upstash/redis");
let redisClient = null;
if (process.env.ENABLE_CACHE === 'true' && process.env.UPSTASH_REDIS_REST_URL) {
    redisClient = new redis_1.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
}
class DedupService {
    async isDuplicate(eventId, sourceService) {
        if (!eventId)
            return false;
        try {
            if (redisClient) {
                const key = `audit:dedup:${eventId}`;
                const exists = await redisClient.get(key);
                if (exists) {
                    console.log(`[Dedup] Duplicate event detected (Redis): ${eventId}`);
                    return true;
                }
            }
            const existing = await client_1.prisma.eventDedup.findUnique({
                where: { eventId },
            });
            if (existing) {
                console.log(`[Dedup] Duplicate event detected (DB): ${eventId}`);
                if (redisClient) {
                    const key = `audit:dedup:${eventId}`;
                    await redisClient.set(key, '1', { ex: 3600 });
                }
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('[Dedup] Error checking duplicate:', error);
            return false;
        }
    }
    async markAsProcessed(eventId, sourceService) {
        if (!eventId)
            return;
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await client_1.prisma.eventDedup.create({
                data: {
                    eventId,
                    sourceService,
                    expiresAt,
                },
            });
            if (redisClient) {
                const key = `audit:dedup:${eventId}`;
                await redisClient.set(key, '1', { ex: 604800 });
            }
            console.log(`[Dedup] Event marked as processed: ${eventId}`);
        }
        catch (error) {
            console.error('[Dedup] Error marking event as processed:', error);
        }
    }
    async cleanupExpired() {
        try {
            const result = await client_1.prisma.eventDedup.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
            console.log(`[Dedup] Cleaned up ${result.count} expired dedup records`);
            return result.count;
        }
        catch (error) {
            console.error('[Dedup] Error cleaning up expired records:', error);
            return 0;
        }
    }
}
exports.default = new DedupService();
