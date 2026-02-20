# Unified MVP System Overview

This document describes the current implementation status and runtime flow.

## 1. Monorepo Apps

- `apps/auth-service` (`:3001`): auth + sessions + password flows
- `apps/user-service` (`:3002`): profile/social graph (follow/block/search)
- `apps/productivity-service` (`:3006`): tasks, notes, events, time, goals
- `apps/messaging-service` (`:3007`): conversations + messages CRUD
- `apps/gateway` (`:3000`): single API entrypoint/proxy
- `apps/web` (`:3100`): Next.js 16 frontend
- `packages/shared`: shared auth/errors/validation/logger helpers

## 2. Gateway Routing

Frontend calls only `NEXT_PUBLIC_API_BASE` (gateway). Gateway proxies:

- `/auth/*` -> `AUTH_SERVICE_URL` (`/auth/*`)
- `/users/*` -> `USER_SERVICE_URL` (`/users/*`)
- `/productivity/*` -> `PRODUCTIVITY_SERVICE_URL` (`/productivity/*`)
- `/messaging/*` -> `MESSAGING_SERVICE_URL` (`/messaging/*`)

## 3. Frontend Architecture

### 3.1 Route-based dashboard

Dashboard is URL-driven, so refresh preserves active module:

- `/dashboard/overview`
- `/dashboard/auth-user`
- `/dashboard/productivity`
- `/dashboard/messages`
- other planned modules also have dedicated section routes via `/dashboard/[section]`

`/dashboard` redirects to `/dashboard/overview`.

### 3.2 Token handling

- Access/refresh tokens stored in `localStorage`
- `apiFetch` auto-refreshes on 401
- on refresh failure, tokens clear and UI redirects to `/login` (no unhandled runtime crash)

## 4. Service Summaries

### 4.1 Auth Service

- Register/login/refresh/logout/me
- Session list + revoke + logout-all
- Change password, forgot/reset password
- Availability check for email/username

Primary collections:

- `users`
- `sessions`
- `user_devices`
- `password_reset_tokens`

### 4.2 User Service

- `GET /users/me`, `PATCH /users/me`
- public profile lookup and search
- follow/unfollow, block/unblock
- followers/following/blocked/stats endpoints

Primary collections:

- `users` (profile)
- `user_follows`
- `user_blocks`

### 4.3 Productivity Service

Single router currently exposes full module set:

- Todos, categories, dependencies, progress
- Calendar events
- Notebooks, notes, note versions
- Time entries
- Pomodoro sessions
- Focus goals

### 4.4 Messaging Service

Newly scaffolded backend:

- `GET/POST/PATCH/DELETE /messaging/conversations`
- `GET/POST /messaging/conversations/:id/messages`
- `PATCH/DELETE /messaging/messages/:id`

Primary collections:

- `conversations`
- `messages`

## 5. Environment Variables

### Gateway

- `PORT`
- `CLIENT_ORIGIN`
- `AUTH_SERVICE_URL`
- `USER_SERVICE_URL`
- `PRODUCTIVITY_SERVICE_URL`
- `MESSAGING_SERVICE_URL`

### Auth/User/Productivity/Messaging Services

- `PORT`
- `MONGODB_URI`
- `CLIENT_ORIGIN`
- auth-sensitive services also use JWT secrets from env (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)

### Web

- `NEXT_PUBLIC_API_BASE`

## 6. Run Commands

Install:

```bash
pnpm install
```

Run all:

```bash
pnpm run dev:all
```

## 7. Current Status

Implemented and working:

- Auth module
- User module
- Productivity module
- Messaging module (foundation + frontend start)
- Gateway integration
- Next.js 16 frontend base with route-based dashboard
