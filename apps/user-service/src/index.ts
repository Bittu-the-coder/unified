import mongoose from 'mongoose';
import { logger } from '@unified/shared';
import { app } from './app';
import { env } from './config/env';

const bootstrap = async () => {
  await mongoose.connect(env.MONGODB_URI);
  app.listen(env.PORT, () => {
    logger.info(`user-service listening on ${env.PORT}`);
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, 'user-service failed to start');
  process.exit(1);
});
