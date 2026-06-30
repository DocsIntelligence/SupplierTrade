# Tasks — Boilerplate roadmap

This is the durable, checked-in source of truth for the starter's boilerplate roadmap. Tick boxes as work lands; append `BUILD_LOG.md` entries per phase.

## Boilerplate modules migration (docs/15)

- [x] Scan Matrimonial + DocumentIntelligence inventories
- [x] Gap analysis vs starter baseline
- [x] Plan doc: `docs/15-boilerplate-modules-PLAN.md`
- [x] Phase A — Prisma generic models (`Notification`, `PushSubscription`, `PhoneOtp`, `UserVerification`)
- [x] Phase B — `notification` module (in-app bell + Web Push + broadcast)
- [x] Phase C — `verification` module (user-bound, kind-based, admin queue + decision)
- [x] Phase D — Admin UI pages under `/config/*` (overview, users, plans, payments, ai-usage, mail-logs, notifications, verification, lookups, settings)
- [x] Phase E — Per-module docs + AI-friendly index (`docs/00-MODULES-INDEX.md`, `docs/modules/<name>.md`)
- [x] Phase F — Typecheck (`pnpm nx run @org/api:build`, `pnpm nx run @org/app:build`) green
- [x] Migration doc updates (this file + `BUILD_LOG.md`)

## Open follow-ups (post this migration)

- [ ] Stripe provider class (env vars exist; Razorpay-only today)
- [ ] BullMQ queue around `render` for batch loads
- [ ] Cache layer on top of Redis (today it's queue-only)
- [ ] Mail `synchronous` path: render template instead of using `dto.html` only
- [ ] Storage browser admin page at `/config/storage`
- [ ] Queue inspector admin page at `/config/queues`
- [ ] `phone` / `email` OTP flow surfaced in the verification UI (PhoneOtp model is ready)
- [ ] Live socket bell push (today the notification module creates the row + Web Push; live socket needs a project-specific gateway)
