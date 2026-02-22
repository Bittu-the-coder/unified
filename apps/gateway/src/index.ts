import { logger } from '../shared/dist/index';
import { app } from './app';
import { env } from './config';

app.listen(env.PORT, () => {
  logger.info(`gateway listening on ${env.PORT}`);
});

