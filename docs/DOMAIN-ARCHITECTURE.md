# DOMAIN-ARCHITECTURE.md — Multi-Vertical Configuration Design

> Extends `PLANNING.md`. This document defines how the platform supports multiple **domains** (verticals)
> through configuration rather than hardcoding, starting with **agriculture**.
>
> Read alongside PLANNING.md. Where they conflict, the GUARDRAILS in PLANNING.md still win.

---

## 0. Build discipline (Claude Code: this is a hard constraint, not advice)

The platform must be **architected** for multiple domains from day one, but **only one domain (agriculture) ships as config**, and the **admin config UI is the LAST thing built, not the first.**

Three layers, built in this order:

1. **Now — config-as-code.** Domain configs are versioned JSON/YAML seed files in the repo, validated against a meta-schema, loaded on deploy. Agriculture is the first and only config. **No admin config UI.**
2. **Later (at vertical #2) — read-only admin.** View active domain configs in an admin screen.
3. **Last (only when config churn is real) — admin CRUD config studio.** Create/edit a domain from the admin with validation, versioning, draft→publish, preview. This is the "configure a new domain from admin" goal — built last, because building a no-code config studio before two paying verticals exist is the project's #1 failure mode.

**Do not build layer 2 or 3 until explicitly instructed.** Building the configurability *abstraction* is cheap and prevents rewrites. Building the configurability *tooling* prematurely is the trap.

---

## 1. Core principle: domain = data, not code paths

**Zero domain conditionals in business logic.** There must be no `if (domain === 'agriculture')` anywhere in services. Everything that differs per domain is resolved by:

- **Config** (declarative: schemas, workflow states, thresholds, labels, fees, feature flags), or
- **Registered plugins** (named strategies referenced by key from config, for logic that genuinely needs code — e.g. calling a specific license registry API).

If you find yourself writing a domain conditional, stop: it belongs in config or a plugin registry. A reviewer should be able to add a domain that *recombines existing capabilities* with **zero code changes** — pure config.

---

## 2. The `Domain` config object

A domain is a first-class, versioned configuration object:

```yaml
domain:
  key: "agriculture"            # stable slug, immutable
  name: "Agriculture"
  status: "active"              # draft | active | archived
  version: 3                    # config is versioned; published configs are immutable snapshots
  locale_defaults: { lang: "hi", fallback: "en" }

  entity_schemas:               # JSON Schema per entity type (drives dynamic forms + validation)
    supplier: { $ref: "schemas/agriculture/supplier.schema.json" }
    listing:  { $ref: "schemas/agriculture/listing.schema.json" }

  supplier_types:               # domain-specific actor types
    - { key: "fpo",          label: "Farmer Producer Org" }
    - { key: "input_dealer", label: "Agri-Input Dealer" }
    - { key: "trader",       label: "Commodity Trader" }
    - { key: "processor",    label: "Processor / Aggregator" }

  verification_profile:
    # required_signals reference plugin keys in the VerificationAdapterRegistry
    required_signals:
      - { key: "gst",          required: true }
      - { key: "fssai",        required_if: "supplier_type in [processor]" }
      - { key: "seed_license", required_if: "deals_in includes 'seeds'" }
      - { key: "fco_license",  required_if: "deals_in includes 'fertiliser'" }
      - { key: "pesticide_license", required_if: "deals_in includes 'pesticide'" }
      - { key: "apmc_mandi",   required_if: "supplier_type in [trader]" }
      - { key: "fpo_registration", required_if: "supplier_type in [fpo]" }
      - { key: "litigation",   required: true }
    thresholds: { min_signals_for_verified: 3 }

  qc_profile:
    scorer: "grain_grade"       # references QcScorerRegistry plugin
    grading_scale: ["FAQ", "Grade A", "Grade B", "Reject"]
    criteria:                   # config-driven inspection checklist
      - { key: "moisture_pct",      type: "number", max: 14 }
      - { key: "foreign_matter_pct",type: "number", max: 2 }
      - { key: "broken_pct",        type: "number", max: 3 }
      - { key: "admixture_pct",     type: "number", max: 1 }
    sampling: { method: "lot_based", sample_kg: 1 }

  workflow: { $ref: "workflows/agriculture.workflow.yaml" }

  fees:
    verification_fee_paise: 0   # set after Phase 0 pricing test
    qc_fee_paise: 0
    escrow_take_rate_bps: 0

  feature_flags:
    whatsapp_rfq: true
    escrow: false               # off until Phase 3
    ondc_sourcing: false        # off until Phase 4

  terminology:                  # label overrides; UI reads labels through this
    supplier: "Supplier / FPO"
    listing: "Produce / Input Lot"
    rfq: "Procurement Requirement"
```

**Rules:**
- A domain referencing a `plugin key` that isn't registered must **fail validation at load** (fail fast, never at runtime).
- Published config versions are **immutable**; edits create a new version. In-flight workflows keep the version they started on.
- Config is validated against a committed **meta-schema** (`domain.meta.schema.json`) in CI.

---

## 2b. Supplier types: per-type documents, media & verification (key refinement)

Within ONE domain, the **workflow is shared and configurable**, but different **actor types** need different documents, media, and verification signals. A *farmer* and a *shop owner/business* go through the same states but submit different artifacts. This is config, not code.

Each `supplier_type` in a domain carries its own `kyc_profile`, `required_documents`, `media_capture`, and `verification_signals`:

```yaml
supplier_types:
  - key: "farmer"
    label: "Farmer / Producer"
    kyc_profile: "individual"
    required_documents:
      - { key: "aadhaar",        accepts: ["image","pdf"], required: true }
      - { key: "land_record",    accepts: ["image","pdf"], required: true }   # 7/12 / RoR / Khasra-Khatauni
      - { key: "bank_passbook",  accepts: ["image","pdf"], required: true }
    media_capture:
      - { key: "produce_photos", type: "image", min: 3, geotag: true, required: false }
      - { key: "produce_video",  type: "video", required_if: "qc_requested" }
    verification_signals:        # plugin keys in VerificationAdapterRegistry
      - { key: "aadhaar_offline_kyc", required: true }
      - { key: "land_record_check",   required: false }
      - { key: "bank_penny_drop",     required: true }

  - key: "business"             # shop owner / trader / FPO / processor
    label: "Business / Shop"
    kyc_profile: "entity"
    required_documents:
      - { key: "gst_certificate", accepts: ["pdf","image"], required: true }
      - { key: "trade_license",   accepts: ["pdf","image"], required: true }  # Gumasta / Shop Act
      - { key: "pan_business",    accepts: ["pdf","image"], required: true }
      - { key: "cancelled_cheque",accepts: ["image"],       required: true }
    media_capture:
      - { key: "storefront_photo", type: "image", geotag: true, required: false }
    verification_signals:
      - { key: "gst",                required: true }
      - { key: "pan_business_verify",required: true }
      - { key: "bank_penny_drop",    required: true }
      - { key: "litigation",         required: true }
```

**How it wires into the rest of the system:**
- **Forms / capture UI** render from `required_documents` + `media_capture` for the selected `supplier_type` — one generic uploader/capture component, driven by config (allowed file types, min counts, geotag flag).
- **Workflow** stays shared. The `required_artifacts_by_state` in the workflow can reference `type:required_documents`, so the *same* `verifying → verified` transition demands farmer docs for a farmer and business docs for a business, without a separate workflow.
- **Verification engine** iterates the **type's** `verification_signals` (not just the domain's), resolving each via the plugin registry.
- **`required_if`** conditions (e.g. `qc_requested`, `deals_in includes 'seeds'`) are evaluated by the same expression evaluator used for domain-level `required_if`.

