import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  MONGODB_URI: z
    .string()
    .url()
    .default('mongodb://localhost:27017/app'),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  // CORS
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});

// eslint-disable-next-line no-process-env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  process.stderr.write(
    `❌ Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}\n`,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
