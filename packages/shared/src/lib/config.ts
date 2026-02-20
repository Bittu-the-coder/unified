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

export const sharedConfig = parsed;
