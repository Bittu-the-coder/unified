# Unified MVP (Phase 1)

This repository implements a structured MVP from the `unified_plan.docx` roadmap and `unified_er.txt` schema:

- Monorepo with shared TypeScript package
- Node.js microservices (Auth, User, Productivity) + API Gateway
- Next.js frontend scaffold
- MongoDB-backed ER-aligned models for Phase-1 scope
- Docker Compose for local infrastructure and service orchestration

## Services

- `apps/gateway` (`:3000`): API gateway and routing
- `apps/auth-service` (`:3001`): registration, login, refresh, session tracking
- `apps/user-service` (`:3002`): profile, follow, unfollow, block, unblock
- `apps/productivity-service` (`:3006`): todos + progress recording
- `apps/web` (`:3100`): frontend MVP (login, register, dashboard)
- `packages/shared`: shared config, error handling, JWT/auth middleware, validation

## ER Alignment (Implemented MVP Collections)

- Auth DB: `users`, `sessions`, `user_devices`
- User DB: `users` (profile view), `user_follows`, `user_blocks`
- Productivity DB: `tasks`, `feature_usage` (as progress records)

Root model files matching expected structure:

- `models/Todos.model.ts`
- `models/ProgressRecorder.model.ts`
- `lib/db.ts`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Run services in separate terminals:

```bash
npm run dev -w apps/auth-service
npm run dev -w apps/user-service
npm run dev -w apps/productivity-service
npm run dev -w apps/gateway
npm run dev -w apps/web
```

3. Or run with Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Key API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### User

- `GET /users/:id`
- `PATCH /users/me`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `POST /users/:id/block`
- `DELETE /users/:id/block`

### Productivity

- `GET /productivity/todos`
- `POST /productivity/todos`
- `PATCH /productivity/todos/:id`
- `DELETE /productivity/todos/:id`
- `GET /productivity/progress`
- `POST /productivity/progress`

## Notes

- This is the foundation MVP slice of the full 7-phase roadmap.
- The remaining planned services (file, messaging, calls, feed, shopping, AI, notifications) can be added in the same pattern.
