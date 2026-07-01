# listings

## Purpose

Domain-scoped produce lot/listing CRUD. Listings attach to suppliers and validate `attributesJson` against the active domain's listing JSON Schema.

## Files

- `apps/api/src/app/modules-domain/listings/listings.module.ts`
- `apps/api/src/app/modules-domain/listings/listings.service.ts`
- `apps/api/src/app/modules-domain/listings/listings.controller.ts`
- `libs/shared/dto/src/lib/suppliertrade/listing.schema.ts`

## Env vars

None.

## Prisma models

`Listing`.

## Endpoints

| Method | Path                        | Auth | Notes                                                                  |
| ------ | --------------------------- | ---- | ---------------------------------------------------------------------- |
| POST   | `/listings`                 | jwt  | create listing; Zod base validation + JSON-Schema attribute validation |
| GET    | `/listings?domainKey=<key>` | jwt  | list listings in a domain                                              |
| GET    | `/listings/:id`             | jwt  | listing detail                                                         |

## UI

Listing create and summary views are currently folded into `SupplierDetail`. A domain-wide listings table is still a follow-up.

## Plug into a new project

1. Copy `apps/api/src/app/modules-domain/listings/`.
2. Copy the listing DTO/schema from `@org/dto`.
3. Ensure the domain config has `entity_schemas.listing`.
4. Import `ListingsModule` through `SupplierTradeModule`.

## Extending

Add listing fields to the domain JSON Schema and shared DTOs. For operational tables, follow the documented server-side `DataTable` pattern from `docs/UI-STANDARDS.md`.
