import type { NextFunction, Request, Response } from 'express';
export declare const ok: <T>(res: Response, data: T, message?: string, status?: number) => Response;
export declare const errorHandler: (err: unknown, _req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
