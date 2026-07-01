# suppliers

## Purpose

Domain-scoped supplier onboarding and workflow entrypoint. Suppliers store stable base fields plus config-validated `attributesJson`; the active domain config decides supplier types, required documents, media capture, and workflow behavior.

## Files

- `apps/api/src/app/modules-domain/suppliers/suppliers.module.ts`
- `apps/api/src/app/modules-domain/suppliers/suppliers.service.ts`
- `apps/api/src/app/modules-domain/suppliers/suppliers.controller.ts`
- `apps/api/src/app/modules-domain/suppliers/supplier-documents.service.ts`
- `apps/api/src/app/modules-domain/suppliers/supplier-documents.controller.ts`
- `apps/app/src/app/features/suppliertrade/SuppliersList.tsx`
- `apps/app/src/app/features/suppliertrade/SupplierDetail.tsx`
- `apps/app/src/app/features/suppliertrade/DocumentsPanel.tsx`

## Env vars

Uses storage env vars through `StorageService`; see [storage.md](storage.md).

## Prisma models

`Supplier`, `SupplierDocument`, `MediaAsset`, `WorkflowInstance`.

## Endpoints

| Method | Path                              | Auth | Notes                                                                   |
| ------ | --------------------------------- | ---- | ----------------------------------------------------------------------- |
| POST   | `/suppliers`                      | jwt  | create supplier; Zod base validation + JSON-Schema attribute validation |
| GET    | `/suppliers`                      | jwt  | server-side pagination, search, sort                                    |
| GET    | `/suppliers/:id`                  | jwt  | supplier detail with related domain/workflow data                       |
| POST   | `/suppliers/:id/events/:event`    | jwt  | fire workflow event such as `submit`                                    |
| GET    | `/suppliers/:id/requirements`     | jwt  | config-driven required documents/media                                  |
| GET    | `/suppliers/:id/documents`        | jwt  | list uploaded documents                                                 |
| POST   | `/suppliers/:id/documents`        | jwt  | multipart document upload; `docKey` must exist in config                |
| DELETE | `/suppliers/:id/documents/:docId` | jwt  | delete document                                                         |
| GET    | `/suppliers/:id/media`            | jwt  | list captured media                                                     |
| POST   | `/suppliers/:id/media`            | jwt  | multipart media upload; `mediaKey` must exist in config                 |

## UI

`/suppliers`, `/suppliers/:id`, and `/onboarding` in the React app. Forms are driven by `DynamicFields` and lookup-backed metadata.

## Plug into a new project

1. Copy `apps/api/src/app/modules-domain/suppliers/`.
2. Copy SupplierTrade DTOs from `libs/shared/dto/src/lib/suppliertrade/`.
3. Import `SuppliersModule` through `SupplierTradeModule`.
4. Copy the React feature files if the operational console is needed.

## Extending

Keep supplier-specific differences in domain config (`supplier_types`, `required_documents`, `media_capture`, schemas). Do not branch business logic by domain key.
