# New Service Playbook

Use this when adding any new backend service to the monorepo.

## 1. Create Service Skeleton

1. Add folder: `apps/<new-service>`
2. Add:
`package.json`
`tsconfig.json`
`src/index.ts`
`api/index.ts`
`vercel.json`
3. If shared package is needed, use local shared pattern used by existing services.

## 2. Add Workspace Scripts

1. Add service scripts in `apps/<new-service>/package.json`:
`build`, `dev`, `typecheck`
2. Update root scripts if needed (for full-stack dev/build).

## 3. Gateway Integration

If service is public via gateway:

1. Add env key in `apps/gateway/src/config.ts`:
`<NEW_SERVICE>_URL`
2. Add proxy route in `apps/gateway/src/app.ts`.
3. Add production env var in `unified-gateway`.

## 4. Vercel Project Setup

1. Create project name: `unified-<new-service>`.
2. Root directory: `apps/<new-service>`.
3. Framework: `Other` (unless special case).
4. Connect Git repo in GUI.
5. Add required env vars in Production (and Preview if needed).

## 5. Local Linking

1. `cd apps/<new-service>`
2. `vercel link --project unified-<new-service>`

## 6. Deploy and Validate

1. Deploy the new service.
2. If gateway depends on it, deploy gateway after new service URL is set.
3. Deploy web last if frontend now consumes new gateway routes.
4. Validate:
`/health`
gateway route
frontend flow

## 7. Documentation Updates Required

After onboarding new service, update:

1. `docs/env-matrix.md`
2. `docs/domains-aliases.md`
3. `docs/release-checklist.md`
4. `DEPLOYMENT_VERCEL.md`
