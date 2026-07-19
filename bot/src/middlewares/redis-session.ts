/**
 * Redis session adapter for grammY.
 * Implements the StorageAdapter interface for production session storage.
 *
 * TechSpec 15.3 — Redis-based session persistence with 24h TTL.
 */

import Redis from "ioredis";
import { StorageAdapter } from "grammy";
import { SessionData } from "../types";
import { config } from "../config";

const TTL_SECONDS = 86_400; // 24 hours

export function createRedisSessionAdapter(): StorageAdapter<SessionData> {
  const client = new Redis(config.redis.url, {
    keyPrefix: config.redis.keyPrefix,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null; // give up
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  // Log connection errors without crashing the process
  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  return {
    async read(key: string): Promise<SessionData | undefined> {
      try {
        const raw = await client.get(key);
        if (!raw) return undefined;
        return JSON.parse(raw) as SessionData;
      } catch (err) {
        console.error("[Redis] read error:", err);
        return undefined;
      }
    },

    async write(key: string, value: SessionData): Promise<void> {
      try {
        const raw = JSON.stringify(value);
        await client.setex(key, TTL_SECONDS, raw);
      } catch (err) {
        console.error("[Redis] write error:", err);
      }
    },

    async delete(key: string): Promise<void> {
      try {
        await client.del(key);
      } catch (err) {
        console.error("[Redis] delete error:", err);
      }
    },
  };
}
