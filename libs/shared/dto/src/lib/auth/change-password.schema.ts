import { z } from 'zod';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6).max(100),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
