<<<<<<< HEAD
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
You can deploy WebApp Manager on either a self-managed Node.js host or a platform such as Vercel.

### Self-managed Node.js Hosting (Ubuntu + PM2 + Nginx)
1. **Provision the server**
   - Ubuntu 20.04/22.04 LTS (or similar)
   - Node.js 24.11.0 (install via `nvm`)
   - npm ≥ 10.8
   - Git, PM2, and Nginx

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential git curl nginx

   # Install nvm + Node 24.11.0
   curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
   source ~/.nvm/nvm.sh
   nvm install 24.11.0
   nvm alias default 24.11.0

   npm install --global pm2
   ```

2. **Upload the source**
   - Clone your repository or upload a build artifact.
   ```bash
   cd /var/www
   sudo git clone https://github.com/your-username/webapp-manager.git
   sudo chown -R deploy:deploy webapp-manager   # replace with your user
   cd webapp-manager
   ```

3. **Create `.env`**
   ```
   DATABASE_URL="mysql://user:password@db-host:3306/webapp_manager"
   NEXT_PUBLIC_API_URL="https://yourdomain.com"
   # or use DB_HOST/DB_USER/DB_PASSWORD variables
   ```

4. **Install and build**
   ```bash
   npm ci
   npx prisma migrate deploy
   npm run seed         # optional but loads initial data
   npx prisma generate
   npm run build
   ```

5. **Start the app (app.js entry) or use PM2**
   ```bash
   npm start               # runs node app.js
   ```

   Or keep it running via PM2:
   ```bash
   pm2 start app.js --name webapp-manager
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx reverse proxy**
   Create `/etc/nginx/sites-available/webapp-manager`:
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

=======
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
The app is optimized for both Vercel and self-managed servers.  
For a detailed walkthrough, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### Private Hosting (Node.js)
1. **Provision server requirements**
   - Ubuntu 22.04 LTS (or similar)
   - Node.js 24.11.0 (use `nvm install 24.11.0`)
   - MySQL 8.x or MariaDB 10.6+ with network access

2. **Prepare environment**
   ```bash
   git clone https://github.com/tuanhienvu/WebAppManager.git
   cd WebAppManager
   cp README.md README.local.md   # optional personal notes
   # create a .env file and populate the variables described below
   npm ci
   ```

3. **Configure system service (example using PM2)**
   ```bash
   npx pm2 start npm --name webapp-manager -- run start
   npx pm2 save
   npx pm2 startup systemd
   ```

4. **Reverse proxy (Nginx snippet)**
   ```nginx
   server {
     listen 80;
     server_name app.yourdomain.com;

>>>>>>> 9d070f4489f3e7e0795e7cd28866a0af5741931f
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

<<<<<<< HEAD
   Enable the site and reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/webapp-manager /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Add HTTPS (Let’s Encrypt)**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

8. **Future updates**
   ```bash
   cd /var/www/webapp-manager
   git pull origin main
   npm ci
   npx prisma migrate deploy
=======
5. **Update** with new releases
   ```bash
   git pull origin main
   npm ci
>>>>>>> 9d070f4489f3e7e0795e7cd28866a0af5741931f
   npm run build
   pm2 restart webapp-manager
   ```

### Vercel / Managed Hosting
<<<<<<< HEAD
1. Push your repo to GitHub/GitLab.
2. Create a new project in Vercel and import the repo.
3. Set the environment variables (`DATABASE_URL`, etc.) in Vercel.
4. Deploy—the build command is `npm run build`, and the output is handled by Next.js automatically.

### Verification Checklist
- `https://yourdomain.com` loads the dashboard.
- `/api-docs` serves Swagger documentation.
- Authentication routes (`/api/auth/login`, `/api/auth/logout`) respond correctly.
- PM2 logs (`pm2 logs webapp-manager`) show no unresolved errors.
=======
```bash
npm run build
npm start
```

Ensure environment variables and database credentials are configured in your hosting platform prior to deployment.
>>>>>>> 9d070f4489f3e7e0795e7cd28866a0af5741931f
