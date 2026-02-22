import jwt from 'jsonwebtoken';
import { getSharedConfig } from './config';
import { UnauthorizedError } from './errors';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  uniqueNumber?: string;
  username?: string;
  fullName?: string;
};

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, getSharedConfig().JWT_ACCESS_SECRET, {
    expiresIn: getSharedConfig().ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });

export const signRefreshToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, getSharedConfig().JWT_REFRESH_SECRET, {
    expiresIn: getSharedConfig().REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, getSharedConfig().JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, getSharedConfig().JWT_REFRESH_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
};
