# Tasks — Boilerplate roadmap

This is the durable, checked-in source of truth for the starter's boilerplate roadmap. Tick boxes as work lands; append `BUILD_LOG.md` entries per phase.

## Boilerplate modules migration (docs/15)

- [x] Scan Matrimonial + DocumentIntelligence inventories
- [x] Gap analysis vs starter baseline
- [x] Plan doc: `docs/15-boilerplate-modules-PLAN.md`
- [x] Phase A — Prisma generic models (`Notification`, `PushSubscription`, `PhoneOtp`, `UserVerification`)
- [x] Phase B — `notification` module (in-app bell + Web Push + broadcast)
- [x] Phase C — `verification` module (user-bound, kind-based, admin queue + decision)
- [x] Phase D — Admin UI pages under `/config/*`
- [x] Phase E — Per-module docs + AI-friendly index
- [x] Phase F — Typecheck + lint green

## Tier 1 + Tier 3 upgrade (docs/16)

- [x] Plan doc: `docs/16-tier1-tier3-PLAN.md`
- [x] Prisma models: AuditLog, Organization, Membership, Invitation, ApiKey, TwoFactor, WebhookEndpoint, WebhookDelivery, IdempotencyKey
- [x] T1.1 — `audit` module + `@Audit()` decorator + interceptor + admin query
- [x] T1.2 — `org` module (Organization + Membership + role gating)
- [x] T1.3 — `invitations` module + email template + token flow
- [x] T1.4 — `cron` module (4 generic cleanup jobs + admin run-now)
- [x] T1.5 — `cache` module (Redis or in-process LRU)
- [x] T1.6 — `api-keys` module + `ApiKeyGuard`
- [x] T1.7 — `totp` module (RFC 6238 + recovery codes via otplib)
- [x] T1.8 — `webhooks` module (HMAC-signed, BullMQ-retried)
- [x] T1.9 — `idempotency` interceptor (`@Idempotent()`)
- [x] T1.10 — `.env.example`, `docker-compose.yml`, `.github/workflows/ci.yml`
- [x] T3.19 — Lazy code-split `/config/*` pages
- [x] T3.20 — Example unit + e2e tests for `lookup`
- [x] T3.21 — `/config/storage` + `/config/queues` admin pages + backing endpoints
- [x] Per-module docs + INDEX update
- [x] Typecheck + lint green

## Open follow-ups (post this migration)

## Extras shipped 2026-07-01

- [x] `seed.ts` bootstraps `admin@example.com` (admin) + `test@example.com` (user) — password `"password"`
- [x] Fix: `WebhooksModule` skips BullMQ entirely when `REDIS_URL` absent (was crashing boot — `BULLMQ_CONFIG` lookup against an un-registered global)
- [x] **Referrals module** — generic per-user code + share link + admin reward hook (`docs/modules/referrals.md`)

## Open follow-ups (post this migration)

- [ ] Stripe provider class (env vars exist; Razorpay-only today)
- [ ] BullMQ around `render` for batch loads
- [ ] Mail synchronous-path template rendering (today only the queue path renders)
- [ ] `/config/audit` + `/config/orgs` + `/config/api-keys` + `/config/webhooks` + `/config/cron` UI pages (backing endpoints ready)
- [ ] Live socket bell push (NotificationService → gateway.emitToUser)
- [ ] Tier 2 (when needed per project): Sentry, Stripe class, Apple/Microsoft OAuth, search abstraction, React Email, Helmet/CSRF/request-id middleware, OpenAPI client gen
