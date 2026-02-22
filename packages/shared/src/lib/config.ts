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

export const getSharedConfig = () => {
  const normalizedEnv = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV?.trim(),
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET?.trim(),
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET?.trim(),
    ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL?.trim(),
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL?.trim(),
  };
  const parsed = schema.parse(normalizedEnv);
  if (parsed.NODE_ENV === 'production') {
    if (!process.env.JWT_ACCESS_SECRET || parsed.JWT_ACCESS_SECRET === 'dev_access_secret') {
      throw new Error('shared: JWT_ACCESS_SECRET must be set in production');
    }
    if (!process.env.JWT_REFRESH_SECRET || parsed.JWT_REFRESH_SECRET === 'dev_refresh_secret') {
      throw new Error('shared: JWT_REFRESH_SECRET must be set in production');
    }
  }
  return parsed;
};
