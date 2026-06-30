# referrals

## Purpose
Generic referral tracking. Every user has a stable, shareable code (8 chars from a Crockford-style alphabet, no 0/1/i/l/o). When someone signs up using a code (`?ref=<code>` link or `POST /referrals/attach` post-signup), a `Referral` row links referrer → referred. The reward decision is left to the consuming project — boilerplate only tracks `pending` / `awarded` / `cancelled` status and a free-form `rewardMetadata` JSON.

A referred user can only be referred once (`Referral.referredId` is `@unique`). Self-referral is rejected.

## Files
- `apps/api/src/app/referrals/referrals.module.ts`
- `apps/api/src/app/referrals/referrals.service.ts`
- `apps/api/src/app/referrals/referrals.controller.ts`

## Prisma models
`Referral` (added 2026-07-01, migration `referrals`).

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/referrals/me` | jwt | `{ code, shareUrl, stats: { invited, awarded, pending } }` — code is created on first call |
| GET | `/referrals/me/list` | jwt | my referrals + reward status |
| POST | `/referrals/attach` | jwt | `{ code, source? }` — for users that signed up without `?ref=` |
| GET | `/admin/referrals` | admin | global list |
| POST | `/admin/referrals/:id/reward` | admin | `{ id, metadata? }` → mark as `awarded` |

## Admin UI
`/config/referrals` — list, search, mark-awarded button.

## User UI
`/referrals` — your code, share link, stats, list of people you invited.

## Integration: signup attach
The boilerplate does NOT auto-call `attachReferred` from `auth.service.register`. To wire it in (per project), add to your `register` body schema:

```ts
referralCode?: string
```

and right after `prisma.user.create(...)`:

```ts
if (dto.referralCode) {
  await this.referrals.attachReferred(dto.referralCode, newUser.id, 'signup')
    .catch(() => undefined); // never fail signup because of a bad code
}
```

Import `ReferralsService` via the existing global module — no extra wiring needed.

## Rewarding (project-specific)
The boilerplate ships with **status tracking only**. To reward a referral:

1. Decide your trigger condition (e.g. "referred user makes first paid payment").
2. From that handler call `referrals.markRewarded(referralId, { amount: 10000, currency: 'INR', planId: 'pro-monthly' })`.
3. (Optional) credit the referrer's `UserWallet` / increment a custom credit balance — the boilerplate does NOT do this for you because the credit model varies wildly per project.

## Plug into a new project
1. Copy `apps/api/src/app/referrals/`.
2. Add `Referral` to Prisma + a relation pair on `User` (`referralsMade`, `referredBy`).
3. Run `pnpm prisma migrate dev --name referrals`.
4. Import `ReferralsModule` in `app.module.ts`.
5. (Frontend) Copy `apps/app/src/app/features/referrals/Referrals.tsx` and the admin `ConfigReferrals.tsx`. Add routes + nav.
6. (Optional) Wire `attachReferred` into your signup flow.