**Rule:** documents/media/signals live on the `supplier_type` config — never as `if (type === 'farmer')` in code. Adding a new actor type = config + (only if a new signal is needed) one registered adapter.

---

## 3. Dynamic entity attributes (JSON Schema + JSONB)

Supplier/listing fields differ per domain. Do **not** add columns per domain. Instead:

- Store variable attributes in a `attributes JSONB` column.
- Each domain provides a **JSON Schema** per entity (`entity_schemas.supplier`, `.listing`).
- **Validate server-side** against the domain schema on write.
- **Render forms dynamically** on the frontend from the same JSON Schema (one schema-driven form renderer, e.g. a JSON-Schema form library). One renderer serves every domain.

```
Supplier (
  id, domain_key, supplier_type, gstin, legal_name, status,
  attributes JSONB,        -- validated against domain.entity_schemas.supplier
  consent_at, created_at
)
```

This means a new domain's supplier/listing fields = a new JSON Schema file. **No migration, no code.**

---

## 4. Workflow engine (the "customised flow per domain")

The customised flow is a **declarative state machine defined in config**, interpreted by ONE generic engine. Domain-specific logic that can't be declared is referenced by **plugin key** (guards/actions registered in code).

```yaml
# workflows/agriculture.workflow.yaml
workflow:
  initial: "draft"
  states: [draft, submitted, verifying, verified, flagged,
           qc_pending, qc_passed, qc_failed, escrow_active, completed, disputed]

  transitions:
    - { from: draft,      to: submitted,   on: "submit",
        guard: "required_fields_present" }            # registered guard plugin
    - { from: submitted,  to: verifying,   on: "start_verification" }
    - { from: verifying,  to: verified,    on: "verification_done",
        guard: "signals_meet_threshold" }
    - { from: verifying,  to: flagged,     on: "verification_done",
        guard: "signals_below_threshold" }
    - { from: verified,   to: qc_pending,  on: "request_qc",
        guard: "feature.qc_enabled" }
    - { from: qc_pending, to: qc_passed,   on: "qc_signoff",
        guard: "qc_score_pass" }
    - { from: qc_pending, to: qc_failed,   on: "qc_signoff",
        guard: "qc_score_fail" }
    - { from: qc_passed,  to: escrow_active,on: "fund_escrow",
        guard: "feature.escrow_enabled", action: "create_escrow_order" }
    - { from: escrow_active, to: completed, on: "release_escrow",
        action: "release_milestone" }
    - { from: "*",        to: disputed,    on: "open_dispute",
        action: "open_dispute_case" }

  required_artifacts_by_state:
    verified:   ["gst", "litigation"]
    qc_passed:  ["inspection_report"]
```

