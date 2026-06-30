# invitations

## Purpose
Invite users by email to an organization. SHA-256 hashed token in DB; raw token is delivered by email only. Expires in 7 days. Accept requires being signed in as the invited email.

## Files
- `apps/api/src/app/invitations/invitations.module.ts`
- `apps/api/src/app/invitations/invitations.service.ts`
- `apps/api/src/app/invitations/invitations.controller.ts`
- `apps/api/src/app/mail/templates/invitation.template.ts`

## Prisma models
`Invitation`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/orgs/:orgId/invitations` | admin/owner | `{ email, role? }` — sends email |
| GET | `/orgs/:orgId/invitations` | admin/owner | pending list |
| DELETE | `/orgs/:orgId/invitations/:id` | admin/owner | revoke |
| POST | `/invitations/:token/accept` | jwt | accept; signed-in email must match |

## Plug into a new project
1. Copy `apps/api/src/app/invitations/` + `mail/templates/invitation.template.ts`.
2. Register the `invitation` template in `mail.processor.ts` `TEMPLATES`.
3. Add `Invitation` to Prisma.
4. Import `InvitationsModule` (depends on `OrgModule` + `MailModule`).
