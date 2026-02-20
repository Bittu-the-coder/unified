# Unified Vercel Deployment

This repo should be deployed as multiple Vercel projects (one project per app).

## 1. Projects to Create in Vercel

Create 7 Vercel projects from the same repo:

- `apps/web`
- `apps/gateway`
- `apps/auth-service`
- `apps/user-service`
- `apps/productivity-service`
- `apps/messaging-service`
- `apps/file-service`

Each backend app already includes:

- `api/index.ts` (Vercel serverless handler)
- `vercel.json` (route-all to the handler)

## 2. Build/Install Settings (for each project)

- Install Command: `pnpm install --frozen-lockfile`
- Root Directory (all projects): repo root (`.`)
- Build Command:
  - Web: `pnpm --filter @unified/web build`
  - Gateway: `pnpm --filter @unified/shared build && pnpm --filter @unified/gateway build`
  - Auth: `pnpm --filter @unified/shared build && pnpm --filter @unified/auth-service build`
  - User: `pnpm --filter @unified/shared build && pnpm --filter @unified/user-service build`
  - Productivity: `pnpm --filter @unified/shared build && pnpm --filter @unified/productivity-service build`
  - Messaging: `pnpm --filter @unified/shared build && pnpm --filter @unified/messaging-service build`
  - File: `pnpm --filter @unified/shared build && pnpm --filter @unified/file-service build`
- Output Directory:
  - Web: `.next`
  - Backends: leave empty (Vercel serverless function from `api/index.ts`)

## 3. Environment Variables

### Web (`apps/web`)

- `NEXT_PUBLIC_API_BASE=https://<gateway-project>.vercel.app`

### Gateway (`apps/gateway`)

- `NODE_ENV=production`
- `CLIENT_ORIGIN=https://<web-project>.vercel.app`
- `AUTH_SERVICE_URL=https://<auth-project>.vercel.app`
- `USER_SERVICE_URL=https://<user-project>.vercel.app`
- `PRODUCTIVITY_SERVICE_URL=https://<productivity-project>.vercel.app`
- `MESSAGING_SERVICE_URL=https://<messaging-project>.vercel.app`
- `FILE_SERVICE_URL=https://<file-project>.vercel.app`

### Auth Service (`apps/auth-service`)

- `NODE_ENV=production`
- `MONGODB_URI=<atlas-uri>`
- `CLIENT_ORIGIN=https://<web-project>.vercel.app`
- `JWT_ACCESS_SECRET=<strong-secret>`
- `JWT_REFRESH_SECRET=<strong-secret>`
- Other auth envs used in your local `.env`

### User/Productivity/Messaging/File Services

For each of these services:

- `NODE_ENV=production`
- `MONGODB_URI=<atlas-uri>`
- `CLIENT_ORIGIN=https://<web-project>.vercel.app`
- `JWT_ACCESS_SECRET=<same value as auth-service>`
- `JWT_REFRESH_SECRET=<same value as auth-service>`
- Any service-specific envs from local `.env` (ImageKit/Cloudinary etc. for file-service)

### File Service Provider Vars (`apps/file-service`)

Set at least one provider correctly:

- ImageKit:
  - `IMAGEKIT_PUBLIC_KEY`
  - `IMAGEKIT_PRIVATE_KEY`
  - `IMAGEKIT_URL_ENDPOINT`
- Cloudinary:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

## 4. Deploy Order

1. Deploy `auth-service`, `user-service`, `productivity-service`, `messaging-service`, `file-service`
2. Deploy `gateway` with their final URLs
3. Deploy `web` with final gateway URL

## 5. Post-Deploy Validation

- Open `https://<gateway>/health`
- Open `https://<auth>/health`, `https://<user>/health`, `https://<productivity>/health`, `https://<messaging>/health`, `https://<file>/health`
- Open web app and verify:
  - login/register
  - dashboard module navigation
  - file upload/delete
  - nested folder navigation refresh persistence

## 6. If You See `FUNCTION_INVOCATION_FAILED`

- Check each failed project logs in Vercel.
- Most common cause in this repo:
  - `MONGODB_URI` missing (service falls back to localhost in dev only, not valid for Vercel)
  - missing JWT secrets on non-auth services
  - gateway URLs still pointing to localhost
- Re-deploy after updating envs.
