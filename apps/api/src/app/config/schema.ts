import { z } from 'zod';

// ─── Custom validators ──────────────────────────────────────────────────────

const ttlString = z
  .string()
  .regex(/^\d+(s|m|h|d)$/, 'Must be a duration like "15m", "1h", "7d"');

const commaSeparatedUrls = z.string().refine(
  (val) =>
    val.split(',').every((url) => {
      try {
        new URL(url.trim());
        return true;
      } catch {
        return false;
      }
    }),
  { message: 'Must be a comma-separated list of valid URLs' },
);

// ─── Schema ─────────────────────────────────────────────────────────────────

export const envSchema = z
  .object({
    // ── App ───────────────────────────────────────────────────────────────
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    GLOBAL_PREFIX: z
      .string()
      .regex(/^[a-z][a-z0-9-]*$/, 'Must be lowercase alphanumeric with dashes')
      .default('api'),
    CORS_ORIGIN: commaSeparatedUrls.default(
      'http://localhost:4200,http://localhost:4300',
    ),

    // ── Cookies (cross-subdomain auth) ────────────────────────────────────
    /** Root domain for cookies. Use ".xyz.com" for production, "localhost" for dev */
    COOKIE_DOMAIN: z
      .string()
      .min(1, 'COOKIE_DOMAIN cannot be empty')
      .default('localhost'),
    /** Set to "true" in production (requires HTTPS) */
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),

    // ── Auth / JWT ────────────────────────────────────────────────────────
    /** Secret for signing access tokens. Min 32 chars in production. */
    ACCESS_TOKEN_SECRET: z.string().min(16),
    ACCESS_TOKEN_TTL: ttlString.default('15m'),
    /** Secret for signing refresh tokens. Min 32 chars in production. Must differ from access secret. */
    REFRESH_TOKEN_SECRET: z.string().min(16),
    REFRESH_TOKEN_TTL: ttlString.default('7d'),

    // ── OAuth: Google ─────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),

    // ── OAuth: GitHub ─────────────────────────────────────────────────────
    GITHUB_CLIENT_ID: z.string().min(1).optional(),
    GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    GITHUB_CALLBACK_URL: z.string().url().optional(),

    // ── OAuth: LinkedIn ───────────────────────────────────────────────────
    LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
    LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
    LINKEDIN_CALLBACK_URL: z.string().url().optional(),

    // ── App URL (for passkey RP ID) ───────────────────────────────────────
    PUBLIC_URL: z.string().url().default('http://localhost:3000'),

    // ── Mail / SMTP ───────────────────────────────────────────────────────
    MAIL_HOST: z.string().min(1).optional(),
    MAIL_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    MAIL_USER: z.string().min(1).optional(),
    MAIL_PASSWORD: z.string().min(1).optional(),
    MAIL_FROM: z
      .string()
      .email('MAIL_FROM must be a valid email address')
      .optional(),

    // ── Database ──────────────────────────────────────────────────────────
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL must be set')
      .default('file:./tools/prisma/dev.db'),

    // ── Logging ───────────────────────────────────────────────────────────
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .superRefine((data, ctx) => {
    // In production, secrets must be strong and different
    if (data.NODE_ENV === 'production') {
      if (data.ACCESS_TOKEN_SECRET.length < 32) {
        ctx.addIssue(
          'ACCESS_TOKEN_SECRET must be at least 32 characters in production',
        );
      }
      if (data.REFRESH_TOKEN_SECRET.length < 32) {
        ctx.addIssue(
          'REFRESH_TOKEN_SECRET must be at least 32 characters in production',
        );
      }
      if (data.ACCESS_TOKEN_SECRET === data.REFRESH_TOKEN_SECRET) {
        ctx.addIssue(
          'REFRESH_TOKEN_SECRET must differ from ACCESS_TOKEN_SECRET',
        );
      }
      if (!data.COOKIE_SECURE) {
        ctx.addIssue('COOKIE_SECURE must be "true" in production');
      }
    }

    // If any Google OAuth field is set, all must be set
    const googleFields = [
      data.GOOGLE_CLIENT_ID,
      data.GOOGLE_CLIENT_SECRET,
      data.GOOGLE_CALLBACK_URL,
    ];
    const googleSet = googleFields.filter(Boolean).length;
    if (googleSet > 0 && googleSet < 3) {
      ctx.addIssue(
        'All Google OAuth fields (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL) must be set together',
      );
    }

    // If any GitHub OAuth field is set, all must be set
    const githubFields = [
      data.GITHUB_CLIENT_ID,
      data.GITHUB_CLIENT_SECRET,
      data.GITHUB_CALLBACK_URL,
    ];
    const githubSet = githubFields.filter(Boolean).length;
    if (githubSet > 0 && githubSet < 3) {
      ctx.addIssue(
        'All GitHub OAuth fields (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL) must be set together',
      );
    }

    // If any LinkedIn OAuth field is set, all must be set
    const linkedinFields = [
      data.LINKEDIN_CLIENT_ID,
      data.LINKEDIN_CLIENT_SECRET,
      data.LINKEDIN_CALLBACK_URL,
    ];
    const linkedinSet = linkedinFields.filter(Boolean).length;
    if (linkedinSet > 0 && linkedinSet < 3) {
      ctx.addIssue(
        'All LinkedIn OAuth fields (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_CALLBACK_URL) must be set together',
      );
    }

    // If any mail field is set, require the minimum set for sending
    const mailFields = [data.MAIL_HOST, data.MAIL_PORT, data.MAIL_FROM];
    const mailSet = mailFields.filter(Boolean).length;
    if (mailSet > 0 && mailSet < 3) {
      ctx.addIssue(
        'MAIL_HOST, MAIL_PORT, and MAIL_FROM must all be set if any mail config is provided',
      );
    }
  });

export type AppConfig = z.infer<typeof envSchema>;

export const validateEnv = (env: Record<string, unknown>): AppConfig => {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `\n❌ Invalid environment configuration:\n${message}\n\nSee .env.example for reference.\n`,
    );
  }
  return parsed.data;
};
