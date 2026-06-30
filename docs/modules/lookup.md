# lookup

## Purpose
Dynamic master data — every dropdown / static-list value the product needs (e.g. country, occupation, plan tier, document type). One table of groups, one table of values, both editable from the admin UI.

## Files
- `apps/api/src/app/lookup/lookup.module.ts`
- `apps/api/src/app/lookup/lookup.service.ts`
- `apps/api/src/app/lookup/lookup.controller.ts`

## Env vars
None.

## Prisma models
`LookupGroup` (`key`, `name`, `isPublic`), `LookupValue` (`label`, `value`, `order`, `isActive`, `isDefault`, `metadata`).

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/lookups`                       | public (per group) | list all groups + values |
| GET | `/lookups/:key`                  | public | values for one group |
| POST | `/lookups`                      | admin | create group |
| POST | `/lookups/:groupId/values`      | admin | create value |
| PATCH | `/lookups/values/:valueId`     | admin | toggle active / reorder |
| DELETE | `/lookups/values/:valueId`    | admin | delete value |

## Admin UI
`/config/lookups`.

## Plug into a new project
1. Copy `apps/api/src/app/lookup/`.
2. Seed initial groups via `tools/scripts/seed-lookups.ts` (already in this repo as a starting point).

## Extending
For per-value richer schema use the `metadata` JSON field (e.g. salary ranges, country dial codes).
