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

- Install Command: `pnpm install`
- Build Command:
  - Web: `pnpm --filter @unified/web build`
  - Gateway: `pnpm --filter @unified/shared build && pnpm --filter @unified/gateway build`
  - Auth: `pnpm --filter @unified/shared build && pnpm --filter @unified/auth-service build`
  - User: `pnpm --filter @unified/shared build && pnpm --filter @unified/user-service build`
  - Productivity: `pnpm --filter @unified/shared build && pnpm --filter @unified/productivity-service build`
  - Messaging: `pnpm --filter @unified/shared build && pnpm --filter @unified/messaging-service build`
  - File: `pnpm --filter @unified/shared build && pnpm --filter @unified/file-service build`

## 3. Environment Variables

### Web (`apps/web`)

- `NEXT_PUBLIC_API_BASE=https://<gateway-project>.vercel.app`

### Gateway (`apps/gateway`)

- `CLIENT_ORIGIN=https://<web-project>.vercel.app`
- `AUTH_SERVICE_URL=https://<auth-project>.vercel.app`
- `USER_SERVICE_URL=https://<user-project>.vercel.app`
- `PRODUCTIVITY_SERVICE_URL=https://<productivity-project>.vercel.app`
- `MESSAGING_SERVICE_URL=https://<messaging-project>.vercel.app`
- `FILE_SERVICE_URL=https://<file-project>.vercel.app`

### Auth Service (`apps/auth-service`)

- `MONGODB_URI=<atlas-uri>`
- `CLIENT_ORIGIN=https://<web-project>.vercel.app`
- `JWT_ACCESS_SECRET=<strong-secret>`
- `JWT_REFRESH_SECRET=<strong-secret>`
- Other auth envs used in your local `.env`

### User/Productivity/Messaging/File Services

For each of these services:

- `MONGODB_URI=<atlas-uri>`
- `CLIENT_ORIGIN=https://<web-project>.vercel.app`
- Any service-specific envs from local `.env` (ImageKit/Cloudinary etc. for file-service)

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
