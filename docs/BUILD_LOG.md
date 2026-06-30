# Build log

Append-only record of phases that land. Newest at the top.

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
