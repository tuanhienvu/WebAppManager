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
 - **Database ORM:** Prisma 6 (MySQL / MariaDB)
 - **Auth & Security:** Bcrypt password hashing, cookie-based sessions
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
 NEXT_PUBLIC_API_URL="http://localhost:3000"
 # Optional fallback DB
 # DATABASE_URL_FALLBACK="mysql://user:pass@replica-host:3306/webapp_manager"
 ```

 If you prefer to store individual pieces, the app also honors:
 ```
 DB_HOST=localhost
 DB_PORT=3306
 DB_NAME=webapp_manager
 DB_USER=username
 DB_PASSWORD=password
 ```

 ## Database & Seeding
 ```bash
 npx prisma migrate deploy
 npm run seed
 npx prisma generate
 ```

 > The seed script (`prisma/seed.ts`) populates default users, company settings, software/version/token samples, and audit logs.

 ## Running the App
 ```bash
 npm install
 npm run dev
 # Visit http://localhost:3000
 ```

 For production:
 ```bash
 npm run build
 npm start
 ```

 ## Testing
 - `npm run test` – run Jest once
 - `npm run test:watch` – Jest in watch mode
 - `npm run test:coverage` – coverage report

 Mock Prisma clients for tests live in `src/__tests__/lib/mock-prisma.ts`.

 ## Project Structure
 ```
 src/
   components/        Shared UI (layout, modals, icons)
   contexts/          Language context for i18n
   hooks/             Auth + role helpers
   lib/               Prisma client helper, DB config, password utilities
   pages/
     api/             REST endpoints (Next.js API routes)
     *.tsx            Dashboard pages (software, tokens, versions, settings)
   styles/            Global Tailwind styles
 prisma/
   schema.prisma      Database schema
   migrations/        Generated migration files
   seed.ts            Seed script
 ```

 ## Internationalization
 - Translation strings live in `src/lib/translations.ts`.
 - `LanguageSwitcher` + `LanguageContext` provide runtime language toggling (English/Vietnamese).

 ## API Documentation
 - Swagger UI available at `/api-docs`.
 - Documentation served from `src/pages/api-docs.tsx`, covering Software, Versions, Tokens, Settings, and Audit Log endpoints.

 ## Deployment
 The app runs on any Node.js host (e.g., Ubuntu + PM2 + Nginx). High-level steps:
 1. Provision server with Node 24.x and MySQL.
 2. Clone repo, set `.env`, install dependencies (`npm ci`).
 3. Apply migrations & seed (`npx prisma migrate deploy`, `npm run seed`).
 4. Generate Prisma client (`npx prisma generate`).
 5. Run `npm run build` and start with `npm start` or PM2.
 6. Configure reverse proxy (Nginx) and HTTPS.

 Vercel deployment also works—just configure environment variables in the dashboard and let Next.js handle the rest.
