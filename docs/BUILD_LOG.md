# Build log

Append-only record of phases that land. Newest at the top.

## 2026-07-01 — India market analysis + Phase 2A plan

- Added `docs/17-suppliertrade-market-next-phase-PLAN.md` with India agri-output market read, competitor map, pricing hypothesis, ICP, and a buildable Phase-2A scope.
- Updated `PLANNING.md` current focus from Phase 1 to **Phase 2A: RFQ + verified matching + paid QC validation**.
- Converted the Phase-0 pricing open question into a testable price card: `verification_fee = ₹1,500`, `qc_fee = ₹1,200`, field QC ₹2,500-₹5,000.
- Added Phase-2A tasks for RFQ models, DTOs, API, deterministic matching, buyer console, read-only domain-config viewer, validation dashboard, and E2E.

## 2026-07-01 — Domain config CI validation

- Added `pnpm domain:validate` (`tools/scripts/validate-domain-configs.ts`) to load every config under `config/domains`, validate against `domain.meta.schema.json`, and assert every referenced verification adapter, QC scorer, workflow guard, and action key is registered.
- Wired the check into CI after migrations so config-as-code failures are caught before build/deploy.
- Added module docs and index entries for the SupplierTrade platform modules: `platform`, `suppliers`, `listings`, `verification-engine`, and `qc`.

## 2026-07-01 — Referrals + seed users + webhooks-no-redis boot fix

- **`referrals` module** — new `Referral` Prisma model + migration `referrals`. `ReferralsService.getMyCode(userId)` lazily assigns a stable 8-char code per user; `attachReferred(code, referredUserId)` links a signup to its referrer (idempotent + rejects self-referral). Stats + admin list + `markRewarded(id, metadata?)` hook. UI: `/referrals` (per-user share + stats) and `/config/referrals` (admin list + mark-awarded). Reward decision is left to the consuming project — boilerplate tracks status only. Docs in `docs/modules/referrals.md`. Index updated.
- **Seed users** — `tools/prisma/seed.ts` now bootstraps `admin@example.com` (role=admin) + `test@example.com` (role=user) with password `"password"` (override via `SEED_PASSWORD` env). `upsertUser` handles "row already owns this username under a different email" gracefully.
- **Webhooks boot fix** — `WebhooksModule.forRootAsync()` was unconditionally registering a BullMQ queue, which crashed boot with `Nest could not find BULLMQ_CONFIG(default)` whenever `REDIS_URL` was absent. Now mirrors the mail pattern exactly: no Redis → no queue + no processor; `WebhooksService.dispatch` falls back to its existing sync HTTP path.

## 2026-06-30 — Tier 1 + Tier 3 upgrade (docs/16)

**All 13 items complete.** Plan: `docs/16-tier1-tier3-PLAN.md`. Tier 2 deferred (project-specific).

### New Prisma models

`AuditLog`, `Organization`, `Membership`, `Invitation`, `ApiKey`, `TwoFactor`, `WebhookEndpoint`, `WebhookDelivery`, `IdempotencyKey`. Migration `20260630175637_tier1_modules` applied.

### New API modules

- **audit** (global) — `AuditService.record()` + `@Audit({ action, targetType })` + `AuditInterceptor`. Admin query at `/admin/audit`.
- **org** — `Organization` + `Membership` CRUD; role gating via `OrgService.assertMember`/`assertPrivileged`; creator becomes `owner`; last-owner protection.
- **invitations** — email + token + 7-day expiry + acceptance flow. New `invitation` mail template.
- **cron** — `@nestjs/schedule` with 4 generic jobs (idempotency.purge hourly, invitations.purge 6h, mail-logs.purge daily, audit.purge daily) + `POST /admin/cron/:name/run`.
- **cache** (global) — `CacheService` w/ `get/set/del/wrap(key, ttl, compute)`. Redis when `REDIS_URL` set, in-process LRU fallback.
- **api-keys** — `pak_<prefix>_<secret>` tokens; bcrypt-hashed at rest; `ApiKeyGuard` accepts `Authorization: Bearer pak_...`; raw token shown ONCE on create.
- **totp** — RFC 6238 via `otplib`; setup → confirm → recovery codes (bcrypt-hashed, burned on use).
- **webhooks** — HMAC-SHA256 signed deliveries (`X-Webhook-Signature: sha256=...`); BullMQ queue `webhooks` with 5 attempts + exponential backoff; sync fallback when no Redis.
- **idempotency** (global) — `@Idempotent()` decorator + interceptor; 24h default TTL; replays cached responses by `Idempotency-Key` header.

