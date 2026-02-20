import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3007),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/unified_messaging'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3100'),
});

const parsed = schema.parse(process.env);

if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI || parsed.MONGODB_URI.includes('localhost')) {
    throw new Error('messaging-service: MONGODB_URI must be set to a remote database in production');
  }
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error('messaging-service: CLIENT_ORIGIN is required in production');
  }
}

export const env = parsed;
