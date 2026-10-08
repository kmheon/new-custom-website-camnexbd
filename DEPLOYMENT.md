# CamneX Platform — Production Deployment Guide

This guide describes how to deploy, secure, and maintain the CamneX E-Commerce & Business Platform on a Linux server (Ubuntu 22.04 / 24.04 LTS or Debian 12).

---

## 1. System Requirements & Prerequisites

- **Node.js**: `v20.x LTS` or `v22.x LTS` (minimum `v18.18+`)
- **NPM**: `v10.x+`
- **Reverse Proxy**: Nginx with SSL (Let's Encrypt / Certbot)
- **Process Manager**: PM2 or systemd
- **Database**: SQLite 3 with WAL mode (bundled via `better-sqlite3`, no external DB daemon needed)

### Native Build Tools & Library Requirements (`better-sqlite3` & `sharp`)

Both `better-sqlite3` and `sharp` contain platform-native C/C++ bindings. While standard x64 and arm64 Linux systems will download prebuilt binaries during `npm ci`, a C++ compiler toolchain and Python 3 are required for fallback compilation and node-gyp operations.

#### Ubuntu 22.04 / 24.04 LTS or Debian 12:
```bash
# 1. Install Node.js 20 LTS repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Install Node.js, Nginx, and native build dependencies
sudo apt-get update
sudo apt-get install -y nodejs nginx build-essential python3 make g++

# 3. Verify compiler and Node versions
node -v
npm -v
g++ --version
python3 --version
```

#### RHEL / Rocky Linux / AlmaLinux 9:
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3 make gcc-c++
```

#### Alpine Linux (Docker container):
```bash
apk add --no-cache nodejs npm python3 make g++ gcc vips-dev libc6-compat
```

> **Note on glibc and `sharp`**:
> - Precompiled `sharp` binaries require glibc >= 2.29. Ubuntu 20.04+ (glibc 2.31+) and Debian 11+ (glibc 2.31+) satisfy this out of the box.
> - If deploying via a Dockerfile or cross-platform CI runner, run `npm ci` directly inside the target Linux container architecture rather than copying `node_modules` from Windows or macOS.

---

## 2. Project Installation & Environment Configuration

Clone the repository to your deployment directory (e.g., `/var/www/camnexbd`):
```bash
cd /var/www/camnexbd
npm ci --omit=dev
```

### Environment Variables (.env)
Copy the example environment template:
```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` with strong production values:
```ini
# Application Server
PORT=3000
HOST=127.0.0.1
NODE_ENV=production

# Database & Storage
DATABASE_PATH=./camnex.db

# Administrator Initial Credentials (Generated on first run if not in DB)
ADMIN_EMAIL=admin@camnexbd.com
ADMIN_INITIAL_PASSWORD=YourStrongUniqueAdminPasswordHere!

# Security & Sessions
SESSION_SECRET=generate_a_random_64_character_hex_string_here

# Frontend API URL
VITE_API_URL=https://camnexbd.com
```

### Initialize Clean Database (Zero Demo Data)
To initialize a fresh production database without any sample/demo data:
```bash
npm run db:clean
```
This sets up the SQLite schema, registers the initial administrator from `.env`, and leaves all product, order, customer, and quote tables completely clean.

---

## 3. Production Asset Bundling

> **Important**: The `public/dist/` directory contains compiled output and is excluded from git tracking via `.gitignore`. You **must** run the asset compiler on the host machine (or in your CI/CD deployment pipeline) before starting the server.

Build the content-hashed JavaScript and compiled Tailwind CSS assets:
```bash
npm run build
```
This runs `esbuild` for TypeScript/React bundling and `postcss` + `tailwindcss` for style compilation, producing immutable, content-hashed bundles in `public/dist/` (e.g., `bundle.[hash].js` and `bundle.[hash].css`) and writing `manifest.json`.

---

## 4. Process Management

### Option A: Running with PM2 (Recommended)
Install PM2 globally:
```bash
sudo npm install -g pm2
```

Start the application:
```bash
pm2 start server.js --name "camnex" --time
pm2 save
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status
pm2 logs camnex
pm2 restart camnex
```

---

### Option B: Running with systemd
Create a systemd service file at `/etc/systemd/system/camnex.service`:

```ini
[Unit]
Description=CamneX E-Commerce Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/camnexbd
ExecStart=/usr/bin/node /var/www/camnexbd/server.js
Restart=always
RestartSec=5
EnvironmentFile=/var/www/camnexbd/.env
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=camnex

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable camnex
sudo systemctl start camnex
sudo systemctl status camnex
```

---

## 5. Nginx HTTPS Reverse Proxy Configuration

Create an Nginx server block at `/etc/nginx/sites-available/camnexbd.com`:

```nginx
# HTTP - Redirect all traffic to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name camnexbd.com www.camnexbd.com;
    return 301 https://$host$request_uri;
}

