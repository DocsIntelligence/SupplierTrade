/**
 * Reference-data (lookup) localization.
 *
 * Lookup values store translations of their `label` in
 * `metadata.i18n = { <locale>: "<localized label>" }` (seeded in
 * tools/prisma/seed-data/lookups.ts). The API stays locale-agnostic — it
 * returns the default `label` plus the full `metadata` — so switching language
 * on the client relabels dropdowns instantly, with no refetch. See docs/FORMS.md.
 */

export interface LocalizableLookupValue {
  label: string;
  metadata?: unknown;
}

/** Pull the `{ locale: label }` map out of a value's metadata, if present. */
export function lookupI18nMap(
  metadata: unknown,
): Record<string, string> | undefined {
  if (metadata && typeof metadata === 'object' && 'i18n' in metadata) {
    const i18n = (metadata as { i18n?: unknown }).i18n;
    if (i18n && typeof i18n === 'object') {
      return i18n as Record<string, string>;
    }
  }
  return undefined;
}

/**
 * Localized label for a lookup value. Falls back to the base-language part of
 * the locale (e.g. `hi-IN` → `hi`), then to the value's default `label`.
 */
export function localizedLookupLabel(
  value: LocalizableLookupValue,
  locale: string | undefined,
): string {
  if (!locale) return value.label;
  const map = lookupI18nMap(value.metadata);
  if (!map) return value.label;
  return map[locale] ?? map[locale.split('-')[0]] ?? value.label;
}
