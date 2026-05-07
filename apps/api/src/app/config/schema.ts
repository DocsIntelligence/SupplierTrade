import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  GLOBAL_PREFIX: z.string().default('api'),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),

  ACCESS_TOKEN_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16)
    .default('dev-refresh-secret-change-me'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

export const validateEnv = (env: Record<string, unknown>): AppConfig => {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${message}`);
  }
  return parsed.data;
};
