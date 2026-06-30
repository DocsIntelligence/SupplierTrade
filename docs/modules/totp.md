# totp

## Purpose
TOTP-based 2FA (RFC 6238) using `otplib`. Setup → confirm with first code from app → returns recovery codes. Verify at login. Recovery codes are bcrypt-hashed and burned on use.

## Files
- `apps/api/src/app/totp/totp.module.ts`
- `apps/api/src/app/totp/totp.service.ts`
- `apps/api/src/app/totp/totp.controller.ts`

## Prisma models
`TwoFactor` (1:1 with User).

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/auth/totp/status` | jwt | enrollment status |
| POST | `/auth/totp/setup` | jwt | returns `{ secret, otpauth }` (render `otpauth` as a QR in UI) |
| POST | `/auth/totp/confirm` | jwt | `{ code }` from authenticator → enables 2FA, returns `recoveryCodes[]` (show once) |
| POST | `/auth/totp/disable` | jwt | `{ code }` — requires a current valid TOTP |

## Login integration
After password / OAuth succeeds, check `totpService.status(userId).enabled`. If true, gate access-token issuance behind `totpService.verify(userId, codeFromUser)` (or `consumeRecovery`).

## Plug into a new project
1. Copy `apps/api/src/app/totp/`.
2. `pnpm add otplib`.
3. Add `TwoFactor` to Prisma.
4. Import `TotpModule`. Wire the 2FA gate into your login flow.
