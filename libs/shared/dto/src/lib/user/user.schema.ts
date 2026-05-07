import { z } from 'zod';

export const userRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
  picture: z.string().url().nullable().optional(),
  role: userRoleSchema.default('user'),
  emailVerified: z.boolean().default(false),
  locale: z.string().default('en-US'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

export const userWithSecretsSchema = userSchema.extend({
  password: z.string().nullable(),
  resetToken: z.string().nullable().optional(),
  verificationToken: z.string().nullable().optional(),
});

export type UserWithSecrets = z.infer<typeof userWithSecretsSchema>;
