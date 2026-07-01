import { z } from 'zod';

/**
 * Shared contract for schema-driven dynamic forms (DOMAIN-ARCHITECTURE.md §3).
 * The API derives `FormFieldMeta[]` from a domain's JSON Schema (reading the
 * `x-widget` / `x-lookup` extension keywords); the frontend renders the right
 * widget from it and builds a matching Zod schema via `buildAttributesSchema`.
 *
 * Reference data (states, commodities, …) is NOT hard-coded in enums — a field
 * carries a `lookup` group key and the UI fetches values from the lookup module.
 */

export const FORM_WIDGETS = [
  'text',
  'textarea',
  'number',
  'checkbox',
  'select',
  'multiselect',
] as const;
export type FormWidget = (typeof FORM_WIDGETS)[number];

export interface FormFieldMeta {
  key: string;
  label: string;
  /** underlying JSON-Schema type (string | number | integer | boolean | array) */
  type: string;
  widget: FormWidget;
  required: boolean;
  /** lookup group key — when set, options are fetched from the lookup module */
  lookup?: string;
  /** inline options (used only when there is no lookup) */
  enum?: (string | number)[];
  min?: number;
  max?: number;
  description?: string;
}

/**
 * Build a Zod schema for an entity's `attributes` object from its field
 * metadata. Used by react-hook-form on the client; the server independently
 * validates against the full JSON Schema (defence in depth).
 */
export function buildAttributesSchema(
  fields: FormFieldMeta[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const f of fields) {
    let field: z.ZodTypeAny;

    switch (f.widget) {
      case 'number': {
        let n = z.number({ error: `${f.label} must be a number` });
        if (f.min !== undefined) n = n.min(f.min, `${f.label} must be ≥ ${f.min}`);
        if (f.max !== undefined) n = n.max(f.max, `${f.label} must be ≤ ${f.max}`);
        field = n;
        break;
      }
      case 'checkbox':
        field = z.boolean();
        break;
      case 'multiselect': {
        let a = z.array(z.string());
        if (f.required) {
          a = a.min(1, `Select at least one ${f.label.toLowerCase()}`);
        }
        field = a;
        break;
      }
      default: {
        let s = z.string();
        if (f.required) s = s.min(1, `${f.label} is required`);
        field = s;
      }
    }

    shape[f.key] = f.required ? field : field.optional();
  }

  return z.object(shape);
}
