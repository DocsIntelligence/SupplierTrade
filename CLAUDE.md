<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# SupplierTrade — project conventions (always follow)

This is a multi-vertical **domain platform** (config = data, not code paths). Read
`docs/PLANNING.md` (master + GUARDRAILS), `docs/DOMAIN-ARCHITECTURE.md` (config
design), and `docs/SUPPLIERTRADE-PLAN.md` (build plan) before changing platform code.

**Non-negotiables (see PLANNING.md §2 GUARDRAILS):**
- No `if (domain === ...)` in business logic — differences live in config or a
  registered plugin (verification adapter / QC scorer / guard / action).
- Verification is **graded** with evidence, never a binary "safe".
- No fund custody / lending decisions in any adapter or action.
- Unknown plugin key → fail at config load, never at runtime.
- Do NOT build the admin config studio (gated to a later layer).

**Forms, validation & reference data — read `docs/FORMS.md` and follow it exactly:**
- Entity **base** fields use a maintained Zod DTO in `@org/dto`, shared by the API
  (`ZodValidationPipe`) and the app (react-hook-form `zodResolver`).
- Variable **attributes** are JSON-Schema-driven (`config/domains/*/schemas`),
  validated server-side and rendered by the ONE dynamic renderer
  (`features/suppliertrade/DynamicFields.tsx`).
- **Reference data (states, commodities, …) lives in the lookup module** — declare
  `x-lookup: <group-key>` + `x-widget` on the schema field, seed values in
  `tools/prisma/seed-data/lookups.ts`, register the key in `@org/dto` `LOOKUP_KEYS`.
  Never hardcode dropdown options in components.

**UI, tables & localization — read `docs/UI-STANDARDS.md` and follow it exactly:**
- **Always use `@org/ui` components, never native** `<select>`/`<input>`/`confirm()` etc.
- **Every list is a server-side `DataTable`** (pagination + search + sort on the API):
  query = `paginationQuerySchema`, response = `{ items, total, page, pageSize }`,
  whitelist sortable columns. Reference: suppliers list (API + `SuppliersList.tsx`).
- New user-facing strings use `t()` (i18n enabled in both apps). **Localize lookups
  in the data** via `metadata.i18n`; render with `localizedLookupLabel()` from `@org/utils`.
- Don't import the `@org/ui` barrel into a Next **server component**.
