# UI-STANDARDS.md — frontend standards (production, non-negotiable)

> All UI in the React app (`apps/app`) and any shared UI MUST follow this.
> Pairs with `docs/FORMS.md` (forms/validation/reference-data) and
> `docs/DOMAIN-ARCHITECTURE.md`. Where they overlap, the stricter rule wins.

---

## 1. Always use library UI — never native controls

Use `@org/ui` components instead of raw HTML form/interactive elements.

| Instead of | Use from `@org/ui` |
|---|---|
| `<select>` | `Select` + `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem` |
| `<input>` | `Input` (with `hasError`) |
| `<textarea>` | `Textarea` |
| checkbox | `Checkbox` |
| toggle | `Switch` |
| button / link-button | `Button` (`asChild` to wrap a router `Link`) |
| tables / lists of data | `DataTable` (server mode — see §2) |
| labelled field + error | `FormField label error` |
| date | `DatePicker` |
| modal | `Dialog` |
| tabs | `Tabs` |
| toast | `toast` from `sonner` |

- Native elements are only acceptable **inside** a library component that has no
  equivalent slot, and even then prefer composing library primitives.
- Do not re-style a native control to look like the library one — use the library one.

**Radix `Select` note:** items cannot have an empty-string value. For an optional
select, show the empty state via the `SelectValue` `placeholder` (leave value
`undefined`) rather than an empty `SelectItem`.

**Next.js note:** the `@org/ui` barrel includes client-only components (DataTable,
rich-text editor). Do **not** import it into a Next **server component** (e.g. the
root `layout.tsx`) — it breaks the minimal `/_not-found` / `/_global-error`
prerenders. Import it only inside `'use client'` components/pages (see
`apps/web/src/lib/lang-switcher.tsx`).

---

## 2. Tables: server-side pagination, search & sort (for every list)

Every list of records uses `@org/ui` `DataTable` in **server mode** — never
client-only filtering over a full fetch. The server owns pagination, search, and
sort.

**API contract** (maintained in `@org/dto`):
- Query in: `paginationQuerySchema` → `{ page, pageSize, search?, sortBy?, sortOrder }`
  (extend per entity with filters, e.g. `supplierListQuerySchema`).
- Response out: `{ items, total, page, pageSize }` (`paginatedResponseSchema`).
- Validate the query with `new ZodValidationPipe(<entity>ListQuerySchema)`.
- Whitelist sortable columns server-side (e.g. `SUPPLIER_SORT_FIELDS`) — never
  pass an arbitrary `sortBy` into Prisma `orderBy`.
- Search uses `contains` across the entity's text columns.

**Client contract:** hold `page`, `query`, `sort` in state; refetch on change;
pass `DataTable`'s `server={{ page, pageCount, total, onPageChange, sort,
onSortChange, query, onQueryChange, pageSize, loading }}`. Reset to page 1 when
`query`, `sort`, or a filter changes.

**Reference implementation:** suppliers.
- API: `SuppliersService.list(query)` + `SuppliersController` `@Get()`
  (`apps/api/src/app/modules-domain/suppliers/`).
- DTO: `supplier-query.schema.ts` in `@org/dto`.
- UI: `features/suppliertrade/SuppliersList.tsx`.

**Every other entity list follows this exact shape** (listings, QC jobs, users,
plans, payments, lookups, orgs, audit, …). Copy the reference; do not hand-roll a
bespoke table or client-side pager.

---

## 3. CRUD pages

- **List** → server `DataTable` (§2), row → detail, primary "New" action.
- **Create / Edit** → react-hook-form + `zodResolver` on a maintained `@org/dto`
  schema; dynamic attributes via `DynamicFields` (see `docs/FORMS.md`); `FormField`
  errors on every field.
- **Detail** → read view + state actions.
- **Delete / destructive** → confirm via `Dialog` (never native `confirm()`).
- All CRUD copy is active-voice and consistent (`Publish` → toast `Published`).

---

## 4. Localization (i18n)

- React app (`apps/app`): i18n is initialized in `src/i18n.ts` (HTTP backend,
  locales under `public/locales/<lng>/translation.json`). Use `useTranslation()`
  and `t('key', 'Default')`; run `pnpm i18n:extract` to sync keys. The
  `LanguageSwitcher` (in the dashboard sidebar) changes language live.
- Next app (`apps/web`): i18n in `src/i18n.ts` (bundled resources, auto-detect).
  Add a landing switcher only inside a client page/component (see §1 Next note).
- New user-facing strings must be translatable (`t()`), not hardcoded.

**Reference data (lookups) is localized in the data, not the code.** Lookup values
carry translations in `metadata.i18n = { <locale>: label }` (seeded in
`tools/prisma/seed-data/lookups.ts`). The API stays locale-agnostic (returns
default `label` + `metadata`); the client resolves the label for the active
language via `localizedLookupLabel(value, i18n.language)` from `@org/utils`. This
means switching language relabels dropdowns instantly with no refetch, and
admin-added translations travel with the row. Add a locale = add a key to each
value's `metadata.i18n` (no code change).

---

## 4b. Audience: low-literacy, rural Indian users (plain & Hindi-first)

The supplier-facing flows (onboarding, documents, supplier detail) target users
with low literacy and limited English. Follow these:

- **Hindi resolves automatically** — i18n `supportedLngs` + `nonExplicitSupportedLngs`
  map `hi-IN` → `hi`; a big **EN | हिंदी** pill toggle sits at the top of onboarding
  so anyone can switch instantly. All new supplier-flow strings live under the
  `st.*` namespace in `public/locales/{en,hi}/translation.json`.
- **Plain words, not jargon.** "Trust check" not "Verification report";
  "Send for checking" not "Submit"; "Needs a look" not "flagged/insufficient".
- **Traffic-light status.** Never show raw statuses. Use `<StatusBadge status={…}>`
  (`features/suppliertrade/StatusBadge.tsx`, backed by `friendlyStatus()` in
  `status.ts`) — a coloured dot + one plain word (Trusted / Checking / Needs a look
  / Not started), with an optional one-line hint. green=trusted, blue=checking,
  red=needs-a-look, grey=not-started.
- **Big tap targets + icons.** Use `size="lg"` buttons and a leading icon on primary
  actions; supplier-type choices are large icon cards, not a dropdown.
- **Camera-first capture.** Image uploaders use `<input capture="environment">` so
  mobile opens the camera directly; label it "Take photo" with a camera icon.
- **Guided steps.** Multi-field forms are a numbered wizard (Who? → Details → Check)
  with a review step before submit.

## 5. Anti-patterns (reject in review)

- ❌ Native `<select>` / `<input>` / `confirm()` where an `@org/ui` component exists.
- ❌ Client-side pagination/sort over a full-collection fetch.
- ❌ `orderBy` from an unvalidated `sortBy`.
- ❌ Hardcoded user-facing strings (use `t()`); hardcoded dropdown options (use lookups).
- ❌ Importing the `@org/ui` barrel into a Next server component.
- ❌ A bespoke table when `DataTable` server mode fits.
