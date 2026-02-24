# Eskalate News API - Backend Assessment

A robust, production-ready RESTful API where Authors publish content and Readers consume it, featuring a high-frequency Analytics Engine.

## Tech Stack
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma
- **Job Queue**: BullMQ (Redis-backed for high-frequency processing)
- **Authentication**: JWT with Role-Based Access Control (RBAC)
- **Validation**: Zod (optional) / Class-validator + Class-transformer

## Features
- **Secure Auth**: Signup/Login with strong password hashing (bcrypt) and JWT claims.
- **Article Lifecycle**: Full CRUD for authors with Soft Deletion support.
- **Public Feed**: Filtered, paginated news feed for readers (Published & non-deleted only).
- **Read Tracking**: Non-blocking raw log capture for every article read.
- **Analytics Engine**: Daily aggregation of read logs using a job queue (GMT timezone).
- **Author Dashboard**: Aggregated performance metrics (total views) per article.
- **Anti-Spam**: Prevents duplicate read logs from the same user/guest within 1 minute.

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- Redis (Required for BullMQ analytics job queue)
- PostgreSQL (Existing Neon DB instance used)

### Installation
1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory with the following:
```env
DATABASE_URL="postgresql://..." # Provided in the assessment
JWT_SECRET="your_secret_key"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=3000
```

### Database Initialization
Apply migrations and generate Prisma client:
```bash
npx prisma generate
npx prisma migrate dev
```

### Running the App
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation (Endpoints)
- `POST /api/auth/signup`: User registration (Author/Reader).
- `POST /api/auth/login`: Identity management (returns JWT).
- `POST /api/articles`: Create article (Author only, Draft by default).
- `GET /api/articles/me`: List own articles (Author only, paginated).
- `PUT /api/articles/:id`: Edit article (Author ownership check).
- `DELETE /api/articles/:id`: Soft delete article (Author ownership check).
- `GET /api/articles`: Public news feed (Published & non-deleted, filtered).
- `GET /api/articles/:id`: Read article (Captures read log).
- `GET /api/author/dashboard`: Performance metrics (Author only, aggregated views).

## Architecture Choices
- **NestJS**: Chosen for its robust DI system and modular architecture, perfect for scalable backends.
- **BullMQ**: used for the Analytics Engine to ensure high-frequency logs are processed asynchronously without blocking the main event loop.
- **Soft Deletion**: Implemented via `deletedAt` timestamp to preserve data integrity for analytics while hiding content from public feeds.
- **Global Interceptor**: A response interceptor was implemented to ensure 100% compliance with the required response object structure.
