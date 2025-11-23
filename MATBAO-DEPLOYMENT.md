# MatBao Hosting Deployment Guide

This guide covers deploying WebApp Manager to MatBao hosting with:
- **Frontend**: https://wam.vuleits.com (Static Export or Standalone Server)
- **Backend**: https://wamapi.vuleits.com (Node.js Server)
- **Database**: MatBao MySQL (vul19326_wam)

## Quick Start

1. **Backend:** Build and upload `dist/`, `prisma/`, `package.json` to `wamapi.vuleits.com`
2. **Frontend:** Run `npm run build:export` and upload `out/` folder to `wam.vuleits.com` web root
3. **Database:** Configure `.env` with MatBao database credentials (see below)

## Database Configuration

The backend automatically constructs `DATABASE_URL` from `DB2_*` environment variables:
- `DB2_HOST=localhost`
- `DB2_PORT=3306`
- `DB2_NAME=vul19326_wam`
- `DB2_USER=vul19326_wamadmin`
- `DB2_PASSWORD=Wamdmin@2025`

This makes it easier to configure without manually URL-encoding the password.

---

## Prerequisites

- Node.js 20.19.5+ installed locally
- Access to MatBao hosting control panel
- Database credentials (MySQL/MariaDB)
- FTP/SSH access to both domains

---

## Option B: Build Static/Standalone, Upload and Run Start (Recommended)

This is the recommended approach for production deployment.

### Part 1: Backend Deployment (wamapi.vuleits.com)

#### Step 1: Prepare Backend Build

1. **Build the backend locally:**
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Create production `.env` file:**
   Create `backend/.env.production`:
   ```env
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://wam.vuleits.com
   
   # Database Configuration (MatBao Hosting)
   DB2_HOST=localhost
   DB2_PORT=3306
   DB2_NAME=vul19326_wam
   DB2_USER=vul19326_wamadmin
   DB2_PASSWORD=Wamdmin@2025
   
   # Alternative: Use DATABASE_URL directly (will be auto-constructed from DB2_* if not set)
   # DATABASE_URL="mysql://vul19326_wamadmin:Wamdmin%402025@localhost:3306/vul19326_wam"
   
   # Session Secret (generate a random string)
   SESSION_SECRET=your-super-secret-session-key-here
   ```
   
   **Note:** The system will automatically construct `DATABASE_URL` from `DB2_*` variables if `DATABASE_URL` is not set. The password will be URL-encoded automatically.

