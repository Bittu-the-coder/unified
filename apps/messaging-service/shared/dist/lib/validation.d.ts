import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
export declare const validateBody: <T>(schema: ZodSchema<T>) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateQuery: <T>(schema: ZodSchema<T>) => (req: Request, _res: Response, next: NextFunction) => void;
