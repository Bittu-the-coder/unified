import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  fullName: z.string().min(1),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().min(1).optional(),
  deviceName: z.string().min(1).optional(),
  deviceType: z.string().min(1).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8),
});

export const sessionParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const checkAvailabilitySchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  })
  .refine((value) => Boolean(value.email || value.username), {
    message: 'Either email or username is required',
  });
