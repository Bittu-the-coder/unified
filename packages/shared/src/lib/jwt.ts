import jwt from 'jsonwebtoken';
import { sharedConfig } from './config';
import { UnauthorizedError } from './errors';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  uniqueNumber?: string;
  username?: string;
  fullName?: string;
};

const accessTokenTtl = sharedConfig.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'];
const refreshTokenTtl = sharedConfig.REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'];

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, sharedConfig.JWT_ACCESS_SECRET, {
    expiresIn: accessTokenTtl,
  });

export const signRefreshToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, sharedConfig.JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenTtl,
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, sharedConfig.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, sharedConfig.JWT_REFRESH_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
};
