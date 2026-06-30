# audit

## Purpose
Append-only `AuditLog` of who-did-what. Use `AuditService.record(...)` directly, or tag a handler with `@Audit({ action, targetType })` and `AuditInterceptor` writes the row on success.

## Files
- `apps/api/src/app/audit/audit.module.ts` (global)
- `apps/api/src/app/audit/audit.service.ts`
- `apps/api/src/app/audit/audit.decorator.ts` — `@Audit({...})`
- `apps/api/src/app/audit/audit.interceptor.ts`
- `apps/api/src/app/audit/audit.controller.ts` — admin query

## Prisma models
`AuditLog`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/admin/audit` | admin | filter by actor/org/action/targetType, paginated |

## Admin UI
TODO: `/config/audit` (table) — backing endpoint ready.

## Plug into a new project
1. Copy `apps/api/src/app/audit/`.
2. Add `AuditLog` to Prisma.
3. Import `AuditModule` in `app.module.ts` (global).
4. Tag handlers with `@Audit({ action: 'plan.create', targetType: 'plan' })` to enable auto-recording, or call `audit.record({ ... })` from any service.
