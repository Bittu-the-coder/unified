import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  CLIENT_ORIGIN: z.string().default('http://localhost:3100'),
  AUTH_SERVICE_URL: z.string().default('http://localhost:3001'),
  USER_SERVICE_URL: z.string().default('http://localhost:3002'),
  PRODUCTIVITY_SERVICE_URL: z.string().default('http://localhost:3006'),
  MESSAGING_SERVICE_URL: z.string().default('http://localhost:3007'),
  FILE_SERVICE_URL: z.string().default('http://localhost:3008'),
});

const parsed = schema.parse(process.env);

if (process.env.NODE_ENV === 'production') {
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error('gateway: CLIENT_ORIGIN is required in production');
  }
  const requiredUrls = [
    'AUTH_SERVICE_URL',
    'USER_SERVICE_URL',
    'PRODUCTIVITY_SERVICE_URL',
    'MESSAGING_SERVICE_URL',
    'FILE_SERVICE_URL',
  ] as const;
  for (const key of requiredUrls) {
    const value = process.env[key];
    if (!value || value.includes('localhost')) {
      throw new Error(`gateway: ${key} must be set to deployed service URL in production`);
    }
  }
}

export const env = parsed;
