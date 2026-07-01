import { z } from 'zod';

/**
 * Contracts for supplier documents (config-required + custom "other" docs) and
 * the admin review trail. Uploads themselves are multipart (validated in the
 * controller); these cover the review action and shared constants/types so the
 * app and API agree on the vocabulary.
 */

/** docKey used for user-added custom documents (not in the type config). */
export const CUSTOM_DOC_KEY = 'other';

export const documentStatusSchema = z.enum(['pending', 'accepted', 'rejected']);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

/** Admin decision on a document. `note` is required when rejecting. */
export const reviewDocumentSchema = z
  .object({
    decision: z.enum(['accepted', 'rejected']),
    note: z.string().max(500, 'Note is too long').optional(),
  })
  .refine((v) => v.decision !== 'rejected' || !!v.note?.trim(), {
    message: 'A note is required when rejecting a document',
    path: ['note'],
  });

export type ReviewDocumentDto = z.infer<typeof reviewDocumentSchema>;

/** Shape returned to the UI for a stored document (mirrors the API view). */
export interface SupplierDocumentView {
  id: string;
  docKey: string;
  label?: string | null;
  note?: string | null;
  fileRef: string;
  fileUrl: string;
  mime: string;
  originalName?: string | null;
  sizeBytes?: number | null;
  status: DocumentStatus;
  reviewNote?: string | null;
  reviewedById?: string | null;
  decidedAt?: string | null;
  uploadedById?: string | null;
  uploadedAt: string;
}
