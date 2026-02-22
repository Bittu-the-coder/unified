# Environment Variable Matrix

Last updated: February 22, 2026

## Unified Projects

1. `unified-web` -> `apps/web`
2. `unified-gateway` -> `apps/gateway`
3. `unified-auth-service` -> `apps/auth-service`
4. `unified-user-service` -> `apps/user-service`
5. `unified-productivity-service` -> `apps/productivity-service`
6. `unified-messaging-service` -> `apps/messaging-service`
7. `unified-file-service` -> `apps/file-service`

## Common Standards

1. `NODE_ENV=production` in all backend services.
2. Use the same JWT secrets across services that validate auth tokens.
3. `CLIENT_ORIGIN` should be identical across gateway + all services.
4. After any env change, trigger a new production deploy.

## Current Production Baseline

### `unified-web`

1. `NEXT_PUBLIC_API_BASE=https://gateway-dun-chi.vercel.app`

### `unified-gateway`

1. `NODE_ENV=production`
2. `CLIENT_ORIGIN=https://web-swart-delta-57.vercel.app,https://unified-web-bittu-the-coders-projects.vercel.app,https://web-sooty-mu-55.vercel.app,http://localhost:3100,http://localhost:3000`
3. `AUTH_SERVICE_URL=https://auth-service-delta-beryl.vercel.app`
4. `USER_SERVICE_URL=https://user-service-omega.vercel.app`
5. `PRODUCTIVITY_SERVICE_URL=https://productivity-service.vercel.app`
6. `MESSAGING_SERVICE_URL=https://messaging-service-theta.vercel.app`
7. `FILE_SERVICE_URL=https://file-service-alpha.vercel.app`

### `unified-auth-service`

1. `NODE_ENV=production`
2. `MONGODB_URI=<auth-db-uri>`
3. `CLIENT_ORIGIN=<same as gateway CLIENT_ORIGIN>`
4. `JWT_ACCESS_SECRET=<shared-secret>`
5. `JWT_REFRESH_SECRET=<shared-secret>`

### `unified-user-service`

1. `NODE_ENV=production`
2. `MONGODB_URI=<user-db-uri>`
3. `CLIENT_ORIGIN=<same as gateway CLIENT_ORIGIN>`
4. `JWT_ACCESS_SECRET=<shared-secret>`
5. `JWT_REFRESH_SECRET=<shared-secret>`

### `unified-productivity-service`

1. `NODE_ENV=production`
2. `MONGODB_URI=<productivity-db-uri>`
3. `CLIENT_ORIGIN=<same as gateway CLIENT_ORIGIN>`
4. `JWT_ACCESS_SECRET=<shared-secret>`
5. `JWT_REFRESH_SECRET=<shared-secret>`

### `unified-messaging-service`

1. `NODE_ENV=production`
2. `MONGODB_URI=<messaging-db-uri>`
3. `CLIENT_ORIGIN=<same as gateway CLIENT_ORIGIN>`
4. `JWT_ACCESS_SECRET=<shared-secret>`
5. `JWT_REFRESH_SECRET=<shared-secret>`

### `unified-file-service`

1. `NODE_ENV=production`
2. `MONGODB_URI=<file-db-uri>`
3. `CLIENT_ORIGIN=<same as gateway CLIENT_ORIGIN>`
4. `JWT_ACCESS_SECRET=<shared-secret>`
5. `JWT_REFRESH_SECRET=<shared-secret>`
6. Storage provider vars for one active provider:
`IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
or
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Important Notes

1. Avoid trailing newlines when entering secrets manually.
2. Keep production values in Vercel GUI, not in committed `.env` files.
3. Use Preview env separately for test branches if needed.
