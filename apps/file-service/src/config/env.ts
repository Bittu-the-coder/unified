import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3008),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/unified_files'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3100'),
  FREE_STORAGE_BYTES: z.coerce.number().int().positive().default(250 * 1024 * 1024),
  DEFAULT_STORAGE_PROVIDER: z.enum(['imagekit', 'cloudinary']).default('imagekit'),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = schema.parse(process.env);

if (process.env.NODE_ENV === 'production') {
  if (!process.env.MONGODB_URI || parsed.MONGODB_URI.includes('localhost')) {
    throw new Error('file-service: MONGODB_URI must be set to a remote database in production');
  }
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error('file-service: CLIENT_ORIGIN is required in production');
  }
}

export const env = parsed;