### Admin UI additions

- `/config/storage` — file browser (uses existing `/storage/files` endpoint).
- `/config/queues` — BullMQ counts + recent jobs (new `/admin/queues` endpoint).
- Sidebar nav extended in `ConfigLayout`.
- All `/config/*` routes lazy-loaded; chunk-per-page.

### Infra & DX

- `.env.example` already covered the env surface (verified).
- `docker-compose.yml` (postgres 16 + redis 7 + minio + maildev) — local-dev stack.
- `.github/workflows/ci.yml` already in place (verified covers lint+build+prisma).

### Tests (example pattern)

- `apps/api/src/app/lookup/lookup.service.spec.ts` — unit, mocked DB.
- `apps/api/src/app/lookup/lookup.e2e-spec.ts` — supertest with overridden DI.

### Deps added

`@nestjs/schedule`, `otplib`, `lru-cache`.

### Validation

`pnpm nx run @org/api:build` ✅, `pnpm nx run @org/app:build` ✅, prisma generate ✅, migrate dev ✅.

### Open follow-ups

Stripe class, BullMQ-around-render, mail sync template render, `/config/audit|orgs|api-keys|webhooks|cron` UI pages (backing endpoints ready), live socket bell push, Tier 2 items.

## 2026-06-30 — Boilerplate modules migration (docs/15)

**Phases A–F complete.**

- **Prisma**: added `Notification`, `PushSubscription`, `PhoneOtp` (now `target` + `channel` for SMS or email OTP), `UserVerification` (User-bound, `kind` + `payload JSON`, generalised from Matrimonial's Profile-bound model). Migration `20260630132030_add_generic_notification_verification_models` applied.
- **Notification module**: copied + adapted from Matrimonial — dropped the ChatGateway/ChatModule coupling so the boilerplate is socket-agnostic. In-app bell (`/notifications/*`), Web Push (`/push/*`), admin broadcast. `web-push` + `@types/web-push` added to `package.json`.
- **Verification module**: rewritten generically — user-bound, `kind`-based, evidence via `StorageService`, decision email via `MailService` using a new `verification-decision` template.
- **Config schema**: added `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` to `apps/api/src/app/config/schema.ts` + the `OPTIONAL_GROUPS` warning table.
- **Admin UI shell**: new `/config/*` shell at `apps/app/src/app/features/config/`. 10 pages: `Overview`, `Users`, `Plans`, `Payments`, `AiUsage`, `MailLogs`, `Notifications` (broadcast composer), `Verification` (review queue), `Lookups` (wraps existing `AdminLookups`), `Settings`. All use `DataTable` + `@org/ui` + `t('key','English default')` per the UI-consistency rule.
- **Docs**: `docs/00-MODULES-INDEX.md` is the AI-friendly entry point. Per-module docs at `docs/modules/<name>.md` for all 19 generic modules. Each doc is self-contained: purpose, files, env vars, providers, prisma models, endpoints, admin UI, plug-into-new-project recipe, extending notes.
- **Validation**: `pnpm nx run @org/api:build` ✅, `pnpm nx run @org/app:build` ✅.

**Project-specific modules NOT migrated** (intentional): match, jyotish, family, chat, call, profile, safety, intelligence, legal-ai, master-assistant, signers, vault, estate-vault, comments, shares, document-groups, dev. Copy from source projects if any is needed in a downstream project.
