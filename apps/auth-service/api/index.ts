import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';
import { app } from '../src/app';
import { env } from '../src/config/env';

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;

const ensureMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(env.MONGODB_URI, {
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
    return app(req as never, res as never);
  } catch (error) {
    console.error('[auth-service] serverless bootstrap failed', error);
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
