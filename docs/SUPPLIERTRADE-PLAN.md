# SUPPLIERTRADE-PLAN.md — concrete Phase-1 build plan

> The boilerplate-aware implementation plan. Pairs with `PLANNING.md` (master + guardrails) and
> `DOMAIN-ARCHITECTURE.md` (configuration design). This file is the **how**: gap analysis against the
> `@org/starter` fork, the exact files to create, and the build order.

---

## 1. What we inherit (the starter)

Nx monorepo. `apps/api` (NestJS), `apps/web` (Next.js), `apps/app` (React), `apps/artboard`. Prisma on
SQLite (`tools/prisma/schema.prisma`, 30 models). 28 generic modules already shipped and documented in
`docs/00-MODULES-INDEX.md`. Enums live as const unions in `@org/utils` (libs/shared/utils), not native DB
enums (SQLite limitation).

## 2. Gap analysis

| Capability (architecture) | Status in starter | Action |
|---|---|---|
| Domain config loader + meta-schema validation | ✗ absent | **Build** `platform/domains`. |
| Immutable `DomainVersion` store | ✗ absent | **Build** (Prisma `Domain` + `DomainVersion`). |
| Generic `WorkflowEngine` + Guard/Action registries | ✗ absent | **Build** `platform/workflow`. |
| JSON-Schema validation + dynamic form metadata | ✗ absent | **Build** `platform/schema` (ajv). |
| `VerificationAdapterRegistry` + adapter interface (graded) | ✗ absent | **Build** `platform/registries`. |
| `QcScorerRegistry` | ✗ absent | **Build** `platform/registries`. |
| Verification (graded, domain-scoped) | ⚠ partial — `verification` is **user-bound/kind-based** KYC queue | **Build alongside** new `verification-engine`; keep old module for per-user KYC. |
| Suppliers / Listings (domain-scoped, JSONB attrs) | ✗ absent | **Build** `modules-domain/suppliers`,`listings`. |
| QC jobs | ✗ absent | **Build** `modules-domain/qc`. |
| Documents & media capture | ⚠ `storage` exists (S3/MinIO) | **Reuse** storage; add `SupplierDocument`/`MediaAsset` + uploader endpoints. |
| Workflow audit trail | ✓ `audit`/`AuditLog` | **Reuse**; project typed `WorkflowEvent` per instance. |
| Tenancy / accounts | ✓ `org`/`Membership`/`auth` | **Reuse**; `Supplier.orgId` → `Organization`. |
| Feature flags | ✓ `settings` | **Reuse** for `domain.feature_flags` resolution. |
| Escrow rail | ✓ `payment` (Razorpay) | **Reuse later** (Phase 3); actions call PSP, never custody (GUARDRAIL #1). |
| Notifications / queues / cron | ✓ | **Reuse**. |
| Admin config UI | — | **Do NOT build** (Layer 2/3, gated). |

## 3. The `verification` conflict — decision

The starter's `verification` module + `UserVerification` model is a **per-user, kind-based KYC review queue**
(`pending | auto_passed | auto_failed | approved | rejected`). The architecture needs a **supplier-/domain-
scoped, graded, registry-driven** engine producing a `VerificationReport` whose `signalsJson` holds per-signal
evidence.

**Decision:** do **not** overload `UserVerification`. Keep that module for individual KYC. Build a new
`verification-engine` module that:
- reads `domain.verification_profile.required_signals` **and** the selected `supplier_type.verification_signals`,
- resolves each signal via `VerificationAdapterRegistry`,
- runs adapters, assembles a graded `VerificationReport` (GUARDRAIL #3),
- is invoked by the `WorkflowEngine` `verification_done` transition (guard `signals_meet_threshold`).

This honours the anti-pattern rules: no binary "safe", no domain conditionals.

## 4. Files to create (Phase 1)

### 4.1 Prisma (`tools/prisma/schema.prisma`)
Add models from `PLANNING.md §7`: `Domain`, `DomainVersion`, `Supplier`, `Listing`, `WorkflowInstance`,
`WorkflowEvent`, `VerificationReport`, `QcJob`, `SupplierDocument`, `MediaAsset`. All status fields `String`;
all variable/array data `Json`. Mirror status unions in `libs/shared/utils/src/lib/enums.ts`.

### 4.2 Platform (`apps/api/src/app/platform/`)
```
domains/
  domain.types.ts            # DomainConfig TS types
  domain-config.loader.ts    # read config/domains/*, parse yaml/json, $ref-resolve schemas
  domain-config.validator.ts # ajv against domain.meta.schema.json + plugin-key existence check (fail fast)
  domain-version.store.ts    # publish() → immutable DomainVersion; getActive(key)
  domains.service.ts
  domains.module.ts
workflow/
  workflow.types.ts          # WorkflowDef, Transition
  guard.registry.ts          # GuardRegistry (token-injected map; fail-fast resolve)
  action.registry.ts         # ActionRegistry
  workflow.engine.ts         # interpret transitions; write AuditLog + WorkflowEvent
  workflow.module.ts
schema/
  json-schema.service.ts     # ajv compile/validate entity attributes; dynamic form metadata
  schema.module.ts
registries/
  verification-adapter.registry.ts   # key → VerificationAdapter; fail-fast
  qc-scorer.registry.ts
  registries.module.ts
expression/
  expr.evaluator.ts          # safe evaluator for required_if (`supplier_type in [...]`, `deals_in includes ...`)
```

### 4.3 Adapters (`apps/api/src/app/adapters/`)
```
verification/
  verification-adapter.interface.ts   # { key, run(input) → { status, evidence, summary } }
  gst.adapter.ts                       # graded stub (pass/flag/na + evidence) — wire live registry later
  litigation.adapter.ts
qc/
  grain-grade.scorer.ts                # moisture/foreign-matter/broken/admixture → FAQ/Grade A/B/Reject
  qc-scorer.interface.ts
```

### 4.4 Domain business modules (`apps/api/src/app/modules-domain/`)
```
suppliers/         # CRUD, domain+type-aware, validates attributes against schema; doc/media upload via storage
listings/          # CRUD, attributes-validated
verification-engine/  # graded VerificationReport assembly (see §3)
qc/                # QcJob lifecycle + grain_grade scoring
```

### 4.5 Config-as-code (`config/domains/`)
```
domain.meta.schema.json
domains/agriculture/
  domain.yaml                          # agri-output/produce seed (DOMAIN-ARCHITECTURE §2 + §8)
  schemas/supplier.schema.json
  schemas/listing.schema.json
  workflows/agriculture.workflow.yaml
```
Loaded on deploy via a seed/bootstrap step (extend `tools/prisma/seed.ts` or an api bootstrap hook).

### 4.6 CI
Add a job that loads every `config/domains/*` and asserts: meta-schema valid + every referenced
plugin/guard/action/scorer key is registered. Fail the build otherwise (GUARDRAIL #6).

## 5. Build order (Phase 1)

1. Prisma models + `enums.ts` unions + migration.
2. `platform/registries` + adapter/scorer interfaces (so loader can verify keys).
3. `platform/domains` loader + meta-schema validator + `DomainVersion` store.
4. `platform/schema` (ajv entity validation).
5. `platform/workflow` engine + guard/action registries (AuditLog + WorkflowEvent).
6. `adapters/verification/{gst,litigation}` + `adapters/qc/grain-grade`, registered.
7. `modules-domain/{suppliers,listings,verification-engine,qc}`.
8. `config/domains/agriculture/*` seed; bootstrap load + CI validation.
9. Typecheck + lint green; minimal unit tests (engine transition, schema validation, adapter grading).

## 6. Guardrail checks baked into Phase 1

- No `if (domain === ...)` — every difference flows through config or a registry. (Reviewable grep.)
- Verification output is graded `VerificationReport`, never a boolean. (GUARDRAIL #3)
- No fund movement in any adapter/action. (GUARDRAIL #1/#2)
- Unknown plugin key → throw at load. (GUARDRAIL #6)
- No admin config UI. (DOMAIN-ARCHITECTURE §0)

## 7. Explicitly NOT in Phase 1

RFQ, WhatsApp intake, escrow wiring, ONDC/eNAM, admin config viewer/studio, live license-registry API calls
(adapters are graded stubs until access is confirmed — Open Question #2).
