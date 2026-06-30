import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'CACHE_REDIS_CLIENT';

/**
 * Project-wide cache. Uses Redis when `REDIS_URL` is set, falls back to an
 * in-process LRU otherwise. The LRU fallback is non-shared — fine for dev or
 * single-instance deploys, not for multi-instance prod (set Redis there).
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly lru = new LRUCache<string, { v: unknown; exp: number }>({
    max: 5000,
  });

  constructor(
    private readonly config: ConfigService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {
    if (!redis && !this.config.get<string>('REDIS_URL')) {
      this.logger.log('CacheService: using in-process LRU (no REDIS_URL)');
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (this.redis) {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    }
    const hit = this.lru.get(key);
    if (!hit) return undefined;
    if (hit.exp < Date.now()) {
      this.lru.delete(key);
      return undefined;
    }
    return hit.v as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
    this.lru.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.lru.delete(key);
  }

  /**
   * Read-through helper: return cached value if hit, else compute, cache, return.
   * Use a stable, namespaced key (e.g. `lookups:countries`).
   */
  async wrap<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit !== undefined) return hit;
    const v = await compute();
    await this.set(key, v, ttlSeconds);
    return v;
  }
}
