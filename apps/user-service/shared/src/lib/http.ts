import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors';
import { logger } from './logger';

export const ok = <T>(res: Response, data: T, message = 'OK', status = 200): Response => {
  return res.status(status).json({ success: true, message, data });
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
};