**Engine contract:**
- One `WorkflowEngine` interprets any domain's workflow. It never knows about agriculture.
- `guard` and `action` strings resolve via `GuardRegistry` / `ActionRegistry`.
- `feature.*` guards read the domain's `feature_flags`.
- A transition referencing an unregistered guard/action → **fails config validation in CI**, not at runtime.
- Every transition writes an `AuditLog` entry.

A new domain that only reorders/renames states or gates differently = **pure config**. A domain needing a brand-new guard/action = add one registered function + reference it.

---

## 5. Plugin registries (the code-level seam)

Some domain differences genuinely need code (calling FSSAI vs FCO vs MCA, scoring grain vs chemical purity). Expose them as **named, registered strategies**, referenced by key from config.

```ts
// All registries fail-fast: resolving an unregistered key throws at config-load.

VerificationAdapterRegistry {
  "gst": GstAdapter,
  "fssai": FssaiAdapter,
  "seed_license": SeedLicenseAdapter,        // Seeds (Control) Order
  "fco_license": FertiliserLicenseAdapter,   // Fertilizer Control Order 1985
  "pesticide_license": PesticideLicenseAdapter, // Insecticides Act 1968
  "apmc_mandi": ApmcMandiAdapter,
  "fpo_registration": FpoRegistrationAdapter,
  "litigation": LitigationSignalAdapter,
}

QcScorerRegistry {
  "grain_grade": GrainGradeScorer,           // moisture/foreign-matter/broken → grade
  // future: "chem_purity", "component_spec", ...
}

GuardRegistry  { "required_fields_present", "signals_meet_threshold", "qc_score_pass", ... }
ActionRegistry { "create_escrow_order", "release_milestone", "open_dispute_case", ... }
```

**Adapter interface (one shape for all verification signals):**
```ts
interface VerificationAdapter {
  key: string;
  run(input: { supplier: Supplier; domain: DomainConfig }): Promise<{
    status: 'pass' | 'flag' | 'na';
    evidence: Record<string, unknown>;   // stored in VerificationReport.signals_json
    summary: string;
  }>;
}
```

