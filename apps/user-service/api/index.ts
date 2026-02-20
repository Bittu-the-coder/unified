import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;
let appHandler: ((req: unknown, res: unknown) => unknown) | null = null;
let mongoUri: string | null = null;

const ensureMongo = async () => {
  if (!appHandler || !mongoUri) {
    const [{ app }, { env }] = await Promise.all([import('../src/app'), import('../src/config/env')]);
    appHandler = app as unknown as (req: unknown, res: unknown) => unknown;
    mongoUri = env.MONGODB_URI;
  }
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
  }
  await mongoConnectionPromise;
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await ensureMongo();
    return appHandler?.(req as never, res as never);
  } catch (error) {
    console.error('[user-service] serverless bootstrap failed', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Server bootstrap failed',
        },
      });
    }
  }
}
