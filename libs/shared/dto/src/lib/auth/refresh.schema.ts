import { z } from 'zod';

export const refreshSchema = z.object({
  /** Optional when using cookie-based auth (refresh_token cookie is sent automatically) */
  refreshToken: z.string().min(1).optional(),
});

export type RefreshDto = z.infer<typeof refreshSchema>;
