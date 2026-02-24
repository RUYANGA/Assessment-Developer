# Eskalate News API — Backend

Eskalate News is a production-oriented REST API that enables Authors to publish content and Readers to consume it. The service includes a high-frequency analytics pipeline to aggregate read events and present author-facing metrics.

## Tech stack
- Framework: NestJS (TypeScript)
- Database: PostgreSQL (Neon or self-hosted)
- ORM: Prisma
- Job queue: BullMQ (Redis)
- Auth: JWT with role-based access control (RBAC)
- Validation: class-validator / class-transformer (Zod optional)

## Key features
- Secure authentication (bcrypt password hashing + JWT)
- Author article lifecycle (create, update, soft-delete)
- Public, paginated feed of published articles
- Non-blocking read logging and a daily analytics aggregator
- Author dashboard with per-article metrics
- Anti-spam protection for read events (de-dup within time window)

---

## Quick start (local development)

Prerequisites
- Node.js (v18+)
- Redis (required for BullMQ)
- PostgreSQL (Neon recommended for production; local Postgres works for development)

Install

1. Clone the repository and change into the project directory.
2. Install dependencies:

```bash
npm install
```

Configuration

Create a `.env` file in the repository root and set the required variables:

```env
# Postgres connection (example)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# JWT secret
JWT_SECRET="your_secret_key"

# Redis connection for BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional: API port (overrides default)
PORT=3003
```

Database

Generate the Prisma client and apply the schema to the database (development):

```bash
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma
```

Run the app

```bash
# Development (watch)
npm run start:dev

# Production
npm run build
npm run start:prod
```

If you prefer Docker for development, a `docker-compose.yml` is included to run the app together with a local Postgres instance.

---

## API documentation

Swagger/OpenAPI docs are available when the server is running:

- `http://localhost:${process.env.PORT || 3003}/api/docs`

Authentication flow (Swagger)

1. POST `/api/auth/login` to obtain a JWT.
2. Click **Authorize** in the Swagger UI and paste `Bearer <token>`.
3. Use protected endpoints via the UI.

---

## Selected endpoints
- `POST /api/auth/signup` — Register a new user (roles: AUTHOR | READER)
- `POST /api/auth/login` — Obtain JWT
- `POST /api/articles` — Create article (AUTHOR only)
- `GET /api/articles/me` — List my articles (AUTHOR only)
- `PUT /api/articles/:id` — Update article (ownership enforced)
- `DELETE /api/articles/:id` — Soft delete article
- `GET /api/articles` — Public feed (published articles only)
- `GET /api/articles/:id` — Read article (creates read log)
- `GET /api/author/dashboard` — Author analytics dashboard

---

## Architectural notes

- NestJS provides a modular, testable structure with DI.
- BullMQ is used to queue read events and run aggregation jobs asynchronously.
- Soft deletion uses a `deletedAt` timestamp to preserve historical data for analytics while hiding content from public queries.
- A global response interceptor standardizes API responses across all endpoints.

---

If you need help running the project with Docker, setting up a Neon Postgres connection, or enabling CI/CD to build and publish images, tell me your preferred target (Docker Hub / GHCR) and I will add the required workflow steps and secrets guidance.

---

## Operational notes

- Scheduler: The app registers a repeatable `aggregate-daily` job (00:05 GMT) using BullMQ. Bull/Redis must be available for this to run automatically.
- Guest read de-duplication: Guest reads are deduplicated within a short TTL (60s) using Redis `SET NX EX`. If `REDIS_URL` is not provided the app falls back to an in-memory dedupe (single-node only).

## Quick verification & E2E scripts

There are small scripts to help with quick end-to-end checks (use the `.env` for DB/Redis connection):

```bash
# create a test author + published article
node scripts/e2e-create.js

# count read_log entries for a given article
node scripts/e2e-count.js <articleId>
```

To manually trigger aggregation (for testing) you can POST to the internal endpoint (requires app + Bull enabled):

```http
POST /author/admin/trigger-aggregation
```

## CI / Docker

- A GitHub Actions workflow is included to build and test the project. If you want automatic image publishing, provide the registry and secrets and I can extend the workflow.
- A `docker-compose.yml` is available for local development to run Postgres + Redis + the app.

---

If you want I can:
- Add a Redis-backed integration test to CI that verifies guest dedupe and aggregation.
- Add a monitoring endpoint that reports queue health and repeatable job registrations.

Tell me which of these you'd like next.
