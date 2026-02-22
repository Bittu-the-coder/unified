import type { NextFunction, Request, Response } from 'express';
export type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        email: string;
        uniqueNumber?: string;
        username?: string;
        fullName?: string;
    };
};
export declare const requireAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
