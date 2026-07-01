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

---

# SupplierTrade — multi-vertical platform (new project)

> Plan docs: `docs/PLANNING.md` (master + guardrails), `docs/DOMAIN-ARCHITECTURE.md` (config design),
> `docs/SUPPLIERTRADE-PLAN.md` (concrete build plan + gap analysis).
> Launch sub-vertical: **agri-output / produce** (decided 2026-07-01).

## Phase 0 — pricing/validation (business, not code)

- [ ] Confirm a produce buyer pays for verification/QC; output `verification_fee` + `qc_fee` numbers.

## Phase 1 — platform core + agriculture config

- [x] Prisma models: `Domain`, `DomainVersion`, `Supplier`, `Listing`, `WorkflowInstance`, `WorkflowEvent`, `VerificationReport`, `QcJob`, `SupplierDocument`, `MediaAsset` (+ `@org/utils` status unions) — migration `20260630205628_suppliertrade_domain_platform`
- [x] `platform/registries` — `VerificationAdapterRegistry` + `QcScorerRegistry` + interfaces (fail-fast resolve)
- [x] `platform/domains` — DomainConfig loader + `domain.meta.schema.json` validator + unknown-plugin-key fail-fast
- [x] `platform/domains` — `DomainVersion` immutable publish/getActive store + boot-time `DomainBootstrapService`
- [x] `platform/schema` — JSON-Schema (ajv) entity validation + dynamic form metadata
- [x] `platform/workflow` — generic `WorkflowEngine` + `GuardRegistry` + `ActionRegistry` (writes `AuditLog` + `WorkflowEvent`)
- [x] `platform/expression` — safe `required_if` evaluator (`in [...]`, `includes ...`)
- [x] Adapters: `gst` + `litigation` (graded, GUARDRAIL #3) + `grain_grade` scorer; registered
- [x] `modules-domain/{suppliers,listings,verification-engine,qc}` wired into `app.module`
- [x] Seed `config/domains/agriculture/*` (domain.yaml, schemas, workflow); bootstrap-load on deploy
- [x] Typecheck + lint green; unit tests (`platform.spec.ts` — config load/validate, fail-fast, scorer grading, expr) — 9/9 pass; app boots + publishes `agriculture@1`
- [x] **Follow-up:** CI job to load all domain configs + assert every plugin/guard/action/scorer key registered (today enforced at boot, now also in CI via `pnpm domain:validate`)
- [ ] **Follow-up:** `SupplierDocument` / `MediaAsset` upload endpoints via `storage` module (models exist; controllers not yet built)
- [x] **Follow-up:** per-module docs under `docs/modules/` + INDEX entries (suppliers, listings, verification-engine, qc, platform)

## Guardrails to enforce in review (PLANNING §2)

- [ ] No `if (domain === ...)` in business logic · graded verification only · no fund movement in adapters · unknown key throws at load · **no admin config UI**

## Phase 1 — operational UI (apps/app, React SPA)

- [x] Read-only `DomainsController` (`GET /domains`, `/domains/:key`, `/domains/:key/form/:entity`) to drive schema-forms — NOT the admin config studio
- [x] `GET /suppliers/:id/verification-reports`
- [x] `features/suppliertrade/`: `api.ts`, `SchemaForm` (one JSON-Schema-driven renderer), `SuppliersList`, `SupplierCreate`, `SupplierDetail`
- [x] Supplier detail shows **graded** verification (per-signal status + evidence, never a plain ✓) + workflow actions (submit/verify)
- [x] Listings + QC folded into supplier detail (create listing, score against domain qc_profile, grade breakdown)
- [x] Routes in `app.tsx` (`/suppliers`, `/suppliers/new`, `/suppliers/:id`) + "Suppliers" nav in `MainLayout`
- [x] Verified: app typecheck + lint clean, `nx build app` ok; full HTTP E2E (login→domains→create→submit→verify→listing→QC→validation-reject) green

## Phase 1 — production-grade forms + reference data (convention: docs/FORMS.md)

- [x] Maintained Zod DTOs in `@org/dto` (`createSupplierSchema`, `createListingSchema`, `buildAttributesSchema`, `FormFieldMeta`, `LOOKUP_KEYS`) — shared by API `ZodValidationPipe` + app `zodResolver`
- [x] Lookup-backed reference data: `x-lookup`/`x-widget` schema keywords; `JsonSchemaService.formMetadata` emits widget+lookup; seeded `agri-commodities` (6) + `indian-states` (36) in `seed-data/lookups.ts`
- [x] `DynamicFields.tsx` — RHF-integrated renderer with lookup multiselect (chips) + lookup select + number/checkbox/text; `useLookup` cache
- [x] `SupplierCreate` + `ListingForm` rewritten on react-hook-form + zodResolver with visible field-level error messages
- [x] Two-layer validation (Zod base + JSON-Schema attributes) verified via HTTP: valid create ok; bad base → per-field Zod messages; empty `deals_in` → JSON-Schema minItems message
- [x] Convention codified in `docs/FORMS.md` + `CLAUDE.md` pointer + memory so future code follows it
- [ ] **Follow-up:** domain-wide Listings/QC page · document/media uploaders (attributes covered; file capture pending) · `textarea` widget component

## Phase 1 — console shell + dashboard + onboarding flow

- [x] `DashboardLayout` — fixed icon-led sidebar (lucide-react), grouped nav (`nav.tsx`), responsive drawer on mobile, user footer + logout; replaces the old top-bar `MainLayout` for the whole authenticated app
- [x] `Dashboard` rewritten as an ops console: **graded trust bar** (signature — verification never binary), stat cards, onboarding/QC mini bar charts, QC grade breakdown + pass rate, recent activity + recent suppliers — all from real `st.*` data
- [x] `dashboard/widgets.tsx` — StatCard, TrustBar, MiniBars, ChartCard, Panel primitives (no chart lib dep)
- [x] `Onboarding` — guided 3-step wizard (select type → details → review) on RHF + zodResolver + `DynamicFields` (lookup-backed), consent gate, success screen linking to verification
- [x] Routes: `/onboarding`; sidebar "New supplier" primary action → onboarding
- [x] `lucide-react` added; app typecheck + lint clean (new files), `nx build app` ok, Vite serves all modules; verified against seeded varied dataset (verified/submitted/draft suppliers, FAQ/Grade B/Reject QC)
- [x] Architecture confirmed: user/admin flows in React (`apps/app`); landing pages stay in Next.js (`apps/web`)
- [ ] **Follow-up:** collapsible sidebar (icon-only) · per-nav live counts · dark-theme screenshot pass

## Phase 1 — i18n, lookup localization, tables/CRUD, UI standards

- [x] i18n confirmed enabled both apps; `LanguageSwitcher` (lucide) added to React dashboard sidebar (`'use client'` added for Next)
- [x] **Lookup localization**: `LookupValue.metadata.i18n` translations; seed helper + backfill; `localizedLookupLabel()` in `@org/utils`; `DynamicFields` selects/chips relabel by active locale. Seeded `agri-commodities` (hi+es), `indian-states` (hi)
- [x] **Server-side tables** standard: `supplierListQuerySchema`/`SUPPLIER_SORT_FIELDS` in `@org/dto`; `SuppliersService.list` (paginate+search+sort, whitelisted orderBy); `SuppliersList.tsx` on `@org/ui DataTable` server mode
- [x] **Library-UI-only**: swapped all native `<select>` in Dashboard/Onboarding/DynamicFields → `@org/ui Select`; removed duplicate `SupplierCreate` (→ `/onboarding`)
- [x] **Standards doc** `docs/UI-STANDARDS.md` + CLAUDE.md pointer + memory (library-UI-only, server tables, i18n, lookup-i18n, Next barrel caveat)
- [x] **Bug fix**: `ZodValidationPipe` 500→400 on missing required field (dual zod v3/v4 default-error-map crash) — platform-wide
- [x] **Bug fix**: "refresh → dashboard" — `ProtectedRoute` now treats `idle`/`pending` as checking (loader), preserving deep route on hard refresh
- [ ] **Follow-up (roll out the documented pattern):** server-side DataTable + CRUD for listings, QC jobs, and the existing `/config/*` entities (users/plans/payments/lookups/orgs/audit/webhooks/api-keys) · web landing language switcher (per client page)

## Phase 1 — documents/media + storage fallback + Next landing

- [x] **Storage local-disk fallback** (`StorageService`): `upload`/`delete`/`getObject` work without S3 (writes to `STORAGE_LOCAL_DIR`, default `.data/uploads`); `GET /storage/file/{*key}` streams (S3 or local). `.data/` gitignored
- [x] **Documents & media** (config-driven per `supplier_type.required_documents`/`media_capture`): `SupplierDocumentsService` + controller — `GET :id/requirements`, `GET/POST/DELETE :id/documents`, `GET/POST :id/media` (multipart, type-validated, geotag capture)
- [x] Frontend `DocumentsPanel` on SupplierDetail: one uploader per required doc/media, status, image thumbnails, authenticated blob view (`fileObjectUrl`); native file input only (no @org/ui equivalent — noted in UI-STANDARDS)
- [x] Verified E2E: upload→disk, serve-back (correct content-type), config type-rejection (image-only), unknown-key 400
- [x] **Next.js landing page** (`apps/web/src/app/page.tsx`): SupplierTrade marketing — hero thesis, graded-trust strip (signature), how-it-works, features, CTA, footer; token-based, no @org/ui barrel (server component)
- [x] Web build hardening: custom `not-found.tsx` + `global-error.tsx`, root `force-dynamic`, switched build to Turbopack (`next build`) — fixed `/_not-found` prerender
- [ ] **Known issue (pre-existing):** `nx build web` still fails prerendering `/_global-error` (null React during SSG — boilerplate infra issue, predates this work; `nx serve web` / landing work fine)

## Phase 2+ (NOT NOW)

- [ ] RFQ + matching + WhatsApp intake · Layer-2 read-only domain-config admin viewer
- [ ] QC ops + escrow via PSP partner (Phase 3) · ONDC/eNAM sourcing (Phase 4) · Layer-3 config studio (last, gated)
