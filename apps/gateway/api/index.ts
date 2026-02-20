import { app } from '../src/app';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: unknown, res: unknown) {
  return app(req as never, res as never);
}
