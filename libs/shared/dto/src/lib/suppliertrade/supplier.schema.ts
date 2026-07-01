import { z } from 'zod';

/** 2 state digits + 10-char PAN + entity + 'Z' + checksum. */
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * Maintained DTO for creating a supplier — the single source of truth shared by
 * the API (`ZodValidationPipe`) and the app (react-hook-form `zodResolver`).
 * `attributes` are validated dynamically per-domain (see `buildAttributesSchema`)
 * on the client and against the domain JSON Schema on the server.
 */
export const createSupplierSchema = z.object({
  domainKey: z.string().min(1, 'Domain is required'),
  supplierType: z.string().min(1, 'Select a supplier type'),
  legalName: z
    .string()
    .min(2, 'Legal name is required')
    .max(200, 'Legal name is too long'),
  gstin: z
    .string()
    .regex(GSTIN_REGEX, 'Enter a valid 15-character GSTIN')
    .optional()
    .or(z.literal('')),
  orgId: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  consent: z
    .boolean()
    .refine((v) => v === true, 'Consent is required to onboard a supplier'),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