3. **Prepare files for upload:**
   You need to upload:
   - `dist/` folder (compiled JavaScript)
   - `prisma/` folder (schema and migrations)
   - `uploads/` folder (create if doesn't exist)
   - `package.json`
   - `.env.production` (rename to `.env` on server)
   - `node_modules/` (or install on server)

#### Step 2: Upload to MatBao Backend Server

1. **Via FTP/File Manager:**
   - Connect to `wamapi.vuleits.com` hosting
   - Upload the following structure:
     ```
     /home/username/wamapi/
     ├── dist/
     ├── prisma/
     ├── uploads/
     ├── package.json
     ├── package-lock.json
     └── .env
     ```

2. **Via SSH (if available):**
   ```bash
   # Upload files using SCP or SFTP
   scp -r backend/dist user@wamapi.vuleits.com:/home/username/wamapi/
   scp -r backend/prisma user@wamapi.vuleits.com:/home/username/wamapi/
   scp backend/package.json user@wamapi.vuleits.com:/home/username/wamapi/
   ```

#### Step 3: Install Dependencies and Setup on Server

1. **SSH into backend server:**
   ```bash
   ssh user@wamapi.vuleits.com
   cd /home/username/wamapi
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Create uploads directory:**
   ```bash
   mkdir -p uploads
   chmod 755 uploads
   ```

#### Step 4: Configure and Start Backend

1. **Update CORS in server.ts** (if needed):
   The backend should already allow `https://wam.vuleits.com` in CORS settings.

2. **Start the server:**
   
   **Option 1: Using PM2 (Recommended)**
   ```bash
   npm   
   pm2 start dist/server.js --name wamapi
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

   **Option 2: Using Node directly**
   ```bash
   node dist/server.js
   ```

   **Option 3: Using MatBao's Node.js App Manager**
   - In MatBao control panel, go to Node.js App Manager
   - Create new app:
     - App name: `wamapi`
     - App root: `/home/username/wamapi`
     - Start file: `dist/server.js`
     - Port: `5000` (or as configured)
     - Click "Start App"

3. **Configure reverse proxy (if needed):**
   If MatBao requires Nginx/Apache configuration:
   ```nginx
   # Nginx configuration
   server {
       listen 80;
       server_name wamapi.vuleits.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable HTTPS:**
   - Use MatBao's SSL certificate feature
   - Or configure Let's Encrypt via control panel

#### Step 5: Verify Backend

1. **Test health endpoint:**
   ```bash
   curl https://wamapi.vuleits.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test API endpoint:**
   ```bash
   curl https://wamapi.vuleits.com/api/auth/me
   ```

---

### Part 2: Frontend Deployment (wam.vuleits.com)

#### Step 1: Configure Frontend for Production

1. **Create production environment file:**
   Create `frontend/.env.production`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com
   NODE_ENV=production
   ```

2. **Update Next.js config (if needed):**
   The `next.config.ts` already supports both standalone and static export outputs.

#### Step 2: Choose Deployment Method

For MatBao, you have two options:

**Option A: Static Export (Recommended for MatBao)**
- Export as static HTML/CSS/JS files
- Upload to web root directory
- No Node.js server required
- Simpler deployment, works with standard web hosting

**Option B: Standalone Next.js Server**
- Upload the standalone build and run as Node.js app
- Requires Node.js runtime on server
- More complex but supports SSR features

---

### Option A: Static Export Deployment (Recommended)

#### Step 1: Build Static Export

1. **Build static export:**
   ```bash
   cd frontend
   npm install
   npm run build:export
   ```

   **Note:** The build script automatically detects if `NEXT_PUBLIC_API_BASE_URL` is set to `http://localhost:5000` (or not set) and automatically uses `https://wamapi.vuleits.com` for production builds. You'll see a message: `📡 API URL: https://wamapi.vuleits.com (auto-set from localhost)`

   This creates:
   - `out/` folder - Static HTML/CSS/JS files ready for upload

2. **Verify build:**
   The build should complete successfully and create static files in `frontend/out/`
   
   **To use a different API URL:**
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com npm run build:export
   ```

#### Step 2: Upload Static Files

1. **Upload to MatBao:**
   - Connect via FTP/File Manager to `wam.vuleits.com`
   - Upload **all contents** of `frontend/out/` folder to the web root:
     ```
     /home/username/wam/
     ├── index.html
     ├── _next/
     ├── login/
     ├── settings/
     ├── tokens/
     ├── versions/
     ├── audit-logs/
     ├── permissions/
     └── ... (all other static files)
     ```

2. **Set file permissions:**
   ```bash
   chmod 755 /home/username/wam
   find /home/username/wam -type f -exec chmod 644 {} \;
   find /home/username/wam -type d -exec chmod 755 {} \;
   ```

#### Step 3: Configure Web Server

1. **Ensure `.htaccess` or Nginx config handles SPA routing:**
   
   **For Apache (.htaccess):**
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

   **For Nginx:**
   ```nginx
   server {
       listen 80;
       server_name wam.vuleits.com;
       root /home/username/wam;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

2. **Verify API URL:**
   - The frontend is built with `NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com`
   - All API calls will go to the backend automatically

#### Step 4: Verify Frontend

1. **Test the site:**
   - Visit `https://wam.vuleits.com`
   - Check browser console for errors
   - Verify API calls are working

---

### Option B: Standalone Next.js Server Deployment

#### Step 1: Build Standalone

1. **Build for production:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

   This creates:
   - `.next/standalone/` - Standalone server files
   - `.next/static/` - Static assets

2. **Copy necessary files:**
   ```bash
   # Copy standalone folder
   cp -r .next/standalone ./standalone-build
   
   # Copy static files
   cp -r .next/static ./standalone-build/.next/static
   
   # Copy public folder
   cp -r public ./standalone-build/public
   
   # Copy package.json
   cp package.json ./standalone-build/
   ```
   
   **Or use the deployment script:**
   ```bash
   # Windows
   deploy-frontend.bat
   
   # Linux/Mac
   ./deploy-frontend.sh
   ```

#### Step 4: Upload to MatBao Frontend Server

1. **Upload files:**
   ```
   /home/username/wam/
   ├── standalone-build/
   │   ├── .next/
   │   ├── public/
   │   ├── server.js
   │   └── package.json
   ```

2. **Create `.env` file on server:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com
   PORT=3000
   NODE_ENV=production
   ```

#### Step 5: Start Frontend on Server

1. **SSH into frontend server:**
   ```bash
   ssh user@wam.vuleits.com
   cd /home/username/wam/standalone-build
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Start the server:**
   
   **Option 1: Using PM2**
   ```bash
   pm2 start server.js --name wam-frontend
   pm2 save
   ```

   **Option 2: Using MatBao's Node.js App Manager**
   - App name: `wam-frontend`
   - App root: `/home/username/wam/standalone-build`
   - Start file: `server.js`
   - Port: `3000`
   - Environment variables: Add `NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com`

4. **Configure reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name wam.vuleits.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option A: Upload and Install App

If MatBao provides a "Upload and Install" option, follow these steps:

### Backend (wamapi.vuleits.com)

1. **Prepare package:**
   ```bash
   cd backend
   npm install --production
   npm run build
   ```

2. **Create deployment package:**
   - Zip the entire `backend/` folder including:
     - `dist/`
     - `prisma/`
     - `node_modules/`
     - `package.json`
     - `.env.production` (rename to `.env`)

3. **Upload via MatBao control panel:**
   - Go to "Upload and Install App"
   - Upload the zip file
   - Extract to the domain root
   - Configure start command: `node dist/server.js`
   - Set port: `5000`

### Frontend (wam.vuleits.com)

**Option 1: Static Export (Recommended)**
1. **Build static export:**
   ```bash
   cd frontend
   npm install
   npm run build:export
   ```

2. **Create deployment package:**
   - Zip the `out/` folder contents

3. **Upload via MatBao control panel:**
   - Upload and extract to web root
   - Configure web server for SPA routing (see Option A above)
   - No Node.js app needed

**Option 2: Standalone Server**
1. **Prepare package:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Create deployment package:**
   - Zip the `standalone-build/` folder

3. **Upload via MatBao control panel:**
   - Upload and extract
   - Configure start command: `node server.js`
   - Set port: `3000`
   - Add environment variable: `NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com`

---

## Environment Variables Summary

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://wam.vuleits.com

# Database Configuration (MatBao Hosting)
DB2_HOST=localhost
DB2_PORT=3306
DB2_NAME=vul19326_wam
DB2_USER=vul19326_wamadmin
DB2_PASSWORD=Wamdmin@2025

# Session Secret (generate a random string)
SESSION_SECRET=your-secret-key
```

**Note:** The system automatically constructs `DATABASE_URL` from `DB2_*` variables. You can also set `DATABASE_URL` directly if preferred.

### Frontend (.env)
```env
NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com
PORT=3000
NODE_ENV=production
```

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://wamapi.vuleits.com/health`
- [ ] Frontend loads: `https://wam.vuleits.com`
- [ ] API calls work (check browser console)
- [ ] Login functionality works
- [ ] File uploads work (logo, avatar)
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CORS configured correctly
- [ ] PM2/process manager running
- [ ] Auto-restart on server reboot configured

---

## Troubleshooting

### Backend Issues

1. **Port already in use:**
   - Change PORT in `.env`
   - Update reverse proxy configuration

2. **Database connection failed:**
   - Verify DB2_* variables are set correctly
   - Check DATABASE_URL is constructed properly (check server logs)
   - Verify database host allows connections
   - Verify credentials (username, password, database name)
   - Check if password needs URL encoding (special characters like @)

3. **CORS errors:**
   - Ensure `FRONTEND_URL` includes `https://wam.vuleits.com`
   - Check backend CORS configuration

### Frontend Issues

1. **API calls failing:**
   - Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
   - Check browser console for CORS errors
   - Verify backend is accessible

2. **Static assets not loading:**
   - Ensure `.next/static/` folder is uploaded
   - Check file permissions

3. **404 errors on routes:**
   - **Static Export:** Configure `.htaccess` or Nginx for SPA routing (see Option A above)
   - **Standalone Server:** Next.js handles routing automatically

---

## Maintenance

### Updating the Application

1. **Backend:**
   ```bash
   cd /home/username/wamapi
   git pull  # or upload new files
   npm install --production
   npm run build
   npx prisma migrate deploy
   pm2 restart wamapi
   ```

2. **Frontend (Static Export):**
   ```bash
   # On local machine
   cd frontend
   npm run build:export
   # Upload new out/ folder contents to server
   ```

2. **Frontend (Standalone Server):**
   ```bash
   cd /home/username/wam/standalone-build
   git pull  # or upload new files
   npm install --production
   npm run build
   # Copy new standalone files
   pm2 restart wam-frontend
   ```

---

## Quick Deployment Commands

### Build Commands

**Backend:**
```bash
# Windows
deploy-backend.bat

# Linux/Mac
./deploy-backend.sh

# Or manually
cd backend
npm install --production
npm run build
npx prisma generate
```

**Frontend (Static Export - Recommended):**
```bash
# Windows
cd frontend
npm install
npm run build:export

# Linux/Mac
cd frontend
npm install
npm run build:export
```

**Frontend (Standalone Server):**
```bash
# Windows
deploy-frontend.bat

# Linux/Mac
./deploy-frontend.sh

# Or manually
cd frontend
npm install
npm run build
# Then copy files as described in Option B above
```

### One-Command Build (Root Directory)

**Windows:**
```bash
npm run build
```

**Linux/Mac:**
```bash
npm run build
```

This builds both backend and frontend. Then follow the upload steps above.

---

## MatBao Control Panel Configuration

### Backend App Configuration (wamapi.vuleits.com)

1. **Node.js App Settings:**
   - App Name: `wamapi`
   - App Root: `/home/username/wamapi` (or your domain root)
   - Start File: `dist/server.js`
   - Port: `5000` (or as configured in .env)
   - Node Version: `20.19.5` or higher

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://wam.vuleits.com
   
   # Database Configuration (MatBao Hosting)
   DB2_HOST=localhost
   DB2_PORT=3306
   DB2_NAME=vul19326_wam
   DB2_USER=vul19326_wamadmin
   DB2_PASSWORD=Wamdmin@2025
   
   SESSION_SECRET=your-secret-key
   ```

3. **Start Command:**
   ```
   node dist/server.js
   ```
   Or with PM2:
   ```
   pm2 start dist/server.js --name wamapi
   ```

### Frontend App Configuration (wam.vuleits.com)

**Option 1: Static Export (No Node.js Required)**
- Simply upload `out/` folder contents to web root
- Configure web server for SPA routing
- No Node.js app configuration needed

**Option 2: Standalone Server (Node.js App)**

1. **Node.js App Settings:**
   - App Name: `wam-frontend`
   - App Root: `/home/username/wam/standalone-build`
   - Start File: `server.js`
   - Port: `3000`
   - Node Version: `20.19.5` or higher

2. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com
   PORT=3000
   NODE_ENV=production
   ```

3. **Start Command:**
   ```
   node server.js
   ```
   Or with PM2:
   ```
   pm2 start server.js --name wam-frontend
   ```

---

## Deployment Summary

### Quick Reference

**Backend Deployment:**
1. Run `deploy-backend.bat` (Windows) or `./deploy-backend.sh` (Linux/Mac)
2. Upload `dist/`, `prisma/`, `package.json` to server
3. Create `.env` with database credentials
4. Run `npm install --production && npx prisma migrate deploy`
5. Start with `node dist/server.js` or PM2

**Frontend Deployment (Static Export - Recommended):**
1. Run `cd frontend && npm run build:export`
2. Upload all contents of `out/` folder to web root
3. Configure `.htaccess` or Nginx for SPA routing
4. Done! No Node.js server needed.

**Frontend Deployment (Standalone Server):**
1. Run `deploy-frontend.bat` (Windows) or `./deploy-frontend.sh` (Linux/Mac)
2. Upload `standalone-build/` folder to server
3. Run `npm install --production`
4. Start with `node server.js` or PM2

### File Locations

**Backend files to upload:**
- `backend/dist/` → `/home/username/wamapi/dist/`
- `backend/prisma/` → `/home/username/wamapi/prisma/`
- `backend/package.json` → `/home/username/wamapi/package.json`
- `backend/.env` → `/home/username/wamapi/.env`

**Frontend files to upload (Static Export):**
- `frontend/out/*` → `/home/username/wam/` (web root)

**Frontend files to upload (Standalone):**
- `frontend/standalone-build/*` → `/home/username/wam/standalone-build/`

---

## Support

For MatBao-specific issues:
- Check MatBao documentation for Node.js hosting
- Contact MatBao support for port/proxy configuration
- Verify Node.js version matches requirements (20.19.5+)
- Check MatBao's Node.js App Manager documentation

