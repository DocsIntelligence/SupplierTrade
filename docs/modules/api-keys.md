# api-keys

## Purpose
Long-lived Personal Access Tokens for machine-to-machine API access. Token shape `pak_<prefix>_<secret>`; prefix is public + indexed for fast lookup, secret is bcrypt-hashed at rest. Raw token shown ONCE at creation. `ApiKeyGuard` accepts `Authorization: Bearer pak_...`.

## Files
- `apps/api/src/app/api-keys/api-keys.module.ts`
- `apps/api/src/app/api-keys/api-keys.service.ts`
- `apps/api/src/app/api-keys/api-keys.controller.ts`
- `apps/api/src/app/api-keys/api-key.guard.ts`

## Prisma models
`ApiKey`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/me/api-keys` | jwt | list my keys (no secrets) |
| POST | `/me/api-keys` | jwt | `{ name, scopes?, expiresAt?, orgId? }` — returns raw `token` ONCE |
| DELETE | `/me/api-keys/:id` | jwt | revoke |

## Using the guard
```ts
@UseGuards(ApiKeyGuard) @Get('billing/usage') usage(@CurrentUser() u: { id: string; scopes: string[] }) { ... }
```

## Plug into a new project
1. Copy `apps/api/src/app/api-keys/`.
2. Add `ApiKey` to Prisma.
3. Import `ApiKeysModule`. To allow a route to authenticate via API key, slap `@UseGuards(ApiKeyGuard)` on the handler.
