# Deployment Guide

This guide covers both deployment modes:

- **Option A:** Split architecture for shared hosting – static frontend on `wam.vuleits.com`, API/backend on `wam-api.vuleits.com`.
- **Option B:** Traditional single-server deployment (Ubuntu + PM2 + Nginx).

Use the sections that match your hosting plan.

---

## Option A – Static Frontend + Dedicated API

### 1. Prerequisites
| Component | Frontend (Mat Bao shared hosting) | Backend (Node host / Mat Bao VPS) |
|-----------|-----------------------------------|------------------------------------|
| Runtime   | Static HTML/JS/CSS                | Node.js 18.20.4, npm ≥ 10.8        |
| Database  | —                                 | MySQL 8 / MariaDB 10.6+            |
| Domains   | `wam.vuleits.com`                 | `wam-api.vuleits.com`              |

> Ensure the backend host can reach your database and accept HTTPS traffic. The frontend only needs file hosting.

### 2. Backend (API) Deployment Steps
1. **Prepare sources**
   ```bash
   git clone https://github.com/tuanhienvu/WebAppManager.git webapp-manager
   cd webapp-manager
   npm ci
   npx prisma migrate deploy
   npm run build          # standalone Next.js output
   ```

2. **Configure environment**
   Create `.env` (backend host):
   ```env
   DATABASE_URL="mysql://username:password@db-host:3306/webapp_manager"
   NEXT_PUBLIC_API_URL="https://wam-api.vuleits.com"
   NODE_ENV=production
   PORT=3000
   ```
   Add any SMTP, storage, or secret keys your instance requires.

3. **Start the server**
   ```bash
   npm start                      # node app.js (listens on PORT)
   # recommended: pm2 start app.js --name webapp-manager
   ```

4. **Expose `wam-api.vuleits.com`**
   - On Mat Bao VPS or similar: configure Nginx/Apache reverse proxy to the Node port (3000).
   - Issue an SSL certificate via Let’s Encrypt or your provider.

5. **Enable CORS**
   Since the frontend loads from `wam.vuleits.com`, ensure API routes send:
   ```
   Access-Control-Allow-Origin: https://wam.vuleits.com
   Access-Control-Allow-Credentials: true
   ```
   You can add a simple middleware in `src/pages/api/*` to attach these headers.

### 3. Frontend (Static) Deployment Steps

1. **Point the frontend to the API**
   - In `.env.production`, set `NEXT_PUBLIC_API_URL="https://wam-api.vuleits.com"`.
   - Ensure every client fetch uses the shared helper (`apiFetch`) so the URL is baked into the build.

2. **Create the static bundle**
   ```bash
   npm run export:frontend
   ```
   This script:
   - Temporarily moves `src/pages/api` out of the way.
   - Builds with `STATIC_EXPORT=true`.
   - Runs `next export` to produce the `out/` folder.
   - Restores the API directory.

3. **Zip the output**
   - Windows PowerShell:
     ```powershell
     powershell Compress-Archive -Path out\* -DestinationPath out.zip -Force
     ```
   - macOS/Linux:
     ```bash
     zip -r out.zip out
     ```

4. **Upload to Mat Bao (File Manager)**
   - Log in to the Mat Bao control panel.
   - Navigate to `wam.vuleits.com`’s document root (e.g., `/httpdocs/wam`).
   - Remove old files if present.
   - Upload `out.zip`.
   - Select the file and choose **Extract**. Files such as `index.html`, `_next/`, `assets/` should sit directly in the root.

5. **Configure rewrites**
   For SPA-style routing, ensure 404s fall back to `index.html`. If Mat Bao uses Apache, create `.htaccess`:
   ```
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.html [L]
   ```

6. **Verify**
   - Browse to `https://wam.vuleits.com`.
   - Open DevTools → Network to confirm API calls hit `https://wam-api.vuleits.com`.
   - Test login, CRUD actions, and file uploads (logos/avatars). All requests should succeed via CORS.

### 4. Folder/Artifact Summary
| Artifact | Destination |
|----------|-------------|
| `out/` contents | Static hosting root (`wam.vuleits.com`) |
| Entire repo (with `node_modules`, `.env`) | Backend Node host (`wam-api.vuleits.com`) |

Keep both deployments in sync by rebuilding and re-uploading after each release:
1. `git pull`.
2. On backend: `npm ci && npx prisma migrate deploy && npm run build && pm2 restart ...`
3. On frontend: `npm run export:frontend`, zip, upload, extract.

---

## Option B – Single Server (Ubuntu + PM2 + Nginx)

Follow these steps if you host everything on one Node-capable machine (e.g., VPS).

1. **Install dependencies**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential curl git nginx
   curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
   source ~/.nvm/nvm.sh
   nvm install 18.20.4
   nvm alias default 18.20.4
   npm install --global pm2
   ```

2. **Clone & build**
   ```bash
   cd /var/www
   sudo git clone https://github.com/tuanhienvu/WebAppManager.git
   sudo chown -R deploy:deploy WebAppManager
   cd WebAppManager

   npm ci
   npx prisma migrate deploy
   npm run seed        # optional
   npm run build
   ```

3. **Environment configuration**
   ```env
   NEXT_PUBLIC_API_URL=https://app.yourdomain.com
   DATABASE_URL=mysql://wam_user:password@db-host:3306/webapp_manager
   NODE_ENV=production
   PORT=3000
   ```

4. **Run with PM2**
   ```bash
   pm2 start app.js --name webapp-manager
   pm2 save
   pm2 startup
   ```

5. **Reverse proxy & HTTPS**
   - Create `/etc/nginx/sites-available/webapp-manager` pointing to `http://127.0.0.1:3000`.
   - Enable with `ln -s`.
   - Run `sudo certbot --nginx -d app.yourdomain.com`.

6. **Updates**
   ```bash
   git pull origin main
   npm ci
   npx prisma migrate deploy
   npm run build
   pm2 restart webapp-manager
   ```

7. **Backups & Monitoring**
   - Schedule `mysqldump` or managed snapshots.
   - Ship PM2 logs or tail them via `pm2 logs`.
   - Add uptime checks for `/login`.

---

## Troubleshooting
| Issue | Resolution |
|-------|------------|
| `EAGAIN` / `EPERM` on shared hosting | Use Option A (split deployment). Shared hosting often blocks Node worker processes. |
| Static frontend calling `/api/...` fails | Ensure `NEXT_PUBLIC_API_URL` is set **before** `npm run export:frontend` and CORS headers allow the origin. |
| Upload endpoints blocked (logo/avatar) | Backend must expose `/api/upload` with CORS + HTTPS. Static hosts cannot process uploads themselves. |
| Prisma connection errors | Verify DB credentials and network ACLs; rerun `npx prisma migrate deploy`. |

---

## Quick Checklist
- [ ] Backend (`wam-api`) online with PM2 and HTTPS.
- [ ] Static `out/` uploaded to `wam`.
- [ ] `NEXT_PUBLIC_API_URL` baked into the frontend build.
- [ ] CORS headers allow `https://wam.vuleits.com`.
- [ ] File uploads tested end-to-end.

Happy deploying!

