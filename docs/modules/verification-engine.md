# verification-engine

## Purpose

Supplier/domain-scoped graded verification. This is separate from the generic user KYC `verification` module. It reads required signals from domain config, runs registered adapters, stores a `VerificationReport`, and advances the supplier workflow using graded signal counts.

Verification results are never treated as a binary "safe" flag; UI must show per-signal status and evidence.

## Files

- `apps/api/src/app/modules-domain/verification-engine/verification-engine.module.ts`
- `apps/api/src/app/modules-domain/verification-engine/verification-engine.service.ts`
- `apps/api/src/app/modules-domain/verification-engine/verification-engine.controller.ts`
- `apps/api/src/app/adapters/verification/gst.adapter.ts`
- `apps/api/src/app/adapters/verification/litigation.adapter.ts`
- `apps/api/src/app/platform/registries/verification-adapter.*`

## Env vars

None for the current stub adapters. Live registry adapters should add their own optional env vars and fail closed when unavailable.

## Prisma models

`VerificationReport`.

## Endpoints

| Method | Path                                  | Auth | Notes                                        |
| ------ | ------------------------------------- | ---- | -------------------------------------------- |
| POST   | `/suppliers/:id/verify`               | jwt  | run graded verification and advance workflow |
| GET    | `/suppliers/:id/verification-reports` | jwt  | list reports for a supplier                  |

## Providers / abstractions

Adapters implement `VerificationAdapter` and register by key through `VerificationAdapterRegistry`. Current keys: `gst`, `litigation`.

## Plug into a new project

1. Copy `apps/api/src/app/modules-domain/verification-engine/`.
2. Copy/register the required adapters under `apps/api/src/app/adapters/verification/`.
3. Reference adapter keys from `domain.verification_profile.required_signals` or supplier type config.
4. Run `pnpm domain:validate` before deploy.

## Extending

Add a new signal by implementing and registering an adapter first, then referencing the key in config. Unknown keys should remain deploy-blocking.
