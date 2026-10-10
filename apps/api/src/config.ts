import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default('info'),
  /** postgres://… → node-postgres; pglite:<dir> → persistent PGlite; unset/memory → in-memory PGlite */
  DATABASE_URL: z.string().optional(),
  /** redis://… → ioredis quota/cache store; unset → in-memory store */
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  /** base64 32 bytes */
  BIRTH_ENC_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  /** apply drizzle/rls.sql after migrations when the driver is pg (default: true) */
  APPLY_RLS: z
    .string()
    .optional()
    .transform((v) => v === undefined || v === 'true' || v === '1'),
  GUEST_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(180),
  FREE_FIRST_READING: z
    .string()
    .optional()
    .transform((v) => v === undefined || v === 'true' || v === '1'),
  /** AI composer: requires ANTHROPIC_API_KEY; when disabled, readings fall back to atom templates */
  AI_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === undefined || v === 'true' || v === '1'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_READING: z.string().default('claude-opus-5-5'),
  AI_MODEL_DAILY: z.string().default('claude-haiku-5-5'),
  /** per-user daily AI budget guard (USD) */
  AI_USER_DAILY_BUDGET_USD: z.coerce.number().positive().default(0.5),
  /** shared secret for /v1/admin/* (X-Admin-Token). Unset → admin routes return 503. */
  ADMIN_TOKEN: z.string().min(12).optional(),
  /** run the Daily Oracle generator hourly inside the API process (single-instance deployments) */
  DAILY_JOB_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  /** Expo push endpoint; unset → push jobs log only */
  EXPO_PUSH_URL: z.string().default('https://exp.host/--/api/v2/push/send'),
  /** Stripe (web checkout). Prices: JSON map product → price id, e.g. {"plus_monthly":"price_…","credits_5":"price_…"} */
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PRICES: z.string().optional(),
  WEB_BASE_URL: z.string().default('http://localhost:3000'),
  PUSH_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});

export type Env = z.infer<typeof EnvSchema>;

export interface AppConfig extends Env {
  jwtSecret: string;
  birthEncKey: Buffer;
  /** Values that had to be generated because the env did not provide them (dev only). */
  generated: string[];
}

export function loadConfig(overrides: Partial<Record<keyof Env, string | undefined>> = {}): AppConfig {
  const env = EnvSchema.parse({ ...process.env, ...overrides });
  const generated: string[] = [];

  let jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
    jwtSecret = randomBytes(32).toString('base64');
    generated.push('JWT_SECRET');
  }

  let birthEncKey: Buffer;
  if (env.BIRTH_ENC_KEY) {
    birthEncKey = Buffer.from(env.BIRTH_ENC_KEY, 'base64');
    if (birthEncKey.length !== 32) throw new Error('BIRTH_ENC_KEY must be base64 of exactly 32 bytes');
  } else {
    if (env.NODE_ENV === 'production') throw new Error('BIRTH_ENC_KEY is required in production');
    birthEncKey = randomBytes(32);
    generated.push('BIRTH_ENC_KEY');
  }

  return { ...env, jwtSecret, birthEncKey, generated };
}
