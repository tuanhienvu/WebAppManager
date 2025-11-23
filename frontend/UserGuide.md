Deployment Guide: Separating Frontend (FE) and Backend (BE) on Mắt Bão Hosting
🖥️ Frontend (Next.js Static Export)
Source Preparation
Install dependencies:

bash
npm install
npm run build
npm run export
After running npm run export, Next.js generates the out/ directory containing all static assets (HTML, CSS, JS).

Upload & Extraction
Compress the out/ directory into out.zip.

Log in to cPanel/Plesk → File Manager → navigate to httpdocs/wam.

Upload out.zip and Extract its contents directly into httpdocs/wam.

Directory Structure After Extraction
httpdocs/wam/index.html

httpdocs/wam/_next/

Asset directories (images, css, fonts, etc.).

Technical Configuration
No Node.js runtime required: hosting serves static files directly.

For client‑side routing (SPA), add .htaccess to rewrite requests to index.html:

apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
If trailingSlash: true is set in next.config.js, Next.js generates page/index.html for each route, minimizing rewrite complexity.

Running the Frontend
Access https://wam.vuleits.com → the site is immediately available.

Validate navigation across pages and asset loading.

⚙️ Backend (Dedicated API Service)
Deployment Options
PHP/Laravel on Mắt Bão Hosting

Create httpdocs/api or a dedicated subdomain api.vuleits.com.

Upload backend source code.

Extract files, run composer install for dependencies.

Configure .env (database, API keys).

Example endpoint: https://wamapi.vuleits.com/v1/....

Node.js (if hosting supports Node.js)

In cPanel/Plesk → Node.js Application.

Set Document Root: httpdocs/api.

Upload Node.js backend (Express, NestJS, etc.).

Run npm install, npm run build if required.

Define startup file (server.js).

Start application in Production mode.

External Hosting (VPS/Cloud)

Deploy backend to VPS/Cloud (AWS, DigitalOcean, Render, etc.).

Obtain public API URL (e.g., https://wamapi.myservice.com).

Configure frontend to call this API endpoint.

Technical Configuration
CORS: Allow origin https://wam.vuleits.com.

Environment Variables: In frontend, set NEXT_PUBLIC_API_BASE_URL=https://wamapi.vuleits.com.

Security: Do not expose secret API keys in frontend; keep them server‑side.

Running the Backend
PHP: served directly via Apache/Nginx.

Node.js: start via cPanel Node.js Application.

Verify endpoint availability: https://wamapi.vuleits.com/health.

🔗 Connecting FE and BE
In frontend, configure NEXT_PUBLIC_API_BASE_URL to point to backend.

Rebuild frontend if necessary to bake environment variables into the static bundle.

Test API calls from frontend using browser DevTools → Network tab.

✅ Final Checklist
[x] Frontend deployed at wam.vuleits.com (static).

[ ] Backend deployed at api.vuleits.com or external service.

[ ] CORS configured to allow origin wam.vuleits.com.

[ ] API calls tested successfully from frontend to backend.