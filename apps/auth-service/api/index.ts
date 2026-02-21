import mongoose from 'mongoose';

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;
let appHandler: ((req: unknown, res: unknown) => unknown) | null = null;
let mongoUri: string | null = null;

const ensureAppBootstrap = () => {
  if (appHandler && mongoUri) {
    return;
  }
  const appModule = require('../src/app') as { app: unknown };
  const envModule = require('../src/config/env') as { env: { MONGODB_URI: string } };
  appHandler = appModule.app as (req: unknown, res: unknown) => unknown;
  mongoUri = envModule.env.MONGODB_URI;
};

const ensureMongo = async () => {
  ensureAppBootstrap();

  if (process.env.NODE_ENV === 'production') {
    const rawMongoUri = process.env.MONGODB_URI;
    const rawClientOrigin = process.env.CLIENT_ORIGIN;
    if (!rawMongoUri || rawMongoUri.includes('localhost')) {
      throw new Error('auth-service runtime config error: set MONGODB_URI to a remote DB in Production env vars');
    }
    if (!rawClientOrigin) {
      throw new Error('auth-service runtime config error: set CLIENT_ORIGIN in Production env vars');
    }
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(mongoUri!);
  }
  await mongoConnectionPromise;
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: unknown, res: unknown) {
  try {
    await ensureMongo();
    return appHandler?.(req as never, res as never);
  } catch (error) {
    console.error('[auth-service] serverless bootstrap failed', error);
    const body = JSON.stringify({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Server bootstrap failed',
      },
    });
    const typedRes = res as {
      headersSent?: boolean;
      status?: (code: number) => { json: (payload: unknown) => void };
      setHeader?: (name: string, value: string) => void;
      end?: (chunk?: string) => void;
      statusCode?: number;
    };
    if (typedRes.headersSent) {
      return;
    }
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
