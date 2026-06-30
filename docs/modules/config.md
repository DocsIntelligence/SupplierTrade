# config

## Purpose
Boot-time Zod validation of every env var. Required vars hard-fail; optional groups (mail, OAuth, payment, AI, storage, web-push, redis) log a warning and disable the feature instead.

## Files
- `apps/api/src/app/config/config.module.ts`
- `apps/api/src/app/config/config.service.ts`
- `apps/api/src/app/config/schema.ts` — single source of truth for env var typing

## Env vars
See `schema.ts`. Required block: `NODE_ENV`, `PORT`, `GLOBAL_PREFIX`, `PUBLIC_URL`, `FRONTEND_URL`, `CORS_ORIGIN`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `ACCESS_TOKEN_SECRET/TTL`, `REFRESH_TOKEN_SECRET/TTL`, `DATABASE_URL`, `LOG_LEVEL`.

Every other module that adds an env var **must** add it to this schema.

## Providers / abstractions
- `validateEnv(env)` parses and warns on optional groups.
- `OPTIONAL_GROUPS` table tells the user what's partially configured.

## Endpoints
None. Use via `ConfigService.get<T>('SOMEKEY')`.

## Admin UI
None — env edits happen out of band.

## Plug into a new project
1. Copy `apps/api/src/app/config/`.
2. Adjust the required block to your project's needs.
3. Add optional vars + an `OPTIONAL_GROUPS` entry per integration.

## Extending
Add a new var to `envSchema`, and (if optional) a new entry to `OPTIONAL_GROUPS` so partial configuration is detected and warned about.
