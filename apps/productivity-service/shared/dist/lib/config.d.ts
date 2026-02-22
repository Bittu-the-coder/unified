export declare const getSharedConfig: () => {
    NODE_ENV: "development" | "test" | "production";
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_TTL: string;
    REFRESH_TOKEN_TTL: string;
};
