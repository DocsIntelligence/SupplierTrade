import { z } from 'zod';
import { paginationQuerySchema } from '../common/pagination.schema';

/**
 * Server-side list query for suppliers: pagination + search + sort (from the
 * shared paginationQuerySchema) plus domain/type/status filters. Shared by the
 * API (ZodValidationPipe) and the app's DataTable server calls. See docs/UI-STANDARDS.md.
 */
export const supplierListQuerySchema = paginationQuerySchema.extend({
  domainKey: z.string().min(1, 'domainKey is required'),
  supplierType: z.string().optional(),
  status: z.string().optional(),
});

export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;

/** Columns the API allows sorting by (guards against arbitrary orderBy). */
export const SUPPLIER_SORT_FIELDS = [
  'legalName',
  'status',
  'supplierType',
  'createdAt',
] as const;
export type SupplierSortField = (typeof SUPPLIER_SORT_FIELDS)[number];
