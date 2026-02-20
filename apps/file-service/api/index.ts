import mongoose from 'mongoose';
import { app } from '../src/app';
import { env } from '../src/config/env';

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;

const ensureMongo = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(env.MONGODB_URI);
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
  await ensureMongo();
  return app(req as never, res as never);
}
