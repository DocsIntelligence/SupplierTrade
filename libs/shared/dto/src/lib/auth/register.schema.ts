import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(6).max(100),
  locale: z.string().default('en-US').optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
