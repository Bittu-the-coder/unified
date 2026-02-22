"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    JWT_ACCESS_SECRET: zod_1.z.string().default('dev_access_secret'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('dev_refresh_secret'),
    ACCESS_TOKEN_TTL: zod_1.z.string().default('7d'),
    REFRESH_TOKEN_TTL: zod_1.z.string().default('30d'),
});
const getSharedConfig = () => {
    const normalizedEnv = {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV?.trim(),
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET?.trim(),
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET?.trim(),
        ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL?.trim(),
        REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL?.trim(),
    };
    const parsed = schema.parse(normalizedEnv);
    if (parsed.NODE_ENV === 'production') {
        if (!process.env.JWT_ACCESS_SECRET || parsed.JWT_ACCESS_SECRET === 'dev_access_secret') {
            throw new Error('shared: JWT_ACCESS_SECRET must be set in production');
        }
        if (!process.env.JWT_REFRESH_SECRET || parsed.JWT_REFRESH_SECRET === 'dev_refresh_secret') {
            throw new Error('shared: JWT_REFRESH_SECRET must be set in production');
        }
    }
    return parsed;
};
exports.getSharedConfig = getSharedConfig;
