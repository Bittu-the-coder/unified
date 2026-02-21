"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const mongoose_1 = __importDefault(require("mongoose"));
let mongoConnectionPromise = null;
let appHandler = null;
let mongoUri = null;
const ensureBootstrap = () => {
    if (appHandler && mongoUri)
        return;
    if (process.env.NODE_ENV === 'production') {
        const rawMongoUri = process.env.MONGODB_URI;
        const rawClientOrigin = process.env.CLIENT_ORIGIN;
        if (!rawMongoUri || rawMongoUri.includes('localhost')) {
            throw new Error('file-service: set MONGODB_URI to a remote DB in Production env vars');
        }
        if (!rawClientOrigin) {
            throw new Error('file-service: set CLIENT_ORIGIN in Production env vars');
        }
    }
    // Lazy-require to avoid module-load crash when env vars are not set
    const appModule = require('../src/app');
    const envModule = require('../src/config/env');
    appHandler = appModule.app;
    mongoUri = envModule.env.MONGODB_URI;
};
const ensureMongo = async () => {
    ensureBootstrap();
    if (mongoose_1.default.connection.readyState === 1)
        return;
    if (!mongoConnectionPromise) {
        mongoConnectionPromise = mongoose_1.default.connect(mongoUri);
    }
    await mongoConnectionPromise;
};
exports.config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
async function handler(req, res) {
    try {
        await ensureMongo();
        return appHandler?.(req, res);
    }
    catch (error) {
        console.error('[file-service] serverless bootstrap failed', error);
        const body = JSON.stringify({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Server bootstrap failed',
            },
        });
        const typedRes = res;
        if (typedRes.headersSent)
            return;
        if (typeof typedRes.status === 'function') {
            typedRes.status(500).json(JSON.parse(body));
            return;
        }
        if (typeof typedRes.setHeader === 'function') {
            typedRes.setHeader('content-type', 'application/json; charset=utf-8');
        }
        typedRes.statusCode = 500;
        if (typeof typedRes.end === 'function') {
            typedRes.end(body);
        }
    }
}
