# storage

## Purpose
File storage with two drivers: S3-compatible (MinIO / AWS S3 / R2) when env is set, local disk for dev. Returns `{ key, url, size, contentType }` on upload. Presigned upload + download URLs for the S3 driver.

## Files
- `apps/api/src/app/storage/storage.module.ts`
- `apps/api/src/app/storage/storage.service.ts`
- `apps/api/src/app/storage/storage.controller.ts`

## Env vars
| Var | Required | Notes |
|-----|----------|-------|
| `STORAGE_ENDPOINT`    | no | S3 / MinIO endpoint URL |
| `STORAGE_REGION`      | no | default `us-east-1` |
| `STORAGE_ACCESS_KEY`  | no | |
| `STORAGE_SECRET_KEY`  | no | |
| `STORAGE_BUCKET`      | no | default `uploads` |
| `STORAGE_PUBLIC_URL`  | no | public CDN prefix |

Missing endpoint/access/secret → local-disk driver auto-activates.

## Providers / abstractions
- `@aws-sdk/client-s3` for S3 calls.
- `@aws-sdk/s3-request-presigner` for presigned URLs.
- Local-disk fallback writes under `.storage-local/`.

## Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/storage/upload`          | jwt | multipart upload |
| GET  | `/storage/presigned/upload`| jwt | client-direct upload URL |
| GET  | `/storage/:key`            | jwt | download / presigned redirect |

## Admin UI
None today. A "Storage browser" page is a good future addition under `/config/storage`.

## Plug into a new project
1. Copy `apps/api/src/app/storage/`.
2. Set S3 env vars (or leave them off for local-disk).
3. Import `StorageModule` in `app.module.ts`.

## Extending
Add a new driver by extending `StorageService` with a `useDriver()` switch and a new `<driver>.ts` adapter. Keep the `UploadResult` contract intact.
