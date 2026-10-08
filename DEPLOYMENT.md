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

Build the content-hashed JavaScript and CSS assets:
```bash
npm run build
```
This produces immutable, content-hashed bundles in `public/dist/` (e.g., `bundle.[hash].js`) and generates `manifest.json`.

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

- [ ] Storefront loads at `https://camnexbd.com` with valid SSL certificate
- [ ] Admin login works at `/admin` using credentials from `.env`
- [ ] Add to cart -> checkout flow creates an order
- [ ] Image upload generates WebP and thumbnail in `public/uploads/`
- [ ] Security attack test passes: `node scratch/test_security_attacks.js`
- [ ] `robots.txt` and `sitemap.xml` resolve properly with correct canonical URLs
