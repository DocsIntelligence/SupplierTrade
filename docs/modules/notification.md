# notification

## Purpose
Two-channel user-facing notifications:
- **In-app bell** — `Notification` rows the frontend polls.
- **Web Push** — VAPID-signed browser push for offline / off-tab delivery.

Admin can broadcast to every user in one call.

## Files
- `apps/api/src/app/notification/notification.module.ts`
- `apps/api/src/app/notification/notification.service.ts`
- `apps/api/src/app/notification/notification.controller.ts`
- `apps/api/src/app/notification/push.service.ts`
- `apps/api/src/app/notification/push.controller.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `VAPID_PUBLIC_KEY`  | no | enables Web Push |
| `VAPID_PRIVATE_KEY` | no | enables Web Push |
| `VAPID_SUBJECT`     | no | `mailto:admin@example.com` |

Generate VAPID keys with `pnpm exec web-push generate-vapid-keys`. Without them the in-app bell still works; Web Push is just disabled.

## Providers / abstractions
- `web-push` for VAPID delivery. Dead subscriptions (404 / 410) are pruned automatically.

## Prisma models
`Notification`, `PushSubscription`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `/notifications`         | jwt | last 50 |
| GET  | `/notifications/unread`  | jwt | unread count |
| POST | `/notifications/read`    | jwt | mark one or all read |
| POST | `/notifications/broadcast` | admin | send to every user |
| GET  | `/push/public-key`       | public | VAPID public key |
| POST | `/push/subscribe`        | jwt | register subscription |
| POST | `/push/unsubscribe`      | jwt | drop subscription |

## Admin UI
`/config/notifications` — broadcast composer.

## Plug into a new project
1. Copy `apps/api/src/app/notification/`.
2. Add `Notification` + `PushSubscription` Prisma models.
3. Add VAPID env vars + add `web-push` + `@types/web-push` to `package.json`.
4. Import `NotificationModule` in `app.module.ts`.
5. (Optional) wire your own `ChatGateway` / `SocketGateway` to also `gateway.emitToUser(userId, 'notify:new', n)` after `notification.notify(...)` resolves — live bell badge.

## Extending
Add a new `type` (e.g. `billing.payment_failed`) — it's a free-form string. Centralise the vocabulary in `@org/utils` so clients can render category-specific icons.
