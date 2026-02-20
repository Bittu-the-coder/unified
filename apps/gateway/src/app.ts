import cors from 'cors';
import express from 'express';
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

app.use(
  '/auth',
  createProxyMiddleware({
    target: env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
  }),
);

app.use(
  '/users',
  createProxyMiddleware({
    target: env.USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/users${path}`,
  }),
);

app.use(
  '/productivity',
  createProxyMiddleware({
    target: env.PRODUCTIVITY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/productivity${path}`,
  }),
);

app.use(
  '/messaging',
  createProxyMiddleware({
    target: env.MESSAGING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/messaging${path}`,
  }),
);

app.use(
  '/file-cloud',
  createProxyMiddleware({
    target: env.FILE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/file-cloud${path}`,
  }),
);
