# Unified Monorepo

Comprehensive guide for development, Vercel GUI deployment, and production reconfiguration.

## 1. Overview

This repo contains a full-stack multi-service product:

1. `unified-web` (Next.js frontend)
2. `unified-gateway` (API gateway)
3. `unified-auth-service`
4. `unified-user-service`
5. `unified-productivity-service`
6. `unified-messaging-service`
7. `unified-file-service`
8. `packages/shared` (shared auth/errors/config/utils)

## 2. Canonical Production Setup

Use only `unified-*` Vercel projects. Do not deploy to old duplicate project names.

### Active public URLs

1. Web: `https://web-swart-delta-57.vercel.app`
2. Gateway: `https://gateway-dun-chi.vercel.app`
3. Auth: `https://auth-service-delta-beryl.vercel.app`
4. User: `https://user-service-omega.vercel.app`
5. Productivity: `https://productivity-service.vercel.app`
6. Messaging: `https://messaging-service-theta.vercel.app`
7. File: `https://file-service-alpha.vercel.app`

### Important

1. Frontend API base must target gateway domain above.
2. Gateway and services must share compatible JWT secrets.
3. Production deployment protection must not block public API/browser traffic.

## 3. Documentation Map

For day-to-day operations, use these documents:

1. Main runbook: `DEPLOYMENT_VERCEL.md`
2. Environment matrix: `docs/env-matrix.md`
3. Domains and aliases: `docs/domains-aliases.md`
4. Release checklist: `docs/release-checklist.md`
5. New service onboarding: `docs/new-service-playbook.md`

## 4. Local Development

From repo root:

1. Install dependencies
```bash
pnpm install
```

2. Run full stack in dev
```bash
pnpm run dev:all
```

3. Build all apps/packages
```bash
pnpm run build:all
```

4. Type-check all
```bash
pnpm run typecheck:all
```

### Useful targeted commands

```bash
pnpm --filter @unified/web dev
pnpm --filter @unified/gateway dev
pnpm --filter @unified/auth-service dev
```

## 5. GUI-First Vercel Configuration (Step-by-Step)

Use this for fresh setup or reconfiguration without CLI.

### 5.1 Create/Verify Projects

In Vercel Dashboard, ensure these projects exist and point to this repo:

1. `unified-web` -> root `apps/web`
2. `unified-gateway` -> root `apps/gateway`
3. `unified-auth-service` -> root `apps/auth-service`
4. `unified-user-service` -> root `apps/user-service`
5. `unified-productivity-service` -> root `apps/productivity-service`
6. `unified-messaging-service` -> root `apps/messaging-service`
7. `unified-file-service` -> root `apps/file-service`

### 5.2 Framework Presets

1. `unified-web`: `Next.js`
2. All backend services: `Other`

### 5.3 Git Integration (GUI)

For each project:

1. `Settings -> Git`
2. Connect `Bittu-the-coder/unified`
3. Confirm Production Branch
4. Confirm Root Directory

### 5.4 Deployment Protection (Critical)

For public web/API behavior:

1. Open each project `Settings -> Deployment Protection`
2. Disable production auth/password protection for web/gateway/services that browsers call
3. Keep preview protection enabled if needed

If protection is enabled on APIs, browser will show CORS-like failures caused by platform `401` before your app runs.

### 5.5 Environment Variables (GUI)

Set values by service using `docs/env-matrix.md`.

Minimum critical values:

1. `unified-web`: `NEXT_PUBLIC_API_BASE=https://gateway-dun-chi.vercel.app`
2. `unified-gateway`: all service URLs + `CLIENT_ORIGIN`
3. All backend services:
`NODE_ENV=production`
`MONGODB_URI=<remote>`
`CLIENT_ORIGIN=<same as gateway>`
`JWT_ACCESS_SECRET=<shared>`
`JWT_REFRESH_SECRET=<shared>`

For `unified-file-service`, also configure storage provider variables.

## 6. GUI Redeployment Procedure (When You Change Config)

When env, domain, or routing changes are made in GUI:

1. Deploy `unified-auth-service`
2. Deploy `unified-user-service`
3. Deploy `unified-productivity-service`
4. Deploy `unified-messaging-service`
5. Deploy `unified-file-service`
6. Deploy `unified-gateway`
7. Deploy `unified-web`

Reason: gateway depends on downstream service URLs, and web depends on gateway URL.

## 7. Post-Deploy Validation

After redeploy:

1. Check `/health` on each service URL
2. Open web and test:
`/register`
`/login`
3. Verify browser calls gateway domain from section 2
4. Test at least one endpoint per module:
`/users/*`, `/productivity/*`, `/messaging/*`, `/file-cloud/*`

## 8. Common Production Issues

1. CORS error with no `Access-Control-Allow-Origin`
Cause: request blocked before app (usually deployment protection) or `CLIENT_ORIGIN` mismatch.

2. Immediate logout after login
Cause: token accepted by auth but rejected by another service due to JWT/env mismatch.

3. `500 FUNCTION_INVOCATION_FAILED`
Cause: runtime bootstrap/env parse failure in target service.

4. `Invalid JSON response` in web
Cause: upstream returned non-JSON error page (often gateway/protection/runtime failure).

## 9. Adding More Services

Follow `docs/new-service-playbook.md` exactly.

High-level flow:

1. Create new app under `apps/<new-service>`
2. Add gateway route + env key if externally routed
3. Create `unified-<new-service>` project in Vercel GUI
4. Configure envs
5. Deploy in order before gateway/web
6. Update docs

## 10. Maintenance Rules

1. Keep docs updated whenever envs/domains/flow changes.
2. Avoid duplicate Vercel projects with overlapping names.
3. Keep root directories and project names consistent.
4. Treat `DEPLOYMENT_VERCEL.md` and `docs/*` as release-critical artifacts.
