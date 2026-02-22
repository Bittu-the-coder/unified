import { z } from 'zod';

const trimmedString = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string(),
);

const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().optional(),
);

const schema = z.object({
  PORT: z.coerce.number().default(3008),
  MONGODB_URI: trimmedString.default('mongodb://localhost:27017/unified_files'),
  CLIENT_ORIGIN: trimmedString.default('http://localhost:3100'),
  FREE_STORAGE_BYTES: z.coerce.number().int().positive().default(250 * 1024 * 1024),
  DEFAULT_STORAGE_PROVIDER: z
    .preprocess((value) => (typeof value === 'string' ? value.trim() : value), z.enum(['imagekit', 'cloudinary']))
    .default('imagekit'),
  IMAGEKIT_PUBLIC_KEY: optionalTrimmedString,
  IMAGEKIT_PRIVATE_KEY: optionalTrimmedString,
  IMAGEKIT_URL_ENDPOINT: optionalTrimmedString,
  CLOUDINARY_CLOUD_NAME: optionalTrimmedString,
  CLOUDINARY_API_KEY: optionalTrimmedString,
  CLOUDINARY_API_SECRET: optionalTrimmedString,
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
