# Deployment Guide

This document walks through configuring and deploying **WebApp Manager** on a private Ubuntu server.  
Use it alongside the main `README.md`.

---

## 1. Infrastructure Checklist

| Component | Recommended Spec | Notes |
|-----------|------------------|-------|
| OS        | Ubuntu 22.04 LTS | Ensure SSH access and sudo privileges |
| Node.js   | v24.11.0         | Install via `nvm` to match project engines |
| npm       | ≥ 10.8           | Automatically installed with Node 24 |
| Database  | MySQL 8 / MariaDB 10.6 | Accessible from app host, with TLS if remote |
| Reverse proxy | Nginx or Traefik | Handles HTTPS termination and caching |

Create a dedicated Linux user (e.g. `deploy`) without root login.

---

## 2. Install Base Software

```bash
# update packages
sudo apt update && sudo apt upgrade -y

# install essential tooling
sudo apt install -y build-essential curl git nginx

# install nvm + Node.js
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 24.11.0
nvm alias default 24.11.0

# install PM2 globally for process management
npm install --global pm2
```

---

## 3. Database Provisioning

1. Create a database and user with strict privileges:
   ```sql
   CREATE DATABASE webapp_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'wam_user'@'%' IDENTIFIED BY 'StrongPassword!';
   GRANT ALL PRIVILEGES ON webapp_manager.* TO 'wam_user'@'%';
   FLUSH PRIVILEGES;
   ```
2. Optional: provision a read-only replica (used via `DATABASE_URL_FALLBACK`).
3. Configure the firewall to allow MySQL only from trusted sources.

---

## 4. Application Deployment

### Clone & Install
```bash
cd /var/www
sudo git clone https://github.com/tuanhienvu/WebAppManager.git webapp-manager
sudo chown -R deploy:deploy webapp-manager
cd webapp-manager

npm ci
npx prisma migrate deploy        # apply migrations
npm run seed                     # optional: populate demo data
npm run build                    # production build (standalone output)
```

### Environment Variables
Create `/var/www/webapp-manager/.env`:

```env
NEXT_PUBLIC_API_URL=https://app.yourdomain.com

# Primary DB
DB_HOST=mysql.internal
DB_PORT=3306
DB_NAME=webapp_manager
DB_USER=wam_user
DB_PASSWORD=StrongPassword!

# Optional full Prisma URL alternative
# DATABASE_URL=mysql://wam_user:StrongPassword!@mysql.internal:3306/webapp_manager

# Optional fallback DB (read replica)
# FALLBACK_DB_HOST=mysql-replica.internal
# FALLBACK_DB_NAME=webapp_manager_replica
# FALLBACK_DB_USER=wam_user
# FALLBACK_DB_PASSWORD=ReplicaPassword!
```

> The `src/lib/db-config.ts` helper will assemble `DATABASE_URL` and `DATABASE_URL_FALLBACK` from individual pieces if not provided.

---

## 5. Process Management (PM2)

```bash
# start the app (serves on port 3000 by default)
pm2 start npm --name webapp-manager -- run start

# ensure PM2 restarts on boot
pm2 save
pm2 startup systemd
# follow the printed instruction (sudo env PATH=... pm2 startup ...)
```

Monitor logs with `pm2 logs webapp-manager`.

---

## 6. Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/webapp-manager`:

```nginx
server {
  listen 80;
  server_name app.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/webapp-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS (Let’s Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.yourdomain.com
```

---

## 7. Updating the Application

```bash
cd /var/www/webapp-manager
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart webapp-manager
```

Automate the above with a shell script or CI pipeline.

---

## 8. Backups & Monitoring

- **Database backups:** schedule `mysqldump` or use managed backups.
- **Environment secrets:** store rotated copies securely (e.g. Vault, 1Password).
- **Logs:** tail PM2 logs or ship to a logging service.
- **Health checks:** configure uptime monitoring on `https://app.yourdomain.com/login`.

---

## 9. Troubleshooting

| Symptom | Resolution |
|---------|------------|
| 502 Bad Gateway | Check PM2 status, ensure app listening on port 3000 |
| Prisma connection errors | Confirm DB credentials / network, run `npx prisma migrate deploy` |
| Session expires too quickly | Current policy is 5 minutes; adjust in `src/pages/api/auth/login.ts` |
| Static assets broken | Rebuild with `npm run build` and restart PM2 |

For more assistance, inspect `pm2 logs` or `journalctl -u nginx`.

---

## 10. Optional Enhancements

- Add **fail2ban** for SSH protection.
- Configure **Cloudflare** or another CDN for TLS and caching.
- Use **GitHub Actions** to trigger remote deployments (SSH + PM2 reload).
- Set up **Apt unattended upgrades** for security patches.

---

Deployment complete! Keep the guide updated with any infrastructure-specific steps you adopt. Happy hosting.

