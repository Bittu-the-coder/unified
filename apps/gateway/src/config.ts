import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  CLIENT_ORIGIN: z.string().default('http://localhost:3100'),
  AUTH_SERVICE_URL: z.string().default('http://localhost:3001'),
  USER_SERVICE_URL: z.string().default('http://localhost:3002'),
  PRODUCTIVITY_SERVICE_URL: z.string().default('http://localhost:3006'),
  MESSAGING_SERVICE_URL: z.string().default('http://localhost:3007'),
});

export const env = schema.parse(process.env);
