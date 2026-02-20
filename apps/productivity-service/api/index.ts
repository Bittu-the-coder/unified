import mongoose from 'mongoose';
import { app } from '../src/app';
import { env } from '../src/config/env';

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;
const appHandler = app as unknown as (req: unknown, res: unknown) => unknown;
const mongoUri = env.MONGODB_URI;

const ensureMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(mongoUri);
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
    console.error('[productivity-service] serverless bootstrap failed', error);
    const typedRes = res as { headersSent?: boolean; status: (code: number) => { json: (body: unknown) => void } };
    if (!typedRes.headersSent) {
      typedRes.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Server bootstrap failed',
        },
      });
    }
  }
}
