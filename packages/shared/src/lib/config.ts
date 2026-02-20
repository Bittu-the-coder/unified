import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  JWT_ACCESS_SECRET: z.string().default('dev_access_secret'),
  JWT_REFRESH_SECRET: z.string().default('dev_refresh_secret'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
});

const parsed = schema.parse(process.env);

if (parsed.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || parsed.JWT_ACCESS_SECRET === 'dev_access_secret') {
    throw new Error('shared: JWT_ACCESS_SECRET must be set in production');
  }
  if (!process.env.JWT_REFRESH_SECRET || parsed.JWT_REFRESH_SECRET === 'dev_refresh_secret') {
    throw new Error('shared: JWT_REFRESH_SECRET must be set in production');
  }
}

export const sharedConfig = parsed;
