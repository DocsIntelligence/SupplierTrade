# payment

## Purpose
Subscriptions and one-time payments via Razorpay (primary) with Stripe env vars stubbed for later. Manages plans, plan-features, wallets (the user's active subscription slot), wallet usage (quota consumption), and webhook verification.

## Files
- `apps/api/src/app/payment/payment.module.ts`
- `apps/api/src/app/payment/payment.controller.ts`
- `apps/api/src/app/payment/razorpay.service.ts`
- `apps/api/src/app/payment/plan.service.ts`
- `apps/api/src/app/payment/wallet.service.ts`
- `apps/api/src/app/payment/wallet-usage.service.ts`
- `apps/api/src/app/payment/wallet.controller.ts`
- `apps/api/src/app/payment/payment.dto.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | no | Razorpay disabled if missing |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PUBLISHABLE_KEY` | no | Stripe — stub, not yet wired |

## Providers / abstractions
- Gateway enum: `razorpay | stripe`.
- Razorpay-specific HMAC-SHA256 webhook verification.
- Each payment row is idempotent on `gatewayPaymentId`.

## Prisma models
`Plan`, `PlanFeature`, `Payment`, `UserWallet`, `WalletUsage`.

## Endpoints (selected)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/payment/orders`    | jwt | create order / subscription |
| POST | `/payment/verify`    | jwt | verify client-side signature |
| POST | `/payment/webhook`   | public (signed) | gateway webhook |
| GET  | `/wallet/me`         | jwt | active wallet + usage |
| POST | `/admin/plans`       | admin | create plan |

## Admin UI
- `/config/plans` — plan CRUD.
- `/config/payments` — payment list + status filter.

## Plug into a new project
1. Copy `apps/api/src/app/payment/`.
2. Add gateway env vars.
3. Mount `/payment/webhook` as **raw body** in `main.ts` (signature verification needs the raw bytes).

## Extending
Add Stripe by:
1. New `stripe.service.ts` mirroring `razorpay.service.ts`.
2. New webhook route under `/payment/webhook/stripe`.
3. Add `gateway: 'stripe'` to the `createOrder` switch.
