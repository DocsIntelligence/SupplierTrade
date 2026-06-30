# database

## Purpose
Thin wrapper around the Prisma client so every other module can inject `DatabaseService` instead of constructing its own Prisma instance. Global module — no need to import it more than once.

## Files
- `apps/api/src/app/database/database.module.ts`
- `apps/api/src/app/database/database.service.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | yes | SQLite path or Postgres URL. SQLite default: `file:./dev.db`. |

## Providers / abstractions
None — Prisma is the abstraction.

## Prisma models touched
All of them. The Prisma schema lives at `tools/prisma/schema.prisma`.

## Endpoints
None. Used via DI only: `constructor(private db: DatabaseService) {}`.

## Admin UI
None.

## Plug into a new project
1. Copy `apps/api/src/app/database/`.
2. Ensure `DATABASE_URL` is in `.env`.
3. Run `pnpm prisma generate` and `pnpm prisma migrate dev`.

## Extending
Switch to Postgres by changing the `datasource db` block in `schema.prisma` and re-running `prisma migrate dev`. Enums then become real Postgres enums — drop the union-type shim in `libs/shared/utils/src/lib/enums.ts`.
