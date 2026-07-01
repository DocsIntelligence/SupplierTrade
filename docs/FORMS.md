# FORMS.md — forms, validation & reference-data conventions (production standard)

> **This is a hard convention. All entity forms and their APIs MUST follow it.**
> It exists so every form is validated, accessible, and driven by maintained
> schemas + lookup reference data — never ad-hoc inputs or hardcoded dropdowns.

Applies to SupplierTrade domain entities (suppliers, listings, …) and any new
entity/form added to the platform.

---

## 1. The three layers (always all three)

1. **Maintained Zod DTO in `@org/dto`** — the single source of truth for an
   entity's *base* fields. Used by BOTH:
   - the **API** via `new ZodValidationPipe(schema)` on the controller, and
   - the **app** via react-hook-form `zodResolver(schema)`.
   Example: `createSupplierSchema`, `createListingSchema`
   (`libs/shared/dto/src/lib/suppliertrade/`).

2. **Per-domain JSON Schema** for the entity's variable `attributes`
   (`config/domains/<key>/schemas/*.json`). Validated server-side on write
   (`JsonSchemaService`) AND used to render the dynamic part of the form.

3. **Lookup module** for all reference data (states, commodities, districts…).
   Values live in the DB (`LookupGroup`/`LookupValue`), seeded in
   `tools/prisma/seed-data/lookups.ts`, fetched at runtime via `/lookups/:key`.

Client validates with layers 1+2 (via `buildAttributesSchema`); the server
re-validates with layers 1+2 independently (defence in depth). **Never trust the
client only.**

---

## 2. Reference data → lookups (NEVER hardcode dropdown values)

A dropdown/multiselect option list must come from a lookup group. Do **not**
inline `enum` values in a component or duplicate them across files.

To make a field lookup-backed, annotate its JSON-Schema property:

```json
"deals_in": {
  "type": "array",
  "title": "Commodities dealt in",
  "x-widget": "multiselect",
  "x-lookup": "agri-commodities",
  "items": { "type": "string" },
  "minItems": 1
}
```

- `x-lookup` = a lookup group `key`. The UI fetches its values and renders them.
- `x-widget` = how it renders (see §3). Optional; inferred from `type` if absent.

**Checklist to add a lookup-backed field:**
1. Add the group + values to `tools/prisma/seed-data/lookups.ts` (idempotent seed).
2. Register the key in `LOOKUP_KEYS` (`@org/dto` `lookup-keys.ts`).
3. Reference it via `x-lookup` in the domain schema.
4. Run `pnpm prisma db seed` (or `pnpm seed:lookups`).
That's it — no component changes; `DynamicFields` renders it.

---

## 3. Widgets

`FormFieldMeta.widget` (from `@org/dto`) drives rendering in
`apps/app/src/app/features/suppliertrade/DynamicFields.tsx`:

| widget | control | notes |
|---|---|---|
| `text` | `Input` | default for strings |
| `textarea` | `Input` (multiline TBD) | long text |
| `number` | `Input type=number` | emits `number \| undefined`; `min`/`max` from schema |
| `checkbox` | `Checkbox` | boolean |
| `select` | native `<select>` | lookup-backed or inline `enum` |
| `multiselect` | chip toggles | lookup-backed; emits `string[]` |

Widget is explicit via `x-widget`, else inferred: array→multiselect,
boolean→checkbox, number/integer→number, has-lookup/enum→select, else text.

---

## 4. Building a form (the pattern)

- Use **react-hook-form** + `@hookform/resolvers/zod` `zodResolver`.
- Base fields: reuse the maintained DTO (`.pick(...)` / `.extend(...)`).
- Dynamic attributes: `buildAttributesSchema(fields)` from `@org/dto`, composed
  under an `attributes` key; render with `<DynamicFields fields control errors />`.
- Show errors with `@org/ui` `FormField label error` + `Input hasError`. Every
  field must surface its message; required fields show `*`.
- Remount the RHF form (`key={domainKey + ':' + type}`) when the schema changes
  so the resolver picks up new fields.

Reference implementation: `SupplierCreate.tsx` (full form) and the `ListingForm`
in `SupplierDetail.tsx` (attributes-only form).

---

## 5. API side

- Controller validates the base DTO: `@Body(new ZodValidationPipe(schema)) dto`.
- Service validates `attributes` against the domain JSON Schema before persisting
  (`JsonSchemaService.validate`), returning field-level messages.
- Errors come back as `{ message: [{ path, message }] }` (Zod) or a string
  (attribute schema). The app's `extractError` normalises both.

---

## 6. Anti-patterns (reject in review)

- ❌ Hardcoded `<option>` lists / inline enums for real reference data → use a lookup.
- ❌ A form without a Zod resolver / without visible field error messages.
- ❌ Validating only on the client, or only on the server.
- ❌ Duplicating a DTO shape in the app instead of importing from `@org/dto`.
- ❌ Bypassing `DynamicFields` with bespoke per-domain field code.
- ❌ Adding a domain field's options anywhere other than the lookup module.

---

*See `DOMAIN-ARCHITECTURE.md` §3 (dynamic attributes) and `PLANNING.md` §2
GUARDRAIL #5 (consent). The form layer is how those land in the UI.*
