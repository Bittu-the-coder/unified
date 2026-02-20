import mongoose from 'mongoose';
import { logger } from '@unified/shared';
import { app } from './app';
import { env } from './config/env';

const bootstrap = async () => {
  await mongoose.connect(env.MONGODB_URI);
  app.listen(env.PORT, () => {
    logger.info(`file-service listening on ${env.PORT}`);
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, 'file-service failed to start');
  process.exit(1);
});

