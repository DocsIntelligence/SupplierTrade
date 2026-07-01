/**
 * Canonical lookup group keys used by domain configs + forms. Keep in sync with
 * the seeds in `tools/prisma/seed-data/lookups.ts` and the `x-lookup` keywords
 * in the per-domain schema JSON files.
 */
export const LOOKUP_KEYS = {
  INDIAN_STATES: 'indian-states',
  AGRI_COMMODITIES: 'agri-commodities',
} as const;

export type LookupKey = (typeof LOOKUP_KEYS)[keyof typeof LOOKUP_KEYS];
