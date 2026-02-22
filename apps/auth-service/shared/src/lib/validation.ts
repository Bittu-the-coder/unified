import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { BadRequestError } from './errors';

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues.map((v) => v.message).join(', '));
    }

    req.body = parsed.data;
    next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues.map((v) => v.message).join(', '));
    }

    req.query = parsed.data as Request['query'];
    next();
  };
