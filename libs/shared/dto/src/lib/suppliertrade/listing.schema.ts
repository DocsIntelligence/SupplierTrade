import { z } from 'zod';

/** Maintained DTO for creating a listing (shared API + app). */
export const createListingSchema = z.object({
  domainKey: z.string().min(1, 'Domain is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export type CreateListingDto = z.infer<typeof createListingSchema>;
