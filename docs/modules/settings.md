# settings

## Purpose
Scoped key-value config store. Three scopes: `system`, `org`, `user`. Lookup walks user → org → system → built-in default; the narrowest scope wins. 30-second in-memory cache.

## Files
- `apps/api/src/app/settings/settings.module.ts`
- `apps/api/src/app/settings/settings.service.ts`
- `apps/api/src/app/settings/settings.controller.ts`
- `apps/api/src/app/settings/settings.keys.ts` — typed key catalogue + defaults

## Env vars
None.

## Prisma models
`Setting`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/settings` | admin | list (with scope filter) |
| GET | `/settings/:key` | jwt | resolve with scope hierarchy |
| POST | `/settings` | admin | upsert one |

## Admin UI
`/config/settings`.

## Plug into a new project
1. Copy `apps/api/src/app/settings/`.
2. Extend `settings.keys.ts` with your project's keys + defaults.

## Extending
Add a new typed key to `settings.keys.ts` with a default. Consumers call `settings.get(<KEY>, { scope, scopeId })`.
