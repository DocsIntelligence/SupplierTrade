# PLANNING.md — SupplierTrade (master)

> The product/architecture master for **SupplierTrade**. `DOMAIN-ARCHITECTURE.md` extends this file
> and defers to the **GUARDRAILS** below — where the two conflict, these GUARDRAILS win.
>
> SupplierTrade is built on the `@org/starter` boilerplate (Nx monorepo: NestJS `api`, Next.js `web`,
> React `app`, Prisma). This doc records the thesis, the non-negotiable guardrails, the phase plan,
> the data model base, and the module map that DOMAIN-ARCHITECTURE.md §6/§7 reference.

---

## 1. Thesis

A **B2B supplier trust + quality layer**. Buyers can't tell a real, compliant, quality supplier from a
fraudulent or low-grade one. SupplierTrade sits between them and:

1. **Verifies** suppliers (graded, evidence-backed — never a binary "safe").
2. **Inspects quality** (QC) of what they sell (config-driven grading).
3. **Brokers trust** in the transaction (RFQ → verified match → optional QC → optional escrow).

It is **multi-vertical by configuration**, launching with **agriculture (agri-output / produce)** as the
first and only domain shipped as config-as-code. See `DOMAIN-ARCHITECTURE.md`.

---

## 2. GUARDRAILS (non-negotiable — win all conflicts)

1. **We never hold funds or act as a payment institution.** Escrow, when enabled, is operated through a
   licensed PSP/escrow partner. No adapter, service, or workflow action moves or custodies money directly.
   The platform records state; the partner moves money.
2. **We never make lending or credit decisions.** No adapter outputs a credit score, loan approval, or
   underwriting verdict. We surface verification _evidence_; financing partners decide independently.
3. **Verification is graded, never binary.** No service or adapter returns "verified/safe" as a boolean.
   Every `VerificationReport` is a graded status (`pass | flag | na` per signal) with stored evidence and a
   human-readable summary. The UI must never collapse this into a green "✓ Safe" badge without the grade.
4. **Domain = data, not code paths.** Zero `if (domain === ...)` in business logic (DOMAIN-ARCHITECTURE §1).
   Differences live in config or named, registered plugins.
5. **Consent + data minimisation.** KYC documents and PII are collected only when a config requires them,
   stored in object storage (MinIO/S3) with access control, and every supplier write records `consent_at`.
6. **Fail fast at load, never at runtime.** A config referencing an unregistered plugin/guard/action, or an
   entity write violating its JSON Schema, fails at config-load / write-validation — not deep in a flow.
7. **Build the abstraction now, the tooling last.** Config-as-code now; read-only admin at vertical #2;
   CRUD config studio only on real config churn (DOMAIN-ARCHITECTURE §0).

---

## 3. Phase plan

