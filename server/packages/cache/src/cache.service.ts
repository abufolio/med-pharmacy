import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

// ── Cache Key Helpers ──
export const CacheKeys = {
  cashbackRule: (pharmacyId: string) => `cashback_rule:${pharmacyId}`,
  userBalance: (userId: string) => `user_balance:${userId}`,
  cardUid: (uid: string) => `card_uid:${uid}`,
  permissions: (roleId: string) => `permissions:${roleId}`,
  setting: (key: string) => `setting:${key}`,
} as const;

// ── Cache TTL Constants (seconds) ──
export const CacheTTL = {
  VERY_SHORT: 30,     // user balance
  SHORT: 300,         // 5 min — cashback rules, card UID
  MEDIUM: 1800,       // 30 min
  LONG: 3600,         // 1 hr — permissions, settings
} as const;

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });

    this.redis.on('connect', () => this.logger.log('✅ Redis connected'));
    this.redis.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // ── Generic Cache Operations ──

  /**
   * Ping Redis server — returns 'PONG' on success
   */
  async ping(): Promise<string> {
    try {
      return await this.redis.ping();
    } catch {
      return 'ERROR';
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn(`Cache get failed for ${key}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      this.logger.warn(`Cache set failed for ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Cache del failed for ${key}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cleared ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      this.logger.warn(`Cache delPattern failed for ${pattern}`);
    }
  }

  // ── Cache-Aside Pattern ──

  /**
   * Cache-aside: tries cache first, falls back to loader function.
   * On cache miss, loads data, caches it, and returns.
   */
  async remember<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await loader();
    await this.set(key, data, ttl);
    return data;
  }

  // ── Specialized Cache Methods ──

  invalidatePharmacyCache(pharmacyId: string): Promise<void> {
    return this.delPattern(`*:${pharmacyId}`);
  }

  invalidateUserCache(userId: string): Promise<void> {
    return this.del(CacheKeys.userBalance(userId));
  }

  invalidateCardCache(uid: string): Promise<void> {
    return this.del(CacheKeys.cardUid(uid));
  }
}
