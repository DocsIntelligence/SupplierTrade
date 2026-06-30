# verification

## Purpose
Generic, user-bound identity / address / KYC verification. Member submits a `kind` + optional structured `payload` + optional evidence upload; admin reviews and approves or rejects. Decision emails the user.

`kind` is free-form — pick a vocabulary that fits the project (`identity`, `address`, `email`, `phone`, `kyc`, `professional`).

## Files
- `apps/api/src/app/verification/verification.module.ts`
- `apps/api/src/app/verification/verification.service.ts`
- `apps/api/src/app/verification/verification.controller.ts`
- `apps/api/src/app/verification/verification-admin.controller.ts`

## Env vars
None directly. Uses `storage` (for evidence) and `mail` (for decision notifications).

## Providers / abstractions
- `payload Json` for kind-specific fields (e.g. masked id last-4, address fields).
- Evidence uploaded via `StorageService` and referenced by `evidenceKey`.
- Decision purges the evidence from storage by default (privacy hygiene).

## Prisma models
`UserVerification`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/verification` | jwt | my verifications |
| POST | `/verification` | jwt | submit (multipart: `kind`, `payload` JSON, `evidence` file) |
| GET | `/admin/verification/queue` | admin | pending review queue |
| POST | `/admin/verification/:id/decide` | admin | `{ decision: 'approve'|'reject', reason?, purgeEvidence? }` |

## Admin UI
`/config/verification` — review queue with approve / reject + reason input.

## Plug into a new project
1. Copy `apps/api/src/app/verification/`.
2. Add `UserVerification` to Prisma schema.
3. Import `VerificationModule` (depends on `StorageModule` + `MailModule`).
4. Ensure the `verification-decision` mail template is registered in `mail.processor.ts`.

## Extending
Add a kind by:
1. Picking a string (`'pan'`, `'aadhaar'`, `'gst'`).
2. Defining the expected `payload` shape in `@org/dto`.
3. Optionally adding pre-decision auto-checks (e.g. DigiLocker for India IDs) in `verification.service.ts` between `submit` and the admin queue.
