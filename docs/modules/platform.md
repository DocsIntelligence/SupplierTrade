# platform

## Purpose

Domain-platform core for SupplierTrade-style multi-vertical apps. It loads config-as-code domains, publishes immutable active versions, validates entity attributes from JSON Schema, validates workflow definitions, and resolves domain-specific behavior through registries instead of `if (domain === ...)` branches.

This module is intentionally operational/read-only for configs. It does not include an admin config studio.

## Files

- `apps/api/src/app/platform/platform.module.ts`
- `apps/api/src/app/platform/domains/*`
- `apps/api/src/app/platform/schema/*`
- `apps/api/src/app/platform/workflow/*`
- `apps/api/src/app/platform/registries/*`
- `apps/api/src/app/platform/expression/*`
- `config/domain.meta.schema.json`
- `config/domains/*`
- `tools/scripts/validate-domain-configs.ts`

## Env vars

| Var                 | Required | Notes                                                                        |
| ------------------- | -------- | ---------------------------------------------------------------------------- |
| `DOMAIN_CONFIG_DIR` | no       | Defaults to `config/domains`; points loader/validator at another config root |

## Prisma models

`Domain`, `DomainVersion`, `WorkflowInstance`, `WorkflowEvent`.

## Providers / abstractions

- `DomainConfigLoader` reads `domain.yaml`, inlines schema/workflow `$ref` files, and returns a `DomainConfig`.
- `DomainConfigValidator` validates against `domain.meta.schema.json` and registered plugin keys.
- `DomainVersionStore` publishes immutable snapshots and resolves the active version.
- `JsonSchemaService` validates entity attributes and derives dynamic form metadata.
- `WorkflowEngine` interprets config-defined state machines and writes workflow/audit events.
- `VerificationAdapterRegistry` and `QcScorerRegistry` resolve keyed domain plugins.
- `GuardRegistry` and `ActionRegistry` resolve workflow guard/action keys.

## Endpoints

| Method | Path                         | Auth | Notes                                             |
| ------ | ---------------------------- | ---- | ------------------------------------------------- |
| GET    | `/domains`                   | jwt  | active domain list                                |
| GET    | `/domains/:key`              | jwt  | UI-safe active domain config                      |
| GET    | `/domains/:key/form/:entity` | jwt  | dynamic form metadata for `supplier` or `listing` |

## CI

`pnpm domain:validate` loads every config under `config/domains`, validates metadata/schema shape, and asserts every referenced verification adapter, QC scorer, workflow guard, and action key is registered. CI runs it after migrations.

## Plug into a new project

1. Copy `apps/api/src/app/platform/` and import `PlatformModule` in `app.module.ts`.
2. Copy `config/domain.meta.schema.json` and one or more `config/domains/<key>/` directories.
3. Copy the domain models to Prisma and run a migration.
4. Register all verification adapters and QC scorers before referencing their keys in config.
5. Add `pnpm domain:validate` to CI.

## Extending

Add new domain behavior by implementing a registry plugin, registering it, then referencing its key in config. Unknown keys must keep failing at validation/load time.
