import { z } from 'zod';

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string().or(z.array(z.string())),
  path: z.string().optional(),
  timestamp: z.string().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
