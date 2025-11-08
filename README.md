<div align="center">
  <img src="./public/Logo.jpg" alt="WebApp Manager Logo" width="120" />
  <h1>WebApp Manager</h1>
  <p>Dashboard for managing software releases, access tokens, audit logs, and company settings.</p>
</div>

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database & Seeding](#database--seeding)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Internationalization](#internationalization)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## Overview
WebApp Manager is a role-based admin portal built with Next.js. It helps teams track software assets, release versions, manage API access tokens, and audit important actions. The interface includes:
- Software inventory dashboard
- Version history management
- Token issuance and validation workflows
- Admin audit logs
- Company profile and contact settings
- Multilingual UI (English & Vietnamese)

## Tech Stack
- **Framework:** Next.js 16 / React 19
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Database ORM:** Prisma 6 (MySQL)
- **Auth & Security:** Bcrypt password hashing, token-based auth
- **Testing:** Jest + Testing Library
- **Docs:** Swagger UI for API reference

## Prerequisites
- Node.js **24.11.0** (see `.nvmrc`)
- npm **>= 10.8**
- MySQL 8.x or MariaDB 10.6+

## Environment Setup
Create a local `.env` (not committed by default):
```env
DATABASE_URL="mysql://username:password@localhost:3306/webapp_manager"
# Optional additional secrets (JWT keys, SMTP, etc.)
```

## Database & Seeding
Run migrations and populate seed data:
```bash
npx prisma migrate deploy
npm run seed
```

> To inspect or adjust the seed data, edit `prisma/seed.ts`.

## Running the App
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Use `npm run build && npm start` for a production build.

## Testing
- `npm run test` – run the Jest suite once
- `npm run test:watch` – watch mode
- `npm run test:coverage` – generate coverage report

API routes rely on mocked Prisma clients in `src/__tests__/lib/mock-prisma.ts`.

## Project Structure
```
src/
  components/        Shared UI components (layout, modals, icons)
  contexts/          Language context for i18n
  hooks/             Auth + role helpers
  lib/               Prisma client, DB config, password utilities
  pages/
    api/             REST endpoints (Next.js API routes)
    *.tsx            Initial pages (dashboard, tokens, settings, etc.)
  styles/            Global Tailwind styles
prisma/
  schema.prisma      Database schema
  migrations/        Generated migration files
  seed.ts            Seed script
```

## Internationalization
Language strings live in `src/lib/translations.ts`. The UI toggles languages via the `LanguageSwitcher` component and persists preference using context.

## API Documentation
Swagger UI is available at `/api-docs`. It renders from a static OpenAPI spec defined in `src/pages/api-docs.tsx` and covers Software, Versions, Tokens, Settings, and Audit Log endpoints.

## Deployment
The app is optimized for Vercel/Next.js hosting:
```bash
npm run build
npm start
```

Ensure environment variables and database credentials are configured in your hosting platform prior to deployment.
