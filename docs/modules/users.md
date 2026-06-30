# users

## Purpose
User CRUD + profile update + account deletion. Issues no tokens (that's auth's job) — this module is just data.

## Files
- `apps/api/src/app/users/users.module.ts`
- `apps/api/src/app/users/users.service.ts`
- `apps/api/src/app/users/users.controller.ts`
- `apps/api/src/app/users/dto/*`

## Env vars
None.

## Prisma models
`User`, `Secrets` (via `auth` for password update).

## Endpoints (selected)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/users/me` | jwt | current user profile |
| PATCH | `/users/me` | jwt | partial profile update |
| DELETE | `/users/me` | jwt | self-delete |

## Admin UI
`/config/users` — list, search, promote / demote role.

## Plug into a new project
1. Copy `apps/api/src/app/users/`.
2. Add `UsersModule` to `app.module.ts`.

## Extending
Add a new field to `User` in `schema.prisma`, regenerate Prisma, and surface it via the DTOs + controller.
