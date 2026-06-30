# 16 — Tier 1 + Tier 3 Boilerplate Upgrade Plan

Status: in-progress (2026-06-30)
Owner: autonomous build
Goal: Take the starter from "API + UI surface complete" to "fork this and ship a B2B SaaS". Tier 2 (Sentry, Stripe, React Email, etc.) is intentionally deferred — it's project-specific.

## Phases

### Phase A — Prisma generic models

| Model | Fields (key columns) | Purpose |
|-------|----------------------|---------|
| `AuditLog`         | `actorId`, `orgId?`, `action`, `targetType?`, `targetId?`, `before? Json`, `after? Json`, `ip?`, `ua?`, `createdAt` | T1.1 |
| `Organization`     | `name`, `slug @unique`, `image?`, `createdAt`, `updatedAt` | T1.2 |
| `Membership`       | `userId`, `orgId`, `role`, `createdAt`; unique `(userId, orgId)` | T1.2 |
| `Invitation`       | `orgId`, `email`, `role`, `tokenHash @unique`, `invitedBy`, `expiresAt`, `acceptedAt?`, `createdAt` | T1.3 |
| `ApiKey`           | `userId`, `orgId?`, `name`, `prefix @unique`, `tokenHash`, `scopes Json`, `lastUsedAt?`, `expiresAt?`, `revokedAt?`, `createdAt` | T1.6 |
| `TwoFactor`        | `userId @unique`, `secret`, `enabled`, `recoveryCodesHash Json`, `confirmedAt?`, `createdAt` | T1.7 |
| `WebhookEndpoint`  | `orgId?`, `url`, `secret`, `events Json`, `active`, `createdAt`, `updatedAt` | T1.8 |
| `WebhookDelivery`  | `endpointId`, `event`, `payload Json`, `status`, `attempt`, `responseStatus?`, `responseBody?`, `nextAttemptAt?`, `deliveredAt?`, `createdAt` | T1.8 |
| `IdempotencyKey`   | `key @unique`, `userId?`, `method`, `path`, `responseStatus`, `responseBody Json`, `expiresAt`, `createdAt` | T1.9 |

`User` gets relations: `auditLogs`, `memberships`, `apiKeys`, `twoFactor`, `invitations` (sent).

### Phase B — Modules (in order)

1. **`audit`** — `AuditService.record(actor, action, target, before?, after?)` + interceptor that wraps handlers tagged `@Audit('action', target)` + admin query API.
2. **`org`** — `Organization`+`Membership` CRUD, `/orgs/me` list, `/orgs/:slug` get, `/orgs` create, `/orgs/:id/members` list, role change endpoint. `@CurrentOrg()` decorator + `OrgGuard` resolving org from `x-org-slug` header or path. Scoped Prisma helpers.
3. **`invitations`** — `/orgs/:id/invitations` create, `/invitations/:token` accept, `/orgs/:id/invitations` list, revoke. Uses `MailService` + `invitation` email template.
4. **`cron`** — `@nestjs/schedule`. Move `ai-usage.purge` + a new `mail-log.purge` to cron. Each cron also exposes `@Post('/admin/cron/:name/run')` for manual trigger.
5. **`cache`** — `CacheService` w/ `get/set/del/wrap(key, ttl, () => val)`. ioredis when `REDIS_URL` set; in-memory map fallback.
6. **`api-keys`** — `/me/api-keys` CRUD. Token shape `pak_<prefix>_<random>` (prefix lives in DB; full token shown only at create). `ApiKeyGuard` accepts `Authorization: Bearer pak_...` alongside JWT.
7. **`email-verify` + `totp`** — Wire register → `/auth/verify-email?token=` round-trip end-to-end; `/auth/totp/setup`, `/auth/totp/confirm`, `/auth/totp/disable`, `/auth/totp/recovery` using `otplib`. New `recovery-codes` table fields on `TwoFactor`.
8. **`webhooks`** — `/orgs/:id/webhooks` CRUD; dispatcher: `WebhookService.dispatch(event, payload)` enqueues a BullMQ job `webhook` per matching endpoint; processor with exponential backoff (5 attempts), HMAC-SHA256 signature in `X-Webhook-Signature`, delivery log row per attempt.
9. **`idempotency`** — Interceptor that on POST/PUT/PATCH with `Idempotency-Key` header looks up `IdempotencyKey`, returns cached response on hit, stores on miss. Opt-in via `@Idempotent()` decorator.

### Phase C — Admin UI

- `/config/audit` — log table + actor + action + target filters.
- `/config/orgs` — list orgs, manage members.
- `/config/api-keys` — list user keys, revoke.
- `/config/webhooks` — endpoint CRUD + delivery log.
- `/config/cron` — list crons, run-now button.
- T3.21: `/config/storage` (browse + delete) and `/config/queues` (counts per queue + recent jobs).

### Phase D — Infra & DX (T1.10)

- `.env.example` — every key in `config/schema.ts`, grouped, with inline `# why`.
- `docker-compose.yml` — postgres 16, redis 7, minio, maildev. Volumes, healthchecks.
- `.github/workflows/ci.yml` — pnpm install, prisma generate, nx lint, nx build, nx test on PR and main.

### Phase E — Polish (T3)

- **T3.19**: convert each `Config*` import in `app/app.tsx` to `React.lazy(() => import(...))`; wrap `/config` routes in a `<Suspense>`.
- **T3.20**: `lookup.service.spec.ts` (unit, Prisma mock) + `lookup.e2e-spec.ts` (supertest against a fresh nest test app).

### Phase F — Docs

- `docs/modules/<name>.md` for each new module (audit, org, invitations, cron, cache, api-keys, email-verify, totp, webhooks, idempotency, storage-browser, queues).
- Update `docs/00-MODULES-INDEX.md`.
- Update `docs/TASKS.md` + append `docs/BUILD_LOG.md`.

## Validation gates

- `pnpm exec prisma migrate dev --name tier1_modules` clean
- `pnpm nx run @org/api:build` green
- `pnpm nx run @org/app:build` green
- New file count ≈ 60; expected lint: 0 errors from new code

## Out of scope (Tier 2, deferred)

Sentry, Stripe, Apple/Microsoft OAuth, generic search, React Email, Helmet+CSRF+request-id (most are 1-file additions but project-specific).
