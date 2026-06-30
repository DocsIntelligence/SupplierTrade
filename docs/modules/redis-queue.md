# redis-queue (infra)

## Purpose
Optional queue + cache infrastructure powered by BullMQ + ioredis. Wired today only by the **mail** module; designed so any other module can opt in by calling `BullModule.registerQueueAsync(...)`.

## Files
No standalone module. Each consumer registers its own queue (see `apps/api/src/app/mail/mail.module.ts` for the canonical pattern).

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `REDIS_URL` | no | When absent, queues are disabled and consumers fall back to synchronous execution. |

## Providers / abstractions
- `@nestjs/bullmq` for module registration.
- `bullmq` + `ioredis` at runtime.
- Convention: every queue-using module exports a boolean `<MODULE>_QUEUE_ENABLED` provider so the sync/async branch is testable.

## Endpoints
None.

## Admin UI
None today. Future: a queue inspector page under `/config/queues`.

## Plug into a new project
1. Copy the BullMQ + ioredis dependencies (`package.json`).
2. Pattern after `mail.module.ts` — wrap your module in `.forRootAsync()` and register the queue only when `REDIS_URL` is set.

## Extending
Add a new queue by:
1. Registering the queue + its processor in a `.forRootAsync()` factory.
2. Reading `REDIS_URL` to decide between async and sync paths.
3. Logging warnings + writing an audit row in both paths.
