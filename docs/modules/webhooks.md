# webhooks (outbound)

## Purpose
Let downstream apps subscribe to events. Each `WebhookEndpoint` has a shared `secret`; deliveries are signed with HMAC-SHA256 over the raw JSON body (`X-Webhook-Signature: sha256=...`). Retried via BullMQ with exponential backoff (5 attempts) when `REDIS_URL` is set; sync fallback otherwise.

## Files
- `apps/api/src/app/webhooks/webhooks.module.ts`
- `apps/api/src/app/webhooks/webhooks.service.ts`
- `apps/api/src/app/webhooks/webhooks.processor.ts`
- `apps/api/src/app/webhooks/webhooks.controller.ts`

## Prisma models
`WebhookEndpoint`, `WebhookDelivery`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/orgs/:orgId/webhooks` | jwt member | list endpoints |
| POST | `/orgs/:orgId/webhooks` | admin/owner | `{ url, events: [...] }`. `"*"` subscribes to all events. |
| PATCH | `/orgs/:orgId/webhooks/:id` | admin/owner | `{ active }` |
| DELETE | `/orgs/:orgId/webhooks/:id` | admin/owner | remove |
| GET | `/orgs/:orgId/webhooks/:id/deliveries` | jwt member | last 100 attempts |

## Dispatching
From any module:
```ts
await this.webhooks.dispatch({
  event: 'payment.captured',
  orgId: payment.orgId,
  payload: { id: payment.id, amount: payment.amount },
});
```

## Plug into a new project
1. Copy `apps/api/src/app/webhooks/`.
2. Add `WebhookEndpoint` + `WebhookDelivery` to Prisma.
3. Import `WebhooksModule.forRootAsync()` (depends on `OrgModule` + global BullModule via mail).
4. For production-grade delivery set `REDIS_URL` so jobs flow through BullMQ.
