# Release Checklist

Use this checklist for every production release.

## Pre-Release

1. Confirm all `unified-*` projects are linked to GitHub repo `Bittu-the-coder/unified`.
2. Confirm root directory per project is correct (`apps/<service>`).
3. Confirm production env vars are complete using `docs/env-matrix.md`.
4. Confirm web API base points to active gateway alias.
5. Confirm deployment protection is configured correctly for public APIs.

## Deploy Order

1. `unified-auth-service`
2. `unified-user-service`
3. `unified-productivity-service`
4. `unified-messaging-service`
5. `unified-file-service`
6. `unified-gateway`
7. `unified-web`

## Post-Deploy Verification

1. Open each `/health` endpoint.
2. Test from web:
`/register`
`/login`
3. Verify browser network uses gateway domain from current baseline.
4. Confirm no CORS preflight failures in console.
5. Confirm login response is `200` and token flow works.
6. Check Vercel runtime logs for each service for unexpected errors.

## Rollback Plan

If current deployment fails:

1. Identify last stable deployment in Vercel dashboard.
2. Run rollback/promote for that deployment.
3. Re-verify health + login/register immediately.
4. Document incident and root cause before next release.

## Common Failure Quick Checks

1. `401 Authentication Required` HTML from Vercel:
Deployment Protection is blocking.
2. CORS missing header:
Gateway/service `CLIENT_ORIGIN` mismatch or request blocked before app.
3. Login `500`:
Check auth env + runtime logs.
4. Frontend still calling old domain:
old cached JS or stale fallback URL.
