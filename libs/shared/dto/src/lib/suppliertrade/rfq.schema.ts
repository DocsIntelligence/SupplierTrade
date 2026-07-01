import { z } from 'zod';
import { paginationQuerySchema } from '../common/pagination.schema';

export const rfqStatusSchema = z.enum([
  'draft',
  'open',
  'matched',
  'sampling',
  'awarded',
  'closed',
  'cancelled',
]);

export const rfqResponseStatusSchema = z.enum([
  'suggested',
  'shortlisted',
  'quoted',
  'rejected',
  'awarded',
]);

export const buyerValidationSignalSchema = z.enum([
  'verification_fee_interest',
  'qc_fee_interest',
  'pilot_commitment',
  'rejected_price',
]);

export const createRfqLineSchema = z.object({
  commodityKey: z.string().min(1, 'Commodity is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').default('MT'),
  targetGrade: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const createRfqSchema = z.object({
  domainKey: z.string().min(1, 'Domain is required'),
  buyerOrgId: z.string().optional(),
  title: z.string().min(2, 'Title is required').max(200, 'Title is too long'),
  deliveryState: z.string().optional(),
  deliveryDistrict: z.string().optional(),
  targetDate: z.coerce.date().optional(),
  budgetMinPaise: z.coerce.number().int().nonnegative().optional(),
  budgetMaxPaise: z.coerce.number().int().nonnegative().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  lines: z.array(createRfqLineSchema).min(1, 'At least one RFQ line is required'),
});

export const rfqListQuerySchema = paginationQuerySchema.extend({
  domainKey: z.string().min(1, 'domainKey is required'),
  status: rfqStatusSchema.optional(),
  buyerOrgId: z.string().optional(),
});

export const createRfqResponseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  listingId: z.string().optional(),
  status: rfqResponseStatusSchema.default('quoted'),
  quotedPricePaise: z.coerce.number().int().nonnegative().optional(),
  availableQuantity: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateRfqResponseSchema = createRfqResponseSchema
  .omit({ supplierId: true, listingId: true })
  .partial();

export const closeRfqSchema = z.object({
  status: z.enum(['awarded', 'closed', 'cancelled']),
  awardedResponseId: z.string().optional(),
  notes: z.string().optional(),
});

export const recordBuyerValidationSignalSchema = z.object({
  signal: buyerValidationSignalSchema,
  amountPaise: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const RFQ_SORT_FIELDS = ['title', 'status', 'createdAt', 'targetDate'] as const;

export type CreateRfqDto = z.infer<typeof createRfqSchema>;
export type CreateRfqLineDto = z.infer<typeof createRfqLineSchema>;
export type RfqListQuery = z.infer<typeof rfqListQuerySchema>;
export type CreateRfqResponseDto = z.infer<typeof createRfqResponseSchema>;
export type UpdateRfqResponseDto = z.infer<typeof updateRfqResponseSchema>;
export type CloseRfqDto = z.infer<typeof closeRfqSchema>;
export type RecordBuyerValidationSignalDto = z.infer<
  typeof recordBuyerValidationSignalSchema
>;
