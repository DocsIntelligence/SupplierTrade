# logger

## Purpose
Structured JSON logging via `nestjs-pino` + `pino-http`. `pino-pretty` is used in dev for readable output.

## Files
- `apps/api/src/app/logger/logger.module.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `LOG_LEVEL` | yes | `fatal | error | warn | info | debug | trace | silent` |

## Providers / abstractions
Pino — replaceable by swapping the `LoggerModule.forRoot` call.

## Endpoints
None. Logs go to stdout.

## Admin UI
None.

## Plug into a new project
Copy `logger.module.ts` and add to `app.module.ts` imports. Set `LOG_LEVEL` in `.env`.
