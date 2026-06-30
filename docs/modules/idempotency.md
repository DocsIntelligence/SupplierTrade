# idempotency

## Purpose
Make POST/PUT/PATCH safe to retry. Opt-in per handler with `@Idempotent()`. Requires the client to send `Idempotency-Key: <uuid>`. The first successful response is cached for 24h (configurable); replays return the cached response without re-executing the handler.

## Files
- `apps/api/src/app/idempotency/idempotency.module.ts` (global)
- `apps/api/src/app/idempotency/idempotent.decorator.ts`
- `apps/api/src/app/idempotency/idempotency.interceptor.ts`

## Prisma models
`IdempotencyKey`. Purged hourly by `cron` module.

## Usage
```ts
@UseInterceptors(IdempotencyInterceptor)
@Idempotent({ ttlSeconds: 86_400 })
@Post('payments') createPayment(@Body() body: ...) { ... }
```

Or apply globally in `main.ts`: `app.useGlobalInterceptors(app.get(IdempotencyInterceptor))` — every `@Idempotent` handler then opts in.

## Plug into a new project
1. Copy `apps/api/src/app/idempotency/`.
2. Add `IdempotencyKey` to Prisma.
3. Import `IdempotencyModule` (global).
4. Decorate write handlers with `@Idempotent()` + register `IdempotencyInterceptor` (globally or per controller).
