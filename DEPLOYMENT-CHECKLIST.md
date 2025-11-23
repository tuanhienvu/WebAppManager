# MatBao Deployment Checklist

## Pre-Deployment

- [ ] Node.js 20.19.5+ installed locally
- [ ] Database created and accessible
- [ ] MatBao hosting accounts ready for both domains
- [ ] FTP/SSH credentials available
- [ ] SSL certificates configured (or ready to configure)

---

## Backend Deployment (wamapi.vuleits.com)

### Build Phase
- [ ] Run `deploy-backend.bat` (Windows) or `./deploy-backend.sh` (Linux/Mac)
- [ ] Verify `dist/` folder created
- [ ] Verify `prisma/` folder ready

### Configuration
- [ ] Create `.env` file with:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000` (or MatBao assigned port)
  - [ ] `FRONTEND_URL=https://wam.vuleits.com`
  - [ ] `DB2_HOST=localhost`
  - [ ] `DB2_PORT=3306`
  - [ ] `DB2_NAME=vul19326_wam`
  - [ ] `DB2_USER=vul19326_wamadmin`
  - [ ] `DB2_PASSWORD=Wamdmin@2025`
  - [ ] `SESSION_SECRET=random-secret-key`

### Upload Phase
- [ ] Upload `dist/` folder
- [ ] Upload `prisma/` folder
- [ ] Upload `package.json` and `package-lock.json`
- [ ] Upload `.env` file
- [ ] Create `uploads/` folder (if doesn't exist)

### Server Setup
- [ ] SSH into server
- [ ] Run `npm install --production`
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate deploy`
- [ ] Create `uploads/` directory with proper permissions

### Start Application
- [ ] Configure in MatBao Node.js App Manager:
  - [ ] App name: `wamapi`
  - [ ] Start file: `dist/server.js`
  - [ ] Port: `5000`
  - [ ] Environment variables set
- [ ] Start the app
- [ ] Test: `curl https://wamapi.vuleits.com/health`

---

## Frontend Deployment (wam.vuleits.com)

### Build Phase
- [ ] Run `deploy-frontend.bat` (Windows) or `./deploy-frontend.sh` (Linux/Mac)
- [ ] Verify `standalone-build/` folder created
- [ ] Verify `.next/static/` folder exists in standalone-build

### Configuration
- [ ] Create `.env` file with:
  - [ ] `NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com`
  - [ ] `PORT=3000` (or MatBao assigned port)
  - [ ] `NODE_ENV=production`

### Upload Phase
- [ ] Upload entire `standalone-build/` folder
- [ ] Upload `.env` file

### Server Setup
- [ ] SSH into server
- [ ] Navigate to `standalone-build/` directory
- [ ] Run `npm install --production`

### Start Application
- [ ] Configure in MatBao Node.js App Manager:
  - [ ] App name: `wam-frontend`
  - [ ] Start file: `server.js`
  - [ ] Port: `3000`
  - [ ] Environment variables set
- [ ] Start the app
- [ ] Test: Open `https://wam.vuleits.com` in browser

---

## Post-Deployment Verification

### Backend Tests
- [ ] Health check: `https://wamapi.vuleits.com/health`
- [ ] API endpoint accessible
- [ ] CORS headers allow frontend domain
- [ ] Database connection working
- [ ] File uploads directory writable

### Frontend Tests
- [ ] Frontend loads at `https://wam.vuleits.com`
- [ ] No console errors
- [ ] API calls work (check Network tab)
- [ ] Login functionality works
- [ ] Navigation works
- [ ] File uploads work (logo, avatar)
- [ ] All pages accessible

### Integration Tests
- [ ] User can log in
- [ ] Permissions work correctly
- [ ] CRUD operations work
- [ ] Images load correctly
- [ ] Forms submit successfully

---

## Troubleshooting

### Backend Issues
- [ ] Check server logs
- [ ] Verify port is not in use
- [ ] Check database connection
- [ ] Verify CORS configuration
- [ ] Check file permissions

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify API URL is correct
- [ ] Check CORS errors
- [ ] Verify static assets load
- [ ] Check environment variables

---

## Maintenance

### Regular Updates
- [ ] Pull latest code
- [ ] Run `npm install`
- [ ] Run database migrations
- [ ] Rebuild application
- [ ] Restart services
- [ ] Test functionality

### Backup
- [ ] Database backup scheduled
- [ ] Uploads folder backup
- [ ] Environment files backed up

---

## Quick Commands Reference

### Build Commands
```bash
# Build both
npm run build

# Build separately
npm run build:backend
npm run build:frontend

# Deploy scripts
npm run deploy:backend
npm run deploy:frontend
npm run deploy:all
```

### Server Commands
```bash
# Backend
cd /path/to/backend
npm install --production
npx prisma generate
npx prisma migrate deploy
node dist/server.js

# Frontend
cd /path/to/frontend/standalone-build
npm install --production
node server.js
```

---

## Support Contacts

- MatBao Support: [Your support contact]
- Database Host: [Database provider]
- Project Repository: [Git repository URL]

