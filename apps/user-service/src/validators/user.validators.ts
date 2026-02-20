import { z } from 'zod';

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  fullName: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.record(z.any()).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const searchUsersSchema = z.object({
  q: z.string().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
