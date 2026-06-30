# health

## Purpose
Liveness probe for orchestration (Kubernetes / load balancers / uptime monitors).

## Files
- `apps/api/src/app/health/health.controller.ts`
- `apps/api/src/app/health/health.module.ts`

## Env vars
None.

## Endpoints
| Method | Path     | Auth   | Body | Returns |
|--------|----------|--------|------|---------|
| GET    | `/health` | public | —    | `{ status: 'ok', uptime }` |

## Admin UI
None.

## Plug into a new project
Copy as-is and add to `app.module.ts` imports.

## Extending
Add a DB ping by injecting `DatabaseService` and running `SELECT 1` — return `503` on failure.
