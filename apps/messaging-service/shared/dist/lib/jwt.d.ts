export type AccessTokenPayload = {
    sub: string;
    email: string;
    uniqueNumber?: string;
    username?: string;
    fullName?: string;
};
export declare const signAccessToken: (payload: AccessTokenPayload) => string;
export declare const signRefreshToken: (payload: AccessTokenPayload) => string;
export declare const verifyAccessToken: (token: string) => AccessTokenPayload;
export declare const verifyRefreshToken: (token: string) => AccessTokenPayload;
