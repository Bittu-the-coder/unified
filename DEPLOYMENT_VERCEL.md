# Unified Deployment and Operations Runbook

Last updated: February 22, 2026

This document is the source of truth for deploying and operating this monorepo on Vercel.

## 1. Current Project Map (Use Only These)

1. `unified-web` -> root `apps/web`
2. `unified-gateway` -> root `apps/gateway`
3. `unified-auth-service` -> root `apps/auth-service`
4. `unified-user-service` -> root `apps/user-service`
5. `unified-productivity-service` -> root `apps/productivity-service`
6. `unified-messaging-service` -> root `apps/messaging-service`
7. `unified-file-service` -> root `apps/file-service`

Do not deploy to old non-`unified-*` projects.

## 2. What Was Fixed

1. Duplicate Vercel projects were removed to avoid deploying to wrong targets.
2. Local app folders were relinked to `unified-*` projects via `.vercel/project.json`.
3. Wrong API target issue from web (`localhost` in production) was fixed by setting `NEXT_PUBLIC_API_BASE`.
4. CORS misalignment was fixed at config level by standardizing `CLIENT_ORIGIN` across services.
5. Gateway aliases were normalized so both old and new URLs point to the same live target.
6. Multiple backend services were redeployed successfully after env correction.

## 3. Errors Seen and Root Cause

1. `ENOENT: /packages/shared/src/index.ts` during deploy
Cause: prebuilt artifact/runtime path mismatch in old deployment flow.
Fix: use current unified project setup and clean rebuild/redeploy sequence.

2. `ERR_CONNECTION_REFUSED` to `http://localhost:3000` from production web
Cause: production web calling local API base.
Fix: set `NEXT_PUBLIC_API_BASE` to production gateway URL.

3. Browser CORS error: no `Access-Control-Allow-Origin` on preflight
Cause: gateway `CLIENT_ORIGIN` did not include active web domain.
Fix: update `CLIENT_ORIGIN` across gateway + services, then redeploy.

4. `500` on auth endpoints
Cause: backend runtime/config issues in previous deployments.
Fix: auth project env and deployment were refreshed; verify with logs if recurring.

5. Vercel deployment cap: `api-deployments-free-per-day`
Cause: free-tier daily deployment limit exceeded.
Fix: wait for quota reset, then continue deploy queue.

6. Vercel CLI auth errors (`auth.json` permission, invalid token)
Cause: CLI auth state mismatch and restricted environment.
Fix: run `vercel login` again on local machine before further deploys.

## 4. Mandatory Environment Standards

Use these values in Production unless explicitly changed.

## 4.0 Deployment Protection (Critical)

For public web + API access, disable Vercel auth protection on production deployments.

In each project:

1. Open `Project Settings -> Deployment Protection`.
2. Set Production protection to public access (disable Vercel Authentication / Password Protection for production).
3. Keep Preview protection enabled if you want private preview builds.

If protection stays enabled on gateway/auth services, browser requests will fail with Vercel `401 Authentication Required` before your app CORS middleware runs.

### 4.1 `unified-web`

1. `NEXT_PUBLIC_API_BASE=https://gateway-three-psi.vercel.app`

### 4.2 `unified-gateway`

1. `NODE_ENV=production`
2. `CLIENT_ORIGIN=https://web-swart-delta-57.vercel.app,https://unified-web-bittu-the-coders-projects.vercel.app,https://web-sooty-mu-55.vercel.app,http://localhost:3100,http://localhost:3000`
3. `AUTH_SERVICE_URL=https://auth-service-delta-beryl.vercel.app`
4. `USER_SERVICE_URL=https://user-service-omega.vercel.app`
5. `PRODUCTIVITY_SERVICE_URL=https://productivity-service.vercel.app`
6. `MESSAGING_SERVICE_URL=https://messaging-service-theta.vercel.app`
7. `FILE_SERVICE_URL=https://file-service-alpha.vercel.app`

### 4.3 Auth/User/Productivity/Messaging/File services

1. `NODE_ENV=production`
2. `MONGODB_URI=<service-db-uri>`
3. `CLIENT_ORIGIN=<same comma-separated list as gateway>`
4. `JWT_ACCESS_SECRET=<shared-secret>`
5. `JWT_REFRESH_SECRET=<shared-secret>`
6. Service-specific provider vars where needed (`file-service` cloud/image vars, etc.)

## 5. Build and Install Command Policy

Important: all backend services contain `vercel.json` with `builds`. Vercel warns that UI Build/Install settings are ignored when `builds` exists.

### 5.1 Current recommended model

1. Keep `vercel.json` in backend services.
2. Do not rely on UI Build Command for backend projects.
3. UI Build/Install changes are mainly relevant for `unified-web`.

### 5.2 If you want centralized UI commands later

1. Remove `builds` block from backend `vercel.json`.
2. Then configure UI commands:
`pnpm -w install --frozen-lockfile`
and per-service build command:
`pnpm -w --filter @unified/shared build && pnpm -w --filter @unified/<service> build`

## 6. Deploy Order (Always Follow)

1. `unified-auth-service`
2. `unified-user-service`
3. `unified-productivity-service`
4. `unified-messaging-service`
5. `unified-file-service`
6. `unified-gateway`
7. `unified-web`

Then validate register/login and one endpoint per module.

## 7. GitHub Integration Checklist (Per Service)

1. Vercel Project -> `Settings` -> `Git`.
2. Connect repo `Bittu-the-coder/unified`.
3. Confirm root directory matches section 1.
4. Confirm Production branch is your main release branch.
5. Trigger one production deploy from Git to verify webhook path.

## 8. Local Commands for Future Development

From repo root:

1. Install all deps
`pnpm install`

2. Start full stack
`pnpm run dev:all`

3. Build all packages/apps
`pnpm run build:all`

4. Type-check all
`pnpm run typecheck:all`

5. Single service dev examples
`pnpm --filter @unified/gateway dev`
`pnpm --filter @unified/auth-service dev`
`pnpm --filter @unified/web dev`

## 9. Adding a New Service (Future)

1. Create `apps/<new-service>` with `package.json`, `tsconfig.json`, `src/index.ts`, `api/index.ts`, `vercel.json`.
2. Add route proxy in `apps/gateway` if service is gateway-exposed.
3. Add `<NEW_SERVICE>_URL` env in `unified-gateway`.
4. Add `CLIENT_ORIGIN`, `NODE_ENV`, JWT/env standards in new service project.
5. Create Vercel project `unified-<new-service>` with correct root.
6. Link locally:
`cd apps/<new-service>`
`vercel link --project unified-<new-service>`
7. Deploy in sequence before gateway/web if dependency exists.

## 10. Final Verification Checklist

1. `https://auth-service-delta-beryl.vercel.app/health`
2. `https://user-service-omega.vercel.app/health`
3. `https://productivity-service.vercel.app/health`
4. `https://messaging-service-theta.vercel.app/health`
5. `https://file-service-alpha.vercel.app/health`
6. `https://gateway-three-psi.vercel.app/health`
7. `https://web-swart-delta-57.vercel.app/register`
8. `https://web-swart-delta-57.vercel.app/login`

## 11. Open Blockers Right Now

1. Vercel CLI token on this machine is currently invalid.
2. Some redeploys are blocked until daily deployment quota resets.

Recovery:

1. Run `vercel login`.
2. Re-run deploy order from section 6.
3. Re-run verification from section 10.
