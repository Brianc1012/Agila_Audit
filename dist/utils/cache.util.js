"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.deleteCache = deleteCache;
exports.generateCacheKey = generateCacheKey;
exports.generateUserCacheKey = generateUserCacheKey;
exports.invalidatePattern = invalidatePattern;
exports.invalidateService = invalidateService;
exports.invalidateSummaries = invalidateSummaries;
exports.invalidateStats = invalidateStats;
exports.invalidateRecent = invalidateRecent;
exports.withCache = withCache;
exports.disconnect = disconnect;
exports.clearAll = clearAll;
const ioredis_1 = __importDefault(require("ioredis"));
const lru_cache_1 = require("lru-cache");
const ENABLE_CACHE = process.env.ENABLE_CACHE === 'true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);
const lruCache = new lru_cache_1.LRUCache({
    max: 500,
    maxSize: 50 * 1024 * 1024,
    sizeCalculation: (value) => value.length,
    ttl: DEFAULT_TTL * 1000,
    updateAgeOnGet: true,
    updateAgeOnHas: false,
});
let currentCacheMode = 'disabled';
let redisClient = null;
let startupMessageShown = false;
function initializeRedis() {
    if (!ENABLE_CACHE) {
        currentCacheMode = 'disabled';
        if (!startupMessageShown) {
            console.log('ℹ️  Cache disabled (ENABLE_CACHE=false)');
            startupMessageShown = true;
        }
        return;
    }
    try {
        redisClient = new ioredis_1.default(REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            retryStrategy: (times) => {
                if (times > 3) {
                    if (!startupMessageShown) {
                        console.warn('⚠️  Redis unavailable. Local cache fallback active.');
                        startupMessageShown = true;
                    }
                    currentCacheMode = 'lru';
                    return null;
                }
                return Math.min(times * 50, 2000);
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
    }
    catch (error) {
        console.error('❌ Failed to initialize Redis:', error);
        currentCacheMode = 'lru';
        if (!startupMessageShown) {
            console.warn('⚠️  Local cache fallback active.');
            startupMessageShown = true;
        }
    }
}
initializeRedis();
async function restGet(key) {
    if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN)
        return null;
    try {
        const response = await fetch(`${UPSTASH_REST_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${UPSTASH_REST_TOKEN}` },
        });
        const data = await response.json();
        return data.result || null;
    }
    catch (error) {
        console.error('REST GET error:', error);
        return null;
    }
}
async function restSet(key, value, ttl) {
    if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN)
        return;
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
    }
    catch (error) {
        console.error('REST SET error:', error);
    }
}
async function restDel(key) {
    if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN)
        return;
    try {
        await fetch(UPSTASH_REST_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(['DEL', key]),
        });
    }
    catch (error) {
        console.error('REST DEL error:', error);
    }
}
async function getCache(key) {
    if (!ENABLE_CACHE)
        return null;
    try {
        if (currentCacheMode === 'redis' && redisClient) {
            const value = await redisClient.get(key);
            if (value) {
                console.log(`✅ Cache hit (Redis): ${key}`);
                return JSON.parse(value);
            }
        }
        if (currentCacheMode === 'lru' && UPSTASH_REST_URL) {
            const value = await restGet(key);
            if (value) {
                console.log(`✅ Cache hit (REST): ${key}`);
                return JSON.parse(value);
            }
        }
        const lruValue = lruCache.get(key);
        if (lruValue) {
            console.log(`✅ Cache hit (LRU): ${key}`);
            return JSON.parse(lruValue);
        }
        console.log(`❌ Cache miss: ${key}`);
        return null;
    }
    catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}
async function setCache(key, value, ttlInSeconds) {
    if (!ENABLE_CACHE)
        return;
    try {
        const stringValue = JSON.stringify(value);
        const ttl = ttlInSeconds || DEFAULT_TTL;
        if (currentCacheMode === 'redis' && redisClient) {
            await redisClient.set(key, stringValue, 'EX', ttl);
            console.log(`💾 Cached (Redis): ${key} [TTL: ${ttl}s]`);
        }
        if (currentCacheMode === 'lru' && UPSTASH_REST_URL) {
            await restSet(key, stringValue, ttl);
            console.log(`💾 Cached (REST): ${key} [TTL: ${ttl}s]`);
        }
        lruCache.set(key, stringValue, { ttl: ttl * 1000 });
        if (currentCacheMode === 'lru') {
            console.log(`💾 Cached (LRU): ${key} [TTL: ${ttl}s]`);
        }
    }
    catch (error) {
        console.error('Cache set error:', error);
    }
}
async function deleteCache(key) {
    if (!ENABLE_CACHE)
        return;
    try {
        if (currentCacheMode === 'redis' && redisClient) {
            await redisClient.del(key);
        }
        if (currentCacheMode === 'lru' && UPSTASH_REST_URL) {
            await restDel(key);
        }
        lruCache.delete(key);
        console.log(`🗑️  Deleted cache: ${key}`);
    }
    catch (error) {
        console.error('Cache delete error:', error);
    }
}
function generateCacheKey(namespace, params) {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});
    return `audit:${namespace}:${JSON.stringify(sortedParams)}`;
}
function generateUserCacheKey(namespace, userId, userRole, params = {}) {
    return generateCacheKey(namespace, { ...params, userId, userRole });
}
async function invalidatePattern(pattern) {
    if (!ENABLE_CACHE || currentCacheMode !== 'redis' || !redisClient) {
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
    }
    catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
}
async function invalidateService(serviceName) {
    return await invalidatePattern(`audit:*serviceName*${serviceName}*`);
}
async function invalidateSummaries() {
    return await invalidatePattern('audit:summaries:*');
}
async function invalidateStats() {
    return await invalidatePattern('audit:stats:*');
}
async function invalidateRecent() {
    return await invalidatePattern('audit:recent:*');
}
async function withCache(key, fetchFunction, ttl) {
    const cached = await getCache(key);
    if (cached !== null) {
        return cached;
    }
    const data = await fetchFunction();
    await setCache(key, data, ttl);
    return data;
}
async function disconnect() {
    if (redisClient) {
        await redisClient.quit();
        console.log('✅ Redis cache disconnected');
    }
}
async function clearAll() {
    if (!ENABLE_CACHE)
        return;
    try {
        if (currentCacheMode === 'redis' && redisClient) {
            await redisClient.flushdb();
            console.log('🗑️  Cleared all Redis cache');
        }
        lruCache.clear();
        console.log('🗑️  Cleared all LRU cache');
    }
    catch (error) {
        console.error('Cache clear error:', error);
    }
}
exports.default = {
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
    getCached: getCache,
    setCached: setCache,
    deleteCached: deleteCache,
};
