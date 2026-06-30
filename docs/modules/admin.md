# admin

## Purpose
Cross-cutting admin endpoints — user stats, role flips, user delete. Most module-specific admin work lives in that module's own `*-admin.controller.ts` (see verification) or under `/admin/<module>` (see plans, mail-logs).

## Files
- `apps/api/src/app/admin/admin.module.ts`
- `apps/api/src/app/admin/admin.service.ts`
- `apps/api/src/app/admin/admin.controller.ts`

## Env vars
None.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/admin/stats` | admin | counts (users, payments, wallets) |
| GET | `/admin/users` | admin | user list |
| PATCH | `/admin/users/:id/role` | admin | promote / demote |
| DELETE | `/admin/users/:id` | admin | delete (blocks self-delete + last-admin) |

## Admin UI
- Legacy `AdminDashboard` page at `/admin` — quick overview.
- New `/config/*` shell — module-by-module pages (see [00-MODULES-INDEX.md](../00-MODULES-INDEX.md)).

## Plug into a new project
Copy `apps/api/src/app/admin/` and the corresponding UI pages.

## Extending
For a new module that needs admin endpoints, prefer a `<module>-admin.controller.ts` next to the module — keeps the admin surface area discoverable per-module.
