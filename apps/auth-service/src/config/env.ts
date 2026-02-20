import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/unified_auth'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3100'),
});

export const env = schema.parse(process.env);
