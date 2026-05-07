import { z } from 'zod';
import { userSchema } from './user.schema.js';

export const updateUserSchema = userSchema
  .pick({ name: true, username: true, picture: true, locale: true })
  .partial();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
