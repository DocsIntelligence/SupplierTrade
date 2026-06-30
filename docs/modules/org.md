# org

## Purpose
Multi-tenancy. `Organization` + `Membership` (one user → many orgs, role per org). `Owner` cannot be removed if last.

## Files
- `apps/api/src/app/org/org.module.ts`
- `apps/api/src/app/org/org.service.ts`
- `apps/api/src/app/org/org.controller.ts`
- `apps/api/src/app/org/current-org.decorator.ts` — `@CurrentOrgId()` reads `x-org-id` header

## Prisma models
`Organization`, `Membership`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/orgs/me` | jwt | orgs I belong to (incl. my role) |
| POST | `/orgs` | jwt | create org (caller becomes owner) |
| GET | `/orgs/:slug` | jwt | get one |
| GET | `/orgs/:id/members` | jwt member | list members |
| PATCH | `/orgs/:id/members/:userId/role` | admin/owner | change role |
| DELETE | `/orgs/:id/members/:userId` | admin/owner | remove member |

## Admin UI
`/config/orgs` (TODO — backing endpoints ready).

## Plug into a new project
1. Copy `apps/api/src/app/org/`.
2. Add `Organization` + `Membership` to Prisma.
3. Import `OrgModule`. Other modules can inject `OrgService` and call `assertMember(orgId, userId)` / `assertPrivileged(...)`.