# HTTPS - Secure Reverse Proxy
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name camnexbd.com www.camnexbd.com;

    # SSL Certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/camnexbd.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/camnexbd.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload limit (matches application 5 MB cap)
    client_max_body_size 5M;

    # Static assets with long immutable caching
    location /dist/ {
        alias /var/www/camnexbd/public/dist/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Uploads directory
    location /uploads/ {
        alias /var/www/camnexbd/public/uploads/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        access_log off;
    }

    # Reverse proxy to Node.js backend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and obtain SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/camnexbd.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d camnexbd.com -d www.camnexbd.com
sudo systemctl reload nginx
```

### Cloudflare Proxy Configuration (`TRUST_PROXY=2`)

If your domain uses Cloudflare CDN/WAF in front of your Nginx server, incoming HTTP requests traverse **two** reverse proxy hops:
1. Visitor $\to$ **Cloudflare Edge Proxy**
2. Cloudflare $\to$ **Origin Nginx Server**
3. Nginx $\to$ **Node.js Express App (:3000)**

In this dual-proxy setup:
1. In your `.env` file, specify:
   ```ini
   TRUST_PROXY=2
   ```
   This instructs Express to traverse 2 hops back in the `X-Forwarded-For` chain to resolve the true client IP (`req.ip`), ensuring login brute-force rate limits and security logging target the actual visitor rather than the Cloudflare edge IP.
2. In your Nginx configuration, pass the Cloudflare visitor IP header:
   ```nginx
   # Pass Cloudflare real visitor IP
   proxy_set_header X-Real-IP $http_cf_connecting_ip;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```

### Cookie Security Architecture (`SameSite=Lax` vs `SameSite=Strict`)

CamneX implements a dual-cookie defense:
- **`camnex_session` (Session Authentication Cookie)**:
  - Attributes: `HttpOnly: true`, `Secure: true` (in production), `SameSite: 'lax'`, `path: '/'`.
  - **Rationale**: `SameSite=Lax` ensures that authenticated users arriving from external links (such as clicking an order tracking URL from an SMS/email, clicking a bookmark, or returning from an external portal) remain logged in during initial top-level GET navigation. If `SameSite=Strict` were used on the session cookie, external link clicks would fail to send the session cookie, displaying the visitor as logged out until an internal navigation occurred.
- **`camnex_csrf` (CSRF Protection Cookie)**:
  - Attributes: `HttpOnly: true`, `Secure: true` (in production), `SameSite: 'strict'`, `path: '/'`.
  - **Rationale**: The CSRF token is kept strictly isolated. Any state-changing HTTP request (`POST`, `PUT`, `DELETE`, `PATCH`) performed while authenticated must transmit an identical token in the `X-CSRF-Token` header. Because third-party sites cannot read or forge the cookie or custom header, cross-site forgery is fully mitigated.

---

## 6. SQLite Database Backup & Restore

The application includes an automated SQLite backup utility (`scripts/backup_db.js`) that performs a WAL checkpoint (`PRAGMA wal_checkpoint(TRUNCATE)`) and an online backup snapshot, verifying database integrity with `PRAGMA quick_check`.

### Run Backup Manually
```bash
npm run backup
```
Backups are saved to `/var/www/camnexbd/backups/camnex_backup_YYYYMMDD_HHMMSS.db`.

### Set Up Automated Daily Cron Backup
Open root crontab:
```bash
sudo crontab -e
```
Add daily backup at 2:30 AM with automatic purging of backups older than 30 days:
```bash
30 2 * * * cd /var/www/camnexbd && /usr/bin/node scripts/backup_db.js >> /var/log/camnex_backup.log 2>&1
0 3 * * * find /var/www/camnexbd/backups/ -name "camnex_backup_*.db" -type f -mtime +30 -delete
```

### Restore Procedure
To restore from a backup snapshot:

1. **Stop the application**:
   ```bash
   pm2 stop camnex
   # or: sudo systemctl stop camnex
   ```

2. **Replace the live database file with the backup**:
   ```bash
   cp /var/www/camnexbd/backups/camnex_backup_20261009_010504.db /var/www/camnexbd/camnex.db
   # Clean up stale WAL / SHM files if present
   rm -f /var/www/camnexbd/camnex.db-wal /var/www/camnexbd/camnex.db-shm
   ```

3. **Verify permissions**:
   ```bash
   chown -R www-data:www-data /var/www/camnexbd/camnex.db
   ```

4. **Restart the application**:
   ```bash
   pm2 start camnex
   # or: sudo systemctl start camnex
   ```

---

## 7. Post-Deployment Verification Checklist

### 1. Test Login Rate Limiting (Live Production Probe)
Verify that the `loginLimiter` active in production correctly tracks visitor IP and triggers `HTTP 429 Too Many Requests` after 5 failed attempts within 60 seconds:

```bash
# Execute 6 rapid failed login attempts:
for i in {1..6}; do
  echo -n "Attempt $i status: "
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://camnexbd.com/api/auth/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@camnexbd.com","password":"test-rate-limit-wrong-pass"}'
done
```
**Expected Output:**
- Attempts 1–5: `401` (Unauthorized)
- Attempt 6+: `429` (Too Many Requests — "Too many login attempts. Please wait 1 minute before trying again.")

### 2. Verification Checklist
- [ ] Storefront loads cleanly at `https://camnexbd.com` with valid SSL certificate
- [ ] Admin login succeeds at `/admin` using credentials from `.env`
- [ ] Automated platform verification passes: `npm test`
- [ ] Image upload generates WebP and thumbnail in `public/uploads/`
- [ ] Rate limit test returns `429` on 6th failed login attempt
- [ ] `robots.txt` and `sitemap.xml` resolve properly with correct canonical URLs
- [ ] Storefront checkout displays "Payments Not Configured" until admin enables COD or MFS in settings
