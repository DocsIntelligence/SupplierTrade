# cron

## Purpose
Scheduled jobs via `@nestjs/schedule`. Ships 4 generic cleanup jobs:
- `idempotency.purge` (hourly)
- `invitations.purge` (every 6h)
- `mail-logs.purge` (daily 03:00)
- `audit.purge` (daily 03:30)

Each is callable on-demand via `POST /admin/cron/:name/run` for admins.

## Files
- `apps/api/src/app/cron/cron.module.ts`
- `apps/api/src/app/cron/cron.jobs.ts`
- `apps/api/src/app/cron/cron.controller.ts`

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/admin/cron` | admin | list registered jobs + running state |
| POST | `/admin/cron/:name/run` | admin | trigger now |

## Plug into a new project
1. Copy `apps/api/src/app/cron/`.
2. `pnpm add @nestjs/schedule`.
3. Import `CronModule` in `app.module.ts`.
4. Add new `@Cron('...', { name: '...' })` methods on `CronJobs` and add an entry to `manualRunners()`.
