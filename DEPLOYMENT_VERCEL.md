# Unified Vercel Deployment Runbook (Step-by-Step)

Use this as the single source of truth. Follow in order.

## 0. Recovery First (Recommended Right Now)

If deployments are currently broken, do this once:

1. In each Vercel project, open `Settings -> Build and Development Settings`.
2. Remove any `Production Override` values.
3. Re-save all settings from this document.
4. Redeploy each project (do not rely on old deployments).

## 1. Projects and Root Directories

Create/use these 7 Vercel projects from the same repo:

1. `web` -> Root Directory: `apps/web`
2. `gateway` -> Root Directory: `apps/gateway`
3. `auth-service` -> Root Directory: `apps/auth-service`
4. `user-service` -> Root Directory: `apps/user-service`
5. `productivity-service` -> Root Directory: `apps/productivity-service`
6. `messaging-service` -> Root Directory: `apps/messaging-service`
7. `file-service` -> Root Directory: `apps/file-service`

For all 7 projects, enable:

1. `Include files outside the root directory in the Build Step`

## 2. Framework Preset (Very Important)

1. `web`: `Next.js`
2. `gateway`: `Other`
3. `auth-service`: `Other`
4. `user-service`: `Other`
5. `productivity-service`: `Other`
6. `messaging-service`: `Other`
7. `file-service`: `Other`

Do not use `Express` preset for backend projects.

## 3. Install and Build Commands

### Temporary install command (until lockfile is regenerated and committed)

Use this in all 7 projects:

`pnpm -w install --no-frozen-lockfile`

### Final install command (after lockfile is clean)

`pnpm -w install --frozen-lockfile`

### Build commands per project

1. `web`
`pnpm -w --filter @unified/web build`

2. `gateway`
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/gateway build`

3. `auth-service`
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/auth-service build`

4. `user-service`
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/user-service build`

5. `productivity-service`
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/productivity-service build`

6. `messaging-service`
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/messaging-service build`

7. `file-service`
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/file-service build`

### Output Directory

1. `web`: `.next`
2. backend projects: empty

## 4. Environment Variables

Set all of these in Vercel project settings (Production + Preview as needed).

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
6. all additional auth envs from `apps/auth-service/.env`

### user-service

1. `NODE_ENV=production`
2. `MONGODB_URI=<remote-atlas-uri>`
3. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
4. `JWT_ACCESS_SECRET=<same-as-auth>`
5. `JWT_REFRESH_SECRET=<same-as-auth>`
6. any extra env from `apps/user-service/.env`

### productivity-service

1. `NODE_ENV=production`
2. `MONGODB_URI=<remote-atlas-uri>`
3. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
4. `JWT_ACCESS_SECRET=<same-as-auth>`
5. `JWT_REFRESH_SECRET=<same-as-auth>`
6. any extra env from `apps/productivity-service/.env`

### messaging-service

1. `NODE_ENV=production`
2. `MONGODB_URI=<remote-atlas-uri>`
3. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
4. `JWT_ACCESS_SECRET=<same-as-auth>`
5. `JWT_REFRESH_SECRET=<same-as-auth>`
6. any extra env from `apps/messaging-service/.env`

### file-service

1. `NODE_ENV=production`
2. `MONGODB_URI=<remote-atlas-uri>`
3. `CLIENT_ORIGIN=https://<web-project>.vercel.app`
4. `JWT_ACCESS_SECRET=<same-as-auth>`
5. `JWT_REFRESH_SECRET=<same-as-auth>`
6. any extra env from `apps/file-service/.env`
7. provider envs for one full provider set:
`IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
or
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## 5. Deploy Sequence

Deploy in this exact order:

1. `auth-service`
2. `user-service`
3. `productivity-service`
4. `messaging-service`
5. `file-service`
6. `gateway` (after setting backend URLs from steps 1-5)
7. `web` (after setting `NEXT_PUBLIC_API_BASE` to gateway URL)

## 6. Validation Steps

After deployments:

1. Open `https://<auth-service>/health`
2. Open `https://<user-service>/health`
3. Open `https://<productivity-service>/health`
4. Open `https://<messaging-service>/health`
5. Open `https://<file-service>/health`
6. Open `https://<gateway>/health`
7. Test register/login from web
8. Test one call per module through gateway

## 7. Lockfile Stabilization (Mandatory)

When local machine is ready:

1. Run `pnpm install`
2. Commit `pnpm-lock.yaml`
3. Push
4. Change install command in all projects from `--no-frozen-lockfile` to `--frozen-lockfile`
5. Redeploy all projects

## 8. Error -> Fix Mapping

1. `ERR_PNPM_OUTDATED_LOCKFILE`
Set install command to `pnpm -w install --no-frozen-lockfile` temporarily.

2. `Cannot find module '@unified/shared'`
Root directory or include-outside-root setting is wrong, or stale project override is active.

3. `No entrypoint found`
Backend project framework preset is wrong (must be `Other`).

4. `FUNCTION_INVOCATION_FAILED`
Service boot failed due to missing env variables or invalid production values.

5. Web build trying to compile backend apps
Web build command is wrong or overridden; must be only:
`pnpm -w --filter @unified/web build`

6. Build command not respected / strange parsing
Make sure commands use normal hyphen `-` not long dash `—`.
If project shell has issues with chaining, use:
`cmd /c "pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/auth-service build"`

## 9. Notes

1. Keep Node.js version consistent across all projects.
2. Do not copy local `.env` files directly; set values in each Vercel project.
3. Re-deploy after every settings change; old deployment behavior does not auto-fix.
