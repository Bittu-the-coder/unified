import type { Response } from 'express';
import { UnauthorizedError, verifyAccessToken } from '@unified/shared';

export type AuthenticatedRequest = any & {
  user?: { id: string; email: string; uniqueNumber?: string; username?: string; fullName?: string };
};

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: (err?: unknown) => void) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    throw new UnauthorizedError('Missing access token');
  }

  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.sub,
    email: payload.email,
    uniqueNumber: payload.uniqueNumber,
    username: payload.username,
    fullName: payload.fullName,
  };
  next();
};
