# cache

## Purpose
Project-wide caching with read-through `wrap(key, ttl, compute)`. Uses Redis when `REDIS_URL` is set, falls back to an in-process LRU otherwise.

## Files
- `apps/api/src/app/cache/cache.module.ts` (global)
- `apps/api/src/app/cache/cache.service.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `REDIS_URL` | no | enables shared Redis cache; without it cache is per-process LRU |

## API
```ts
constructor(private readonly cache: CacheService) {}

const countries = await this.cache.wrap('lookups:countries', 600, () =>
  this.db.lookupValue.findMany({ where: { group: { key: 'countries' } } }),
);
```

`get<T>(key)`, `set(key, value, ttlSeconds)`, `del(key)`, `wrap<T>(key, ttl, compute)`.

## Plug into a new project
1. Copy `apps/api/src/app/cache/`.
2. `pnpm add lru-cache ioredis`.
3. Import `CacheModule` in `app.module.ts` (global) — `CacheService` is auto-injectable everywhere.
