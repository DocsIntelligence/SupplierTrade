# Contributing

Thanks for working on **@org/starter**. This document is the repo map, the setup, and the
golden rules. Read it before your first change.

## Setup

See the [README](README.md#quick-start) for the full quick-start. In short:

```sh
pnpm install
cp .env.example .env          # fill in ACCESS_TOKEN_SECRET + REFRESH_TOKEN_SECRET
pnpm prisma:migrate:dev       # create SQLite db + run migrations + seed
pnpm dev                      # api(7130) + app(7100) + web(7110)
```

## Repo map

| Path                     | What lives here                                             |
| ------------------------ | ----------------------------------------------------------- |
| `apps/api`               | NestJS API — auth, payments, mail, AI usage, lookups        |
| `apps/app`               | React + Vite dashboard (authenticated)                      |
| `apps/web`               | Next.js public site                                         |
| `apps/artboard`          | Headless render target for PDF/PNG/DOCX export              |
| `libs/shared/dto`        | Zod schemas + `createZodDto` DTOs — **the shared contract** |
| `libs/shared/ui`         | `@org/ui` component library (Button, Input, Select, …)      |
| `libs/shared/utils`      | `@org/utils` — enums, errors, config, i18n, helpers         |
| `libs/shared/hooks`      | `@org/hooks` React hooks                                    |
| `libs/shared/store`      | `@org/store` client state                                   |
| `libs/shared/api-client` | `@org/api-client` typed API client                          |
| `tools/prisma`           | `schema.prisma`, migrations, seed                           |

## Ports

| App      | Port |
| -------- | ---- |
| app      | 7100 |
| web      | 7110 |
| artboard | 7120 |
| api      | 7130 |

These are set in `apps/app/vite.config.mts`, `apps/web/project.json`,
`apps/artboard/vite.config.mts`, and `PORT` in `.env` (API). If you change one, also
update the matching `CORS_ORIGIN`, `FRONTEND_URL`, `*_API_URL`, and OAuth callback URLs.

## Golden rules

1. **Use Nx, not raw tooling.** Run tasks via `pnpm exec nx <target> <project>` (or the
   `pnpm` scripts), never the underlying CLI directly. Prefix with the package manager so
   you use the workspace-pinned Nx, not a global one.
2. **One shared schema.** Every form uses **react-hook-form + a shared `@org/dto` Zod
   schema** — the same schema the server validates via `createZodDto`. Use field-level
   inline errors and `applyServerFieldErrors` for server 400s. **Never** hand-roll
   `useState` validation.
3. **Use `@org/ui`.** Always use the shared components (`Select`, `Input`, …) — never raw
   native elements like `<select>`. Keep the look-and-feel consistent.
4. **Wrap UI strings for i18n.** New user-facing strings go through `t('key', 'English
default')` as you write them.
5. **Interface-first integrations.** Any external/provider seam (AI / OCR / storage /
   payment / mail) goes through interface → registry → factory → config-driven selection,
   with capability negotiation and observable fallbacks. Interface the seams, not
   single-implementation internals.
6. **Respect module boundaries.** Don't reach across app/lib boundaries; depend on the
   shared libs. Nx enforces the project graph.

## Database changes

- Edit `tools/prisma/schema.prisma`, then `pnpm prisma:migrate:dev --name <change>`.
- SQLite has **no enums / scalar arrays / `@db.Decimal`**. Model former enums as `String`
  and keep their allowed values in `@org/utils` enums; use `Json` for array columns; use
  the plain `Decimal` scalar (no native attribute).
- Avoid Postgres-only query features (`mode: 'insensitive'`, `createMany({ skipDuplicates })`,
  `date_trunc` / `percentile_cont` raw SQL). Keep queries portable.

## Before you push

Verify your change and **report honestly what you did and didn't run**:

```sh
pnpm exec nx build <project>    # typechecks as part of the build
pnpm exec nx lint <project>
```

For wider changes use `nx affected -t build lint test`.

## Commits & branches

- Branch off `main`; don't commit directly to `main`.
- Use [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`,
  `chore:`, `docs:`, `refactor:`, etc.
- Keep PRs focused; describe what changed and how you verified it.
