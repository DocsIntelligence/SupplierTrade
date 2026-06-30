# auth

## Purpose
Authentication for every API call. Supports email + password (local), OAuth (Google / GitHub / LinkedIn), and Passkeys (WebAuthn). Issues JWT access + refresh tokens (cookie + bearer). Globally guards every route — opt out per-handler with `@Public()`.

## Files
- `apps/api/src/app/auth/auth.module.ts`
- `apps/api/src/app/auth/auth.service.ts` — local + JWT lifecycle
- `apps/api/src/app/auth/passkey.service.ts`
- `apps/api/src/app/auth/user-identity.service.ts` — OAuth identity binding
- `apps/api/src/app/auth/strategies/*` — local, jwt, refresh-jwt, google, github, linkedin
- `apps/api/src/app/auth/guards/*` — local, jwt, refresh-jwt, roles, OAuth guards
- `apps/api/src/app/auth/decorators/*` — `@Public`, `@CurrentUser`, `@Roles`
- `apps/api/src/app/auth/dto/*`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `ACCESS_TOKEN_SECRET`  | yes | ≥16 chars |
| `ACCESS_TOKEN_TTL`     | yes | e.g. `15m` |
| `REFRESH_TOKEN_SECRET` | yes | ≥16 chars |
| `REFRESH_TOKEN_TTL`    | yes | e.g. `7d` |
| `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`     | no | provider disabled if missing |
| `GITHUB_CLIENT_ID/SECRET/CALLBACK_URL`     | no | provider disabled if missing |
| `LINKEDIN_CLIENT_ID/SECRET/CALLBACK_URL`   | no | provider disabled if missing |

## Providers / abstractions
- Passport strategies — pluggable. Each OAuth strategy reads its own env vars at construction; if any is missing it logs a warning and skips registration.
- Cookie-based session for the browser, bearer for API clients.

## Prisma models
`User`, `Secrets`, `UserIdentity`, `Passkey`, `Challenge`.

## Endpoints (selected)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | public | local sign-up |
| POST | `/auth/login`    | public | local sign-in |
| POST | `/auth/refresh`  | refresh-jwt | rotate access token |
| POST | `/auth/forgot-password` | public | email + reset token |
| POST | `/auth/reset-password`  | public | consume reset token |
| GET  | `/auth/google` / `/auth/github` / `/auth/linkedin` | public | start OAuth |
| GET  | `/auth/<provider>/callback` | public | finish OAuth + issue tokens |
| GET  | `/auth/me`       | jwt | current user |
| POST | `/auth/logout`   | jwt | clear cookie + revoke refresh |

## Admin UI
None directly. User listing/role flip lives in `/config/users` (admin module).

## Plug into a new project
1. Copy `apps/api/src/app/auth/`.
2. Add required env vars to `.env` and `config/schema.ts`.
3. Configure at least one OAuth provider (or none if local-only is fine).
4. Import `AuthModule` in `app.module.ts`. The global JWT guard is wired via `AuthModule` — no extra steps.

## Extending
Add an OAuth provider by:
1. `pnpm add passport-<provider>`
2. Create `strategies/<provider>.ts` mirroring `google.ts`
3. Add a guard + a controller route pair (`@UseGuards(<Provider>AuthGuard)`)
4. Add env vars in `schema.ts` and to `OPTIONAL_GROUPS`
