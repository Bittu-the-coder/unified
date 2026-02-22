import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from './errors';
import { verifyAccessToken } from './jwt';

export type AuthenticatedRequest = Request & {
  user?: { id: string; email: string; uniqueNumber?: string; username?: string; fullName?: string };
};

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
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
