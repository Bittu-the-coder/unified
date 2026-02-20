import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import { errorHandler } from '@unified/shared';
import { env } from './config/env';
import { userRouter } from './routes/user.routes';

export const app = express();

const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((v) => v.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.use('/users', userRouter);
app.use(errorHandler);
