# 15 — Boilerplate Modules Migration Plan

Status: in-progress (2026-06-30)
Owner: autonomous build
Source projects: `../Matrimonial`, `../DocumentIntelligence`
Target: `apps/api/src/app/*`, `apps/app/src/app/features/admin/*`, `tools/prisma/schema.prisma`, `docs/modules/*`

## 1. Goal

Make `starter` a true plug-and-play boilerplate. Every project we spin up after this should be able to delete the domain layer and ship with a working: auth, users, payments, mail, storage, AI, lookup, settings, notifications, verification, render, admin UI, and infra (redis/queue/health/config/logger/common/database).

## 2. Source-of-truth: scan summary

Starter already inherits ~17 generic modules from Matrimonial (same Nx layout, same module names, same Prisma model set for the generic slice). The genuinely missing pieces:

**API modules missing:** `notification`, `verification`
**Prisma models missing (generic):** `Notification`, `PushSubscription`, `PhoneOtp`, `UserVerification` (generalized from Matrimonial's `ProfileVerification`)
**Admin UI pages missing:** plans, payments, AI usage, settings, mail logs, storage browser, notifications, verification queue, users overview
**Per-module docs missing:** none exist (only `docs/ARCHITECTURE.md`); we need `docs/modules/<name>.md` for AI/human consumption
**Indexed AI entrypoint missing:** `docs/00-MODULES-INDEX.md`

Everything else (database, config, logger, common, health, auth, users, storage, mail, ai, ai-usage, payment, lookup, settings, render, admin module) is already present and in good shape. We will **not** rewrite these — we will only patch gaps and document them.

## 3. Out-of-scope (skipped)

Domain-specific modules: `match`, `jyotish`, `family`, `chat`, `call`, `profile`, `safety`, `intelligence`, `legal-ai`, `master-assistant`, `signers`, `vault`, `estate-vault`, `comments`, `shares`, `document-groups`, `dev`, `bundles`, `modernizer`. These stay project-specific.

## 4. Migration phases

### Phase A — Prisma generic models
Add to `tools/prisma/schema.prisma`:
- `Notification` (userId, type, title, body, link, read, createdAt)
- `PushSubscription` (userId, endpoint, p256dh, auth, ua, createdAt)
- `PhoneOtp` (phone, codeHash, purpose, expiresAt, attempts, consumedAt)
- `UserVerification` (userId, kind, status, payload JSON, reviewerId, decidedAt, reason)

Then `pnpm prisma generate` + a new SQL migration.

### Phase B — Notification module
Copy from `Matrimonial/apps/api/src/app/notification/*`:
- `notification.service.ts` (CRUD + mark-as-read)
- `notification.controller.ts` (user-facing endpoints)
- `push.service.ts` (web-push subscribe + send)
- `push.controller.ts`
- `notification.module.ts`

Strip Matrimonial-only references (ChatModule forwardRef → remove). Wire into `app.module.ts`.

### Phase C — Verification module
Copy + generalize from `Matrimonial/apps/api/src/app/verification/*`:
- Rename `ProfileVerification` → `UserVerification`
- Strip PAN/Aadhaar-specific fields → use generic `kind` enum (`identity`, `address`, `email`, `phone`, `kyc`) + `payload Json` for kind-specific fields
- Keep admin queue + decision flow
- Wire into `app.module.ts`

### Phase D — Admin UI pages (apps/app)
Add under `apps/app/src/app/features/admin/`:
- `AdminUsers.tsx` (list/search/role-toggle)
- `AdminPlans.tsx` (CRUD plans + features)
- `AdminPayments.tsx` (list, status filter, webhook log)
- `AdminAiUsage.tsx` (chart + table + cost rollup)
- `AdminSettings.tsx` (scoped settings editor)
- `AdminMailLogs.tsx` (mail audit table)
- `AdminStorage.tsx` (file browser)
- `AdminNotifications.tsx` (broadcast composer)
- `AdminVerificationQueue.tsx` (review queue)

UI rules: DataTable + server paging + Select filters + ≤3 inline icons + ⋯ overflow + linkable name cell + i18n via `t('key','English default')` + @org/ui only. Routes under `/config/*` per the UI-consistency rule.

### Phase E — Per-module docs (AI-friendly)
Create `docs/modules/<name>.md` for each generic module. Each doc must include:
1. **Purpose** (one paragraph)
2. **Files** (paths)
3. **Env vars** (table)
4. **Providers / abstractions**
5. **Prisma models touched**
6. **Endpoints** (method + path + auth + DTO)
7. **Admin UI** (route + screenshot path placeholder)
8. **How to plug into a new project** (numbered steps)
9. **Extending** (how to add a new provider/strategy)

Then write `docs/00-MODULES-INDEX.md` — a flat, AI-readable table of contents listing every module, its purpose, and its doc path.

### Phase F — Validate
- `pnpm nx run api:typecheck`
- `pnpm nx run app:typecheck`
- `pnpm nx run-many -t lint`
- Confirm prisma generate clean
- Append to `docs/TASKS.md` + `docs/BUILD_LOG.md` (if present)

## 5. Validation gates

A module is "boilerplate-ready" only if:
- ✅ API module imported in `app.module.ts` and starts without crashing
- ✅ Env vars documented in `apps/api/src/app/config/schema.ts`
- ✅ Prisma models migrated
- ✅ Admin UI page renders (when applicable)
- ✅ `docs/modules/<name>.md` exists and is self-contained
- ✅ Listed in `docs/00-MODULES-INDEX.md`

## 6. Env-var additions

- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — web-push (notification)
- (No new envs for verification — uses existing storage + mail.)

## 7. Open follow-ups (after this PR)

- Add Stripe provider class to `payment` (env vars already present)
- Wrap `render` in a BullMQ queue for heavy loads
- Move `bundles` + `modernizer` stubs into a separate "experimental" docs doc — do not touch in this migration
