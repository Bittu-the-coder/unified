# Unified Vercel Deployment (Current Working Setup)

This monorepo must be deployed as 7 separate Vercel projects.

## 1. Create These 7 Vercel Projects

1. `web` -> `apps/web`
2. `gateway` -> `apps/gateway`
3. `auth-service` -> `apps/auth-service`
4. `user-service` -> `apps/user-service`
5. `productivity-service` -> `apps/productivity-service`
6. `messaging-service` -> `apps/messaging-service`
7. `file-service` -> `apps/file-service`

## 2. Critical Vercel UI Settings (Do This First)

For each project:

1. Remove any **Production Overrides** from old deployments.
2. Set **Root Directory** to that app folder (for example `apps/auth-service`).
3. Enable **Include files outside the root directory in the Build Step**.
4. Use **pnpm**.

Framework preset:

1. `web`: `Next.js`
2. all backend services (`gateway/auth/user/productivity/messaging/file`): `Other`

Do not use `Express` framework preset for backend projects.

## 3. Install and Build Commands

Use these exact commands.

Install command (temporary while lockfile is being stabilized):

`pnpm install`

After lockfile is clean and committed, switch install command to:

`pnpm install --frozen-lockfile`

Build commands:

1. `web`:
`pnpm -w --filter @unified/web build`
2. `gateway`:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/gateway build`
3. `auth-service`:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/auth-service build`
4. `user-service`:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/user-service build`
5. `productivity-service`:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/productivity-service build`
6. `messaging-service`:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/messaging-service build`
7. `file-service`:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/file-service build`

Output directory:

1. `web`: `.next`
2. backend services: leave empty

## 4. Required Environment Variables

Set in Vercel project settings, not only local `.env`.

### web

1. `NEXT_PUBLIC_API_BASE=https://<gateway-project>.vercel.app`

### gateway

1. `NODE_ENV=production`
2. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
3. `AUTH_SERVICE_URL=https://<auth-project>.vercel.app`
4. `USER_SERVICE_URL=https://<user-project>.vercel.app`
5. `PRODUCTIVITY_SERVICE_URL=https://<productivity-project>.vercel.app`
6. `MESSAGING_SERVICE_URL=https://<messaging-project>.vercel.app`
7. `FILE_SERVICE_URL=https://<file-project>.vercel.app`

### auth-service

1. `NODE_ENV=production`
2. `MONGODB_URI=<remote-atlas-uri>`
3. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
4. `JWT_ACCESS_SECRET=<strong-secret>`
5. `JWT_REFRESH_SECRET=<strong-secret>`
6. all other auth envs required by `apps/auth-service/.env`

### user-service, productivity-service, messaging-service, file-service

1. `NODE_ENV=production`
2. `MONGODB_URI=<remote-atlas-uri>`
3. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
4. `JWT_ACCESS_SECRET=<same-as-auth>`
5. `JWT_REFRESH_SECRET=<same-as-auth>`
6. each service-specific env from its local `.env`

### file-service provider variables

Set one provider completely:

1. ImageKit:
`IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
2. Cloudinary:
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## 5. Deploy Order

1. Deploy backend services first:
`auth-service`, `user-service`, `productivity-service`, `messaging-service`, `file-service`
2. Deploy `gateway` with final backend URLs
3. Deploy `web` with final gateway URL

## 6. Validation Checklist

1. `https://<auth>/health`
2. `https://<user>/health`
3. `https://<productivity>/health`
4. `https://<messaging>/health`
5. `https://<file>/health`
6. `https://<gateway>/health`
7. Register/login from web

## 7. If Build/Runtime Fails

1. If Vercel says `No entrypoint found`:
backend project is wrongly set to `Express` preset. Change to `Other`.
2. If `Cannot find module '@unified/shared'`:
root directory/build settings are wrong or old production override is still active.
3. If `FUNCTION_INVOCATION_FAILED`:
check missing env vars (`MONGODB_URI`, `CLIENT_ORIGIN`, JWT secrets, gateway service URLs).
4. If web build compiles backend apps:
web project still has wrong build command/override. It should only run `pnpm -w --filter @unified/web build`.
