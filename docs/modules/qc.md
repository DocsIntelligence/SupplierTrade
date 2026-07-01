# qc

## Purpose

Config-driven quality-control scoring for listings. The active domain config selects a scorer and criteria; the scorer returns a grade, pass/fail, and breakdown. QC results are stored as jobs and can advance workflow context.

## Files

- `apps/api/src/app/modules-domain/qc/qc.module.ts`
- `apps/api/src/app/modules-domain/qc/qc.service.ts`
- `apps/api/src/app/modules-domain/qc/qc.controller.ts`
- `apps/api/src/app/adapters/qc/grain-grade.scorer.ts`
- `apps/api/src/app/platform/registries/qc-scorer.*`

## Env vars

None.

## Prisma models

`QcJob`.

## Endpoints

| Method | Path                  | Auth | Notes                                                |
| ------ | --------------------- | ---- | ---------------------------------------------------- |
| POST   | `/qc/listings/:id`    | jwt  | score listing criteria against the domain QC profile |
| GET    | `/qc?domainKey=<key>` | jwt  | list QC jobs in a domain                             |

## Providers / abstractions

Scorers implement `QcScorer` and register by key through `QcScorerRegistry`. Current key: `grain_grade`.

## UI

QC creation and grade breakdown are currently folded into `SupplierDetail`. A domain-wide QC ops table is still a follow-up.

## Plug into a new project

1. Copy `apps/api/src/app/modules-domain/qc/`.
2. Copy/register required scorer adapters under `apps/api/src/app/adapters/qc/`.
3. Reference the scorer key in `domain.qc_profile.scorer`.
4. Run `pnpm domain:validate`.

## Extending

Add scorer-specific inputs to `domain.qc_profile.criteria`; keep scorer selection config-driven and do not hard-code domain branches.