The `VerificationEngine` iterates `domain.verification_profile.required_signals`, resolves each adapter by key, runs it, and assembles a **graded** `VerificationReport` (never a binary "safe" — see PLANNING GUARDRAIL #3).

---

## 6. Data model additions (extends PLANNING.md §7)

```
Domain          (key PK, name, status, version, config_json, meta_schema_version, created_at)
DomainVersion   (id, domain_key, version, config_json, published_at)   -- immutable snapshots

-- every domain-scoped entity carries domain_key + the workflow version it runs on
Supplier        (... domain_key, supplier_type, attributes JSONB ...)
Listing         (id, domain_key, supplier_id, attributes JSONB, ...)
WorkflowInstance(id, domain_key, workflow_version, subject_type, subject_id, current_state, context_json)
WorkflowEvent   (id, instance_id, from_state, to_state, event, actor, created_at)
VerificationReport (... domain_key, signals_json, status[graded], ...)
QCJob           (... domain_key, criteria_results_json, grade, ...)

-- per-supplier-type documents & media (requirement defined in supplier_type config)
SupplierDocument(id, supplier_id, domain_key, doc_key, file_ref, mime, status[pending|accepted|rejected],
                 verified_by_signal?, uploaded_at)        -- file in MinIO; doc_key ∈ type.required_documents
MediaAsset      (id, supplier_id, domain_key, media_key, type[image|video], file_ref,
                 geo_lat?, geo_lng?, captured_at)          -- media_key ∈ type.media_capture
```

- **Everything domain-scoped carries `domain_key`.** Queries are always domain-filtered (consider RLS by domain too).
- `WorkflowInstance.workflow_version` pins the config version so live flows don't break when config is republished.

---

## 7. Module structure (extends PLANNING.md §6)

```
src/
  platform/
    domains/         # DomainConfig loader, meta-schema validator, version store
    workflow/        # generic WorkflowEngine + Guard/Action registries
    schema/          # JSON-Schema validation + dynamic form metadata
    registries/      # VerificationAdapterRegistry, QcScorerRegistry
  modules/
    auth/  suppliers/  listings/  verification/  qc/  escrow/  disputes/  rfq/  notifications/  audit/
  adapters/
    verification/    # gst/, fssai/, seed_license/, fco_license/, pesticide_license/, apmc_mandi/, fpo_registration/, litigation/
    qc/              # grain_grade/
  config/
    domains/
      agriculture/
        domain.yaml
        schemas/ supplier.schema.json  listing.schema.json
        workflows/ agriculture.workflow.yaml
    domain.meta.schema.json
admin/               # (layer 2/3 — built later) read-only first, CRUD config studio last
```

**Business-logic modules must depend only on `platform/*` and config — never on a specific domain folder.**

---

## 8. Agriculture: first config (concrete, seed as code)

> Pick ONE sub-vertical to actually launch. The config supports all three; you seed one.

| Sub-vertical | Suppliers | Key verification signals | QC focus |
|---|---|---|---|
| **Agri-output / produce** *(recommended first — best QC fit)* | FPOs, traders, aggregators | GST, APMC/mandi, FPO registration, Agmark, litigation | Moisture %, foreign matter, broken %, grade (FAQ) |
| **Agri-inputs** | Input dealers, distributors | GST, seed license, FCO (fertiliser), pesticide license, litigation | Batch authenticity, label/spec compliance, anti-counterfeit |
| **Equipment** | Dealers, OEMs | GST, MCA, dealership authorisation, litigation | Spec/condition verification |

**Recommendation (moderate confidence):** start with **agri-output/produce**, because quality grading and adulteration are real, painful, and exactly what a QC/trust layer is *for* — the thesis is strongest there. Agri-inputs is also strong (counterfeit seeds/pesticides are a massive problem) but verification depends on multiple state-licensing registries that may be harder to access programmatically. **Confirm which sub-vertical you have buyer access to before seeding.**

> **DECIDED (2026-07-01):** launch sub-vertical is **agri-output / produce**.

Note (moderate confidence): agri B2B is lower-margin and government-heavy (eNAM, ONDC agri, NABARD, WDRA warehouse receipts). That strengthens the *config* case (you'll want eNAM/ONDC-agri as a Phase-4 rail) but means pricing power per verification may be thinner than in chemicals/components — pressure-test the `verification_fee` hard in Phase 0.

---

## 9. Anti-patterns (Claude Code: reject these in review)

- ❌ `if (domain === '...')` anywhere outside the config/registry resolution layer.
- ❌ Per-domain database columns or per-domain tables for variable attributes (use JSONB + JSON Schema).
- ❌ Hardcoded workflow steps in services (must be config-driven via the engine).
- ❌ Building the admin config studio before vertical #2 exists and pays.
- ❌ Adapters that hold funds or make lending decisions (PLANNING GUARDRAILS #1, #2).
- ❌ A verification adapter returning a binary "verified/safe" (must be graded with evidence).

---

## 10. Tasks (insert into TASKS.md, after Phase 0)

**Platform core (do as part of Phase 1):**
- [ ] `domain.meta.schema.json` + DomainConfig loader/validator; fail-fast on unknown plugin keys.
- [ ] DomainVersion store (immutable published snapshots).
- [ ] Generic `WorkflowEngine` + `GuardRegistry` + `ActionRegistry`; CI validation that every config-referenced guard/action is registered.
- [ ] JSON-Schema validation service + dynamic form metadata endpoint.
- [ ] `VerificationAdapterRegistry` + adapter interface; seed `gst` + `litigation` adapters first.
- [ ] Seed **agriculture** domain config (chosen sub-vertical) as code; load on deploy.

**Per added signal/scorer (incremental):**
- [ ] Implement adapter, register it, reference it from a domain config, add tests.

**Admin (NOT NOW — gated):**
- [ ] (Layer 2, at vertical #2) read-only domain-config viewer.
- [ ] (Layer 3, only on real config churn) config CRUD studio: draft→validate→preview→publish, versioned.

---

## 11. Open questions (surface; do not invent)

1. ~~Which agriculture **sub-vertical** launches first~~ → **DECIDED: agri-output / produce.**
2. Do you have programmatic or manual access to the relevant license registries (Agmark/APMC, or seed/FCO/pesticide) for that sub-vertical?
3. Will ONDC-agri / eNAM be a sourcing rail in Phase 4, or stay out of scope?
4. Pricing per verification in agriculture — what will a produce buyer actually pay? (Phase 0 test.)

---

*Net: build the domain abstraction (config + workflow engine + plugin registries) now; ship agriculture as config-as-code; build the admin config studio last. A new domain that recombines existing capabilities should require zero code — only config.*
