# @org/starter

A production-grade, full-stack **Nx monorepo** starter: a NestJS API, a React (Vite)
dashboard, a Next.js web app, and a headless artboard renderer for PDF/PNG/DOCX export —
wired together with a shared DTO/UI/utility layer and Prisma (SQLite by default).

## Stack

| Layer       | Tech                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Monorepo    | [Nx](https://nx.dev) + [pnpm](https://pnpm.io) workspaces                                                  |
| API         | [NestJS](https://nestjs.com), Prisma, Passport (JWT + OAuth + passkeys)                                    |
| Database    | [Prisma](https://www.prisma.io) → **SQLite** (`tools/prisma/dev.db`)                                       |
| Dashboard   | React + [Vite](https://vite.dev), react-hook-form + Zod                                                    |
| Web         | [Next.js](https://nextjs.org)                                                                              |
| Artboard    | React + Vite (HTML → PDF/PNG/DOCX render target)                                                           |
| Shared libs | `@org/dto`, `@org/ui`, `@org/utils`, `@org/hooks`, `@org/store`, `@org/api-client`, `@org/transliteration` |

## Apps & ports

| App       | Project    | Dev URL                   | What it is                               |
| --------- | ---------- | ------------------------- | ---------------------------------------- |
| Dashboard | `app`      | http://localhost:7100     | React + Vite authenticated dashboard     |
| Web       | `web`      | http://localhost:7110     | Next.js public / marketing site          |
| Artboard  | `artboard` | http://localhost:7120     | Headless renderer used by the PDF worker |
| API       | `api`      | http://localhost:7130/api | NestJS REST API (Swagger at `/docs`)     |

## Quick start

Prerequisites: **Node 20+** and **pnpm 10** (`corepack enable` picks up the pinned version).

```sh
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
#   then fill in the REQUIRED secrets (ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET).
#   Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 3. Create the SQLite database, run migrations, generate the client + seed
pnpm prisma:migrate:dev      # applies migrations; runs the seed
pnpm prisma:generate         # (run if you change schema.prisma later)

# 4. Start API + dashboard + web together
pnpm dev
```

`pnpm dev` runs `api`, `app`, and `web`. The **artboard** is started on demand (only
needed for PDF export):

```sh
pnpm exec nx serve artboard   # http://localhost:7120
```

## Common commands

| Command                           | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `pnpm dev`                        | Serve api + app + web                          |
| `pnpm dev:api` / `:app` / `:web`  | Serve a single app                             |
| `pnpm build`                      | Production build of api + app + web            |
| `pnpm lint` / `pnpm lint:fix`     | Lint all projects                              |
| `pnpm format:write`               | Prettier-format the repo                       |
| `pnpm prisma:migrate:dev`         | Create/apply a migration against SQLite + seed |
| `pnpm prisma:studio`              | Open Prisma Studio                             |
| `pnpm prisma:seed`                | Re-run the seed (plans + lookups)              |
| `pnpm seed:lookups`               | Seed only the lookup/reference data            |
| `pnpm graph`                      | Visualise the Nx project graph                 |
| `pnpm exec nx <target> <project>` | Run any Nx target for any project              |

## Database

Prisma is configured for **SQLite** out of the box — no external database needed for
local development. The schema lives at `tools/prisma/schema.prisma` and the database file
is created at `tools/prisma/dev.db` (gitignored).

> SQLite has no native enums, scalar string lists, or `@db.Decimal`. Former enum columns
> are plain `String`s whose allowed values are defined as const objects + union types in
> `@org/utils` (`libs/shared/utils/src/lib/enums.ts`); array columns use `Json`. Keep those
> enums in sync with the schema defaults.

To point at Postgres/MySQL instead, change the `datasource` provider in `schema.prisma`,
set `DATABASE_URL` accordingly, and re-create the migrations.

## Project layout

```
apps/
  api/        NestJS API
  app/        React + Vite dashboard
  web/        Next.js site
  artboard/   PDF/PNG/DOCX render target
libs/shared/  dto, ui, utils, hooks, store, api-client, transliteration
tools/prisma/ schema, migrations, seed
```

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for conventions, the golden rules, and how to
add a library / module / route.
