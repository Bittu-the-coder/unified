import mongoose from 'mongoose';
import { logger } from '@unified/shared';

export const connectDb = async (uri: string): Promise<void> => {
  await mongoose.connect(uri);
  logger.info(`Mongo connected: ${uri}`);
};