| Phase                                      | Goal                                                            | Ships                                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 — Pricing/validation**                 | Confirm a produce buyer pays for verification/QC.               | Manual concierge; no platform code. Output: `verification_fee`, `qc_fee` numbers.                                                                                                                                                                        |
| **1 — Platform core + agriculture config** | The domain abstraction + agriculture shipped as config-as-code. | `platform/{domains,workflow,schema,registries}`, Prisma domain models, agriculture seed config, `gst` + `litigation` verification adapters (graded), `grain_grade` QC scorer, suppliers/listings/verification-engine/qc modules. **No admin config UI.** |
| **2 — RFQ + matching**                     | Buyers post requirements; verified suppliers matched.           | `rfq` module, WhatsApp RFQ intake (feature-flagged), supplier search (domain-filtered). Read-only domain-config admin viewer (Layer 2).                                                                                                                  |
| **3 — QC ops + escrow**                    | Field QC workflow + escrow via PSP partner.                     | QC job lifecycle, inspection reports, escrow actions wired to PSP (feature-flagged, GUARDRAIL #1).                                                                                                                                                       |
| **4 — Sourcing rails**                     | ONDC-agri / eNAM sourcing (if in scope).                        | Sourcing adapters, additional domains as config. CRUD config studio only if churn is real (Layer 3).                                                                                                                                                     |

**Current focus: Phase 2A.** Build RFQ + verified matching + paid QC validation. See `docs/17-suppliertrade-market-next-phase-PLAN.md`.

---

## 4. Architecture at a glance

```
Browser ──▶ web (Next.js) / app (React) ──▶ api (NestJS) ──▶ Postgres/SQLite (Prisma)
                                                │
                                                ├─ platform/   (domain-agnostic engine)
                                                ├─ modules/    (business logic; depends only on platform/ + config)
                                                ├─ adapters/   (registered plugins: verification, qc)
                                                └─ config/domains/agriculture/  (config-as-code)
                              external: MinIO/S3 (docs+media), PSP/escrow, license registries, WhatsApp
```

One generic `WorkflowEngine`, one JSON-Schema-driven form/validation layer, one set of plugin registries.
A new vertical that recombines existing capabilities = **config only, zero code**.

---

## 5. Reuse map (boilerplate → SupplierTrade)

The starter already ships generic modules. SupplierTrade **reuses, does not rebuild** them:

| Need                                     | Reuse existing                 | Notes                                                                                                                                 |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Tenancy / actor accounts                 | `org` + `Membership`, `auth`   | A supplier org maps to `Organization`.                                                                                                |
| Workflow audit trail                     | `audit` / `AuditLog`           | Every workflow transition writes an `AuditLog` entry (DOMAIN-ARCHITECTURE §4). `WorkflowEvent` is the typed, per-instance projection. |
| Documents & media                        | `storage` (S3/MinIO)           | `SupplierDocument.file_ref` / `MediaAsset.file_ref` point at storage keys.                                                            |
| Config plumbing / feature flags          | `settings`, `lookup`           | Domain `feature_flags` resolved at runtime; static master data via `lookup`.                                                          |
| Payments / escrow rails                  | `payment` (Razorpay)           | Escrow actions call the PSP via this module — platform never custodies funds (GUARDRAIL #1).                                          |
| Notifications                            | `notification`                 | RFQ/verification/QC status updates.                                                                                                   |
| Async jobs                               | `cron`, BullMQ (`redis-queue`) | Verification runs, QC reminders.                                                                                                      |
| Idempotency / API keys / webhooks / TOTP | as-is                          | Partner integrations, secure mutations.                                                                                               |

**Net-new (Phase 1):** `platform/*`, `suppliers`, `listings`, a **new graded** verification engine, `qc`.

> **Conflict to resolve:** the existing `verification` module is **user-bound + kind-based** (`UserVerification`
> model) — a per-user KYC queue. The architecture needs a **domain-/supplier-scoped, graded, registry-driven**
> `VerificationEngine` producing `VerificationReport`. Decision: **keep the existing module for per-user KYC,
> build the new engine alongside** under `platform/registries` + a `verification-engine` module that emits
> `VerificationReport`. Do not overload `UserVerification`. See `SUPPLIERTRADE-PLAN.md` §3.

---

## 6. Module map (DOMAIN-ARCHITECTURE §6/§7 base)

```
apps/api/src/app/
  platform/
    domains/            # DomainConfig loader, meta-schema validator, DomainVersion store
    workflow/           # generic WorkflowEngine + GuardRegistry + ActionRegistry
    schema/             # JSON-Schema validation + dynamic form metadata
    registries/         # VerificationAdapterRegistry, QcScorerRegistry
  modules-domain/       # SupplierTrade business modules (depend only on platform/* + config)
    suppliers/
    listings/
    verification-engine/   # graded VerificationReport (NOT the user-bound `verification` module)
    qc/
    rfq/                   # Phase 2
  adapters/
    verification/       # gst/, litigation/  (+ fssai, seed_license, ... incrementally)
    qc/                 # grain_grade/
config/domains/
  agriculture/
    domain.yaml
    schemas/  supplier.schema.json   listing.schema.json
    workflows/ agriculture.workflow.yaml
  domain.meta.schema.json
```

Existing generic modules (`auth`, `users`, `org`, `audit`, `storage`, `payment`, …) stay where they are.

---

## 7. Data model base (DOMAIN-ARCHITECTURE §6 extends this)

Existing Prisma models stay. Phase 1 **adds** (every domain-scoped row carries `domainKey`):

```
Domain            (key PK, name, status, version, configJson, metaSchemaVersion, createdAt)
DomainVersion     (id, domainKey, version, configJson, publishedAt)   -- immutable snapshots
Supplier          (id, domainKey, supplierType, orgId?, gstin?, legalName, status, attributes Json, consentAt, createdAt)
Listing           (id, domainKey, supplierId, status, attributes Json, createdAt)
WorkflowInstance  (id, domainKey, workflowVersion, subjectType, subjectId, currentState, contextJson)
WorkflowEvent     (id, instanceId, fromState, toState, event, actor, createdAt)
VerificationReport(id, domainKey, supplierId, status[graded], signalsJson, summary, createdAt)
QcJob             (id, domainKey, listingId, scorer, criteriaResultsJson, grade, status, createdAt)
SupplierDocument  (id, supplierId, domainKey, docKey, fileRef, mime, status, verifiedBySignal?, uploadedAt)
MediaAsset        (id, supplierId, domainKey, mediaKey, type, fileRef, geoLat?, geoLng?, capturedAt)
```

> **SQLite caveat (starter default):** no native enums / `Decimal` / scalar arrays. Status fields are
> `String` with allowed values mirrored in `@org/utils` enums; arrays/objects are `Json`. `attributes` is
> `Json` validated against the domain JSON Schema on write (DOMAIN-ARCHITECTURE §3). Move to Postgres for
> production (JSONB + per-domain RLS).

---

## 8. Open questions (carry from DOMAIN-ARCHITECTURE §11)

1. ~~Sub-vertical~~ → **DECIDED: agri-output / produce.**
2. Programmatic access to Agmark/APMC + FPO registry data? (Affects whether adapters call live or are manual-assisted.)
3. ONDC-agri / eNAM as a Phase-4 rail — in or out?
4. Phase-0 pricing: what does a produce buyer pay per verification / per QC?

   Current hypothesis to validate in Phase 2A: `verification_fee = ₹1,500` per supplier profile and
   `qc_fee = ₹1,200` per grain-style lot; field QC is ₹2,500-₹5,000 depending on sampling partner.

---

_See `DOMAIN-ARCHITECTURE.md` for the configuration design and `SUPPLIERTRADE-PLAN.md` for the concrete,
boilerplate-aware build plan and gap analysis._
