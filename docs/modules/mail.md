# mail

## Purpose
Transactional email — SMTP only. Two paths:
- **With Redis**: jobs go through a BullMQ queue with 3 retries + exponential backoff.
- **Without Redis**: synchronous send (best-effort).

Every attempt is audited in `MailLog`.

## Files
- `apps/api/src/app/mail/mail.module.ts`
- `apps/api/src/app/mail/mail.service.ts`
- `apps/api/src/app/mail/mail.transport.ts`
- `apps/api/src/app/mail/mail.processor.ts`
- `apps/api/src/app/mail/templates/*` — `welcome`, `password-reset`, `verification`, `verification-decision`
- `apps/api/src/app/mail/dto/send-mail.dto.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `MAIL_HOST` / `MAIL_PORT` | no | SMTP target |
| `MAIL_USER` / `MAIL_PASSWORD` | no | |
| `MAIL_FROM` | no | sender address |
| `REDIS_URL` | no | queue enabled when set |

If SMTP is missing, the module is built but `MailTransport.send` will fail — `MailLog` records the failure.

## Providers / abstractions
- `nodemailer` SMTP transport.
- BullMQ queue named `mail` (job type `send`).

## Prisma models
`MailLog`.

## Endpoints (admin only)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/admin/mail-logs` | admin | recent log entries |

The send API itself is DI-only: `mail.enqueue(dto)`.

## Admin UI
`/config/mail-logs`.

## Plug into a new project
1. Copy `apps/api/src/app/mail/`.
2. Add SMTP + Redis env vars.
3. Register `MailModule.forRootAsync()` in `app.module.ts`.

## Extending
Add a new template:
1. Create `templates/<name>.template.ts`.
2. Register it in the `TEMPLATES` map in `mail.processor.ts` AND in the sync path of `mail.service.ts` (sync path currently uses `dto.html` only — see backlog).
3. Call `mail.enqueue({ template: '<name>', templateData: {...} })`.
