import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from './config';

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

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'gateway' });
});

const buildProxy = (target: string, prefix: string) =>
  // Cast for compatibility with differing http-proxy-middleware type packages across environments.
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path: string) => `${prefix}${path}`,
  } as any);

app.use(
  '/auth',
  buildProxy(env.AUTH_SERVICE_URL, '/auth'),
);

app.use(
  '/users',
  buildProxy(env.USER_SERVICE_URL, '/users'),
);

app.use(
  '/productivity',
  buildProxy(env.PRODUCTIVITY_SERVICE_URL, '/productivity'),
);

app.use(
  '/messaging',
  buildProxy(env.MESSAGING_SERVICE_URL, '/messaging'),
);

app.use(
  '/file-cloud',
  buildProxy(env.FILE_SERVICE_URL, '/file-cloud'),
);
