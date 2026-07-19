---
name: development-setup
description: How to set up and run the development environment
---

# Development Setup

## Prerequisites
- Node.js v24+
- PostgreSQL running on localhost:5432
- Redis running on localhost:6379
- Python 3.14+ (for script utilities)

## Backend Setup (server/)
```bash
cd server

# Install dependencies
npm install

# Copy env
cp .env.example .env
# Edit .env with your local database credentials

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database (if seed script exists)
# npm run seed

# Start API server
npm run dev:api
# → http://localhost:4000/api/v1

# Start worker (for background jobs)
npm run dev:worker

# Start Telegram bot
npm run dev:bot
```

## Frontend Setup (client/)
```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Build for production
npm run build
# → dist/
```

## Test Credentials
The seed data should create:
- **Super Admin:** login: `admin`, password: `admin123`
- **Pharmacy Admin:** login: `pharmacy1`, password: `pharmacy123`
- **Employee:** Created by Pharmacy Admin

## Architecture Overview
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  React Admin │────▶│  NestJS API  │────▶│  PostgreSQL  │
│  Panel (:3000)│    │  (:4000)     │    │  (:5432)     │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                    ┌───────┴────────┐
                    │   Redis        │
                    │   BullMQ       │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │   Worker       │
                    │   + Telegram   │
                    │   Bot (:grammy)│
                    └────────────────┘
```

## Important Notes
- Frontend proxies `/api/*` to backend in dev mode
- JWT tokens stored in localStorage
- Token refresh is automatic via Axios interceptor
- PHARMACY_ADMIN users are scoped to their pharmacy
- All mutation operations include toast notifications
