# common

## Purpose
Cross-cutting NestJS plumbing: HTTP exception filter, response-transform interceptor, request-logger middleware, Zod validation pipe, error utilities. Imported once in `app.module.ts`.

## Files
- `apps/api/src/app/common/common.module.ts`
- `apps/api/src/app/common/error.util.ts`
- `apps/api/src/app/common/filters/http-exception.filter.ts`
- `apps/api/src/app/common/interceptors/{transform.interceptor.ts, logging.interceptor.ts}`
- `apps/api/src/app/common/middleware/logger.middleware.ts`
- `apps/api/src/app/common/pipes/zod-validation.pipe.ts`

## Env vars
None — uses `LOG_LEVEL` indirectly via the logger module.

## Providers / abstractions
- `ZodValidationPipe` — bridge between Zod schemas and NestJS DTOs.
- `HttpExceptionFilter` — canonical error envelope `{ statusCode, message, code? }`.
- `TransformInterceptor` — uniform success envelope.

## Endpoints
None.

## Admin UI
None.

## Plug into a new project
Copy the whole `common/` folder and add `CommonModule` to `app.module.ts` imports. Wire the request middleware via `consumer.apply(RequestLoggerMiddleware).forRoutes('*')`.
