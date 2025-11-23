@echo off
REM Frontend Deployment Script for MatBao (Windows)
echo 🚀 Starting Frontend Deployment...
echo.
echo Choose deployment method:
echo [1] Static Export (Recommended - No Node.js required)
echo [2] Standalone Server (Node.js required)
echo.
set /p choice="Enter choice (1 or 2): "

cd frontend

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Set production API URL
set NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com

if "%choice%"=="1" goto :static_export
if "%choice%"=="2" goto :standalone
echo Invalid choice. Exiting.
pause
exit /b 1

:static_export
echo.
echo 🔨 Building static export...
call npm run build:export

echo ✅ Static export build complete!
echo.
echo 📋 Files to upload to MatBao (wam.vuleits.com):
echo    - Upload ALL contents of frontend\out\ folder to web root
echo    - Configure .htaccess or Nginx for SPA routing
echo    - No Node.js server needed!
goto :end

:standalone
echo.
echo 🔨 Building standalone server...
call npm run build

echo 📦 Preparing standalone build...
if exist standalone-build rmdir /s /q standalone-build
mkdir standalone-build
xcopy /E /I /Y .next\standalone\* standalone-build\
xcopy /E /I /Y .next\static standalone-build\.next\static
xcopy /E /I /Y public standalone-build\public
copy package.json standalone-build\

echo ✅ Standalone build complete!
echo.
echo 📋 Files to upload to MatBao (wam.vuleits.com):
echo    - standalone-build\ (entire folder)
echo.
echo 📝 After uploading, run on server:
echo    cd standalone-build
echo    npm install --production
echo    node server.js

:end
echo.
pause

