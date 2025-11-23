@echo off
REM Backend Deployment Script for MatBao (Windows)
echo 🚀 Starting Backend Deployment...

cd backend

REM Install dependencies
echo 📦 Installing dependencies...
call npm install --production

REM Build
echo 🔨 Building backend...
call npm run build

REM Generate Prisma Client
echo 🔧 Generating Prisma Client...
call npx prisma generate

echo ✅ Backend build complete!
echo.
echo 📋 Files to upload to MatBao (wamapi.vuleits.com):
echo    - dist\
echo    - prisma\
echo    - uploads\ (create if doesn't exist)
echo    - package.json
echo    - package-lock.json
echo    - .env (create with production values)
echo.
echo 📝 After uploading, run on server:
echo    npm install --production
echo    npx prisma migrate deploy
echo    node dist/server.js

pause

