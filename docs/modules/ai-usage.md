# ai-usage

## Purpose
Per-call AI metering — token counts, cost (via rate cards), latency, error chains, retention. Backbone of any spend dashboard.

## Files
- `apps/api/src/app/ai-usage/ai-usage.module.ts`
- `apps/api/src/app/ai-usage/ai-usage.service.ts` — query API
- `apps/api/src/app/ai-usage/ai-usage.recorder.ts` — write API
- `apps/api/src/app/ai-usage/ai-usage.context.ts` — request-scoped context
- `apps/api/src/app/ai-usage/ai-usage.purge.ts` — retention purger
- `apps/api/src/app/ai-usage/pricing.ts` — cost calculation against `AiModelPricing`
- `apps/api/src/app/ai-usage/ai-usage.controller.ts`

## Env vars
None directly — reads `Setting` rows for retention policy.

## Providers / abstractions
- `AiUsageRecorderService.record(...)` — fire-and-forget write after every AI call.
- `AiUsageService.list(query)` — paged log query.
- `AiUsageService.summary(query)` — totals + per-provider / model / operation rollups + p50 / p95 / p99 latency.

## Prisma models
`AiUsage`, `AiModelPricing`, `Setting` (for retention).

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/ai-usage`         | admin | paged list |
| GET | `/ai-usage/summary` | admin | totals + rollups |

## Admin UI
`/config/ai-usage`.

## Plug into a new project
1. Copy `apps/api/src/app/ai-usage/`.
2. Seed `AiModelPricing` with the rate cards you use (see `tools/scripts/` for example seeds).
3. Wire `AiUsageRecorderService` into your `AiService` calls.

## Extending
Add a new pricing lane (e.g. tool-use tokens) by:
1. Adding a column to `AiModelPricing` + a row to the cost math in `pricing.ts`.
2. Adding the matching column to `AiUsage` and the recorder payload.
