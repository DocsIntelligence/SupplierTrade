# Modules Index (AI-friendly)

This index is the canonical entry point for any AI agent (or new contributor) that needs to plug, extend, or copy a module from this starter to another project. Every generic, reusable module is listed here with a one-line purpose and a link to its self-contained doc.

> **Reading order for an AI:**
> 1. Read this file first.
> 2. Open the module doc you need.
> 3. Each module doc is self-contained — purpose, files, env vars, providers, prisma models, endpoints, admin UI route, and "how to plug into a new project". You do not need to read other module docs to use one.

## Module table

| # | Module | Purpose | Doc | API path | Admin UI |
|---|--------|---------|-----|----------|----------|
| 1  | database         | Prisma client wrapper + injection                                | [modules/database.md](modules/database.md)         | (DI)                  | —                      |
| 2  | config           | Zod-validated env + typed config service                         | [modules/config.md](modules/config.md)             | (DI)                  | —                      |
| 3  | logger           | Pino-based structured logging                                    | [modules/logger.md](modules/logger.md)             | (DI)                  | —                      |
| 4  | common           | Filters, interceptors, pipes, middleware (cross-cutting)         | [modules/common.md](modules/common.md)             | (DI)                  | —                      |
| 5  | health           | Liveness probe                                                   | [modules/health.md](modules/health.md)             | `/health`             | —                      |
| 6  | redis-queue      | BullMQ + Redis (optional infra)                                  | [modules/redis-queue.md](modules/redis-queue.md)   | (DI)                  | —                      |
| 7  | auth             | JWT + refresh + OAuth (Google/GitHub/LinkedIn) + Passkey + Local | [modules/auth.md](modules/auth.md)                 | `/auth/*`             | —                      |
| 8  | users            | User CRUD                                                        | [modules/users.md](modules/users.md)               | `/users/*`            | `/config/users`        |
| 9  | storage          | S3-compatible storage + local-disk fallback                      | [modules/storage.md](modules/storage.md)           | `/storage/*`          | —                      |
| 10 | mail             | SMTP + BullMQ queue + templates + audit log                      | [modules/mail.md](modules/mail.md)                 | (DI) + `/admin/mail-logs` | `/config/mail-logs`|
| 11 | ai               | OpenAI / Claude / Gemini provider abstraction                    | [modules/ai.md](modules/ai.md)                     | `/ai/*`               | —                      |
| 12 | ai-usage         | Per-call metering + cost rollup + retention                      | [modules/ai-usage.md](modules/ai-usage.md)         | `/ai-usage/*`         | `/config/ai-usage`     |
| 13 | payment          | Razorpay + Stripe stubs + plans + wallets + webhook              | [modules/payment.md](modules/payment.md)           | `/payment/*` + `/wallet/*` | `/config/plans`, `/config/payments` |
| 14 | lookup           | Dynamic master data (groups + values)                            | [modules/lookup.md](modules/lookup.md)             | `/lookups/*`          | `/config/lookups`      |
| 15 | settings         | Scoped key-value config (system / org / user)                    | [modules/settings.md](modules/settings.md)         | `/settings/*`         | `/config/settings`     |
| 16 | render           | HTML → PDF / PNG / DOCX via Puppeteer                            | [modules/render.md](modules/render.md)             | `/render/*`           | —                      |
| 17 | notification     | In-app bell + Web Push + admin broadcast                         | [modules/notification.md](modules/notification.md) | `/notifications/*`, `/push/*` | `/config/notifications` |
| 18 | verification     | Generic identity/KYC submission + admin review                   | [modules/verification.md](modules/verification.md) | `/verification/*`, `/admin/verification/*` | `/config/verification` |
| 19 | admin            | Stats + user role management                                     | [modules/admin.md](modules/admin.md)               | `/admin/*`            | `/admin`, `/config`    |
| 20 | audit            | Append-only audit log + `@Audit()` decorator                     | [modules/audit.md](modules/audit.md)               | `/admin/audit`        | —                      |
| 21 | org              | Multi-tenancy: Organization + Membership + role gating           | [modules/org.md](modules/org.md)                   | `/orgs/*`             | —                      |
| 22 | invitations      | Invite by email, accept by token, expiry                         | [modules/invitations.md](modules/invitations.md)   | `/orgs/:id/invitations`, `/invitations/:token/accept` | — |
| 23 | cron             | `@nestjs/schedule` — generic cleanup jobs + admin run-now        | [modules/cron.md](modules/cron.md)                 | `/admin/cron/*`       | —                      |
| 24 | cache            | Redis-or-LRU `CacheService` w/ `wrap(key, ttl, compute)`         | [modules/cache.md](modules/cache.md)               | (DI)                  | —                      |
| 25 | api-keys         | Personal Access Tokens + `ApiKeyGuard`                           | [modules/api-keys.md](modules/api-keys.md)         | `/me/api-keys`        | —                      |
| 26 | totp             | TOTP 2FA via otplib + recovery codes                             | [modules/totp.md](modules/totp.md)                 | `/auth/totp/*`        | —                      |
| 27 | webhooks         | Outbound webhooks — signed, queued, retried                      | [modules/webhooks.md](modules/webhooks.md)         | `/orgs/:id/webhooks`  | —                      |
| 28 | idempotency      | `@Idempotent()` interceptor — replay-safe POSTs                  | [modules/idempotency.md](modules/idempotency.md)   | (DI)                  | —                      |

## Conventions every module follows

1. **NestJS module per folder** at `apps/api/src/app/<module>/<module>.module.ts`.
2. **Zod-validated env vars** declared in `apps/api/src/app/config/schema.ts`.
3. **Prisma models** all live in `tools/prisma/schema.prisma`. Enums are `String` (SQLite limitation) with canonical union types in `libs/shared/utils/src/lib/enums.ts`.
4. **Admin UI** for any module that exposes data lives at `/config/<module>` and uses `<DataTable>` + `@org/ui` + `t('key','English default')`.
5. **Optional providers** never hard-fail when env vars are missing — they log a warning and disable themselves (see `mail`, `payment`, `ai`, `storage`, `notification`).
6. **Async work** flows through BullMQ when `REDIS_URL` is set; otherwise it falls back to synchronous execution.

## Plugging a module into a new project (general recipe)

1. Copy `apps/api/src/app/<module>/` to the new project.
2. Copy the module's env-var block from `config/schema.ts`.
3. Copy the module's Prisma models (search the schema for the model names listed in the module doc).
4. Add the module to `app.module.ts` imports.
5. (UI) Copy `apps/app/src/app/features/config/Config<Module>.tsx` and add the route to `app.tsx`.
6. Run `pnpm prisma migrate dev --name add_<module>` and `pnpm nx run @org/api:build`.

## Out of scope

These modules are intentionally NOT in the boilerplate (they're project-specific):

- Anything matrimony-domain: profile, match, jyotish, family, chat, call, safety
- Anything document-intelligence-domain: intelligence, legal-ai, master-assistant, signers, vault, estate-vault, comments, shares, document-groups

If you need any of those, copy them from their source project (Matrimonial / DocumentIntelligence) — they're not on the maintained path here.
