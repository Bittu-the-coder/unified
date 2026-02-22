# Domains and Aliases

Last updated: February 22, 2026

## Primary Public URLs

1. Web: `https://web-swart-delta-57.vercel.app`
2. Gateway: `https://gateway-dun-chi.vercel.app`
3. Auth: `https://auth-service-delta-beryl.vercel.app`
4. User: `https://user-service-omega.vercel.app`
5. Productivity: `https://productivity-service.vercel.app`
6. Messaging: `https://messaging-service-theta.vercel.app`
7. File: `https://file-service-alpha.vercel.app`

## Policy

1. Web should call gateway only.
2. Gateway should call internal service URLs from env.
3. Do not use outdated aliases in frontend code.
4. Keep one canonical public URL per service.

## Known Working API Base

1. `NEXT_PUBLIC_API_BASE=https://gateway-dun-chi.vercel.app`

## Troubleshooting Alias Drift

If a domain points to wrong deployment:

1. Inspect alias in CLI:
`vercel alias ls --scope <team>`
2. Rebind alias:
`vercel alias set <deployment-url> <alias-domain> --scope <team>`
3. Re-check:
`vercel inspect <alias-domain> --scope <team>`

## Deployment Protection Warning

If browser requests return Vercel `401 Authentication Required` HTML:

1. Your request is blocked by Vercel protection before reaching app middleware.
2. Fix in GUI:
`Project Settings -> Deployment Protection` and allow public production access for required APIs.
