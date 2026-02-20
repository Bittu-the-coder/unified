import { logger } from '@unified/shared';
import { app } from './app';
import { env } from './config';

app.listen(env.PORT, () => {
  logger.info(`gateway listening on ${env.PORT}`);
});
