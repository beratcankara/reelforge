# ReelForge Dashboard - Deployment Guide

## Prerequisites

- Ubuntu 22.04 LTS VPS
- Node.js 20.x LTS
- PostgreSQL 15+
- Nginx
- SSL Certificate (Let's Encrypt)
- PM2 (Process Manager)

---

## Deployment Steps

### 1. Clone Repository

```bash
cd /var/lib
git clone https://github.com/beratcankara/reelforge.git
cd reelforge/dashboard
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required .env variables:**
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

SESSION_SECRET=your-super-secret-key-change-this

DB_HOST=localhost
DB_PORT=5432
DB_NAME=n8n_reels
DB_USER=n8n
DB_PASSWORD=your_secure_password

ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me_immediately
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### 4. Create Logs Directory

```bash
mkdir -p /var/lib/reelforge/logs
chmod 755 /var/lib/reelforge/logs
```

### 5. Configure PM2

```bash
# Copy ecosystem config
cp ecosystem.config.example.js ecosystem.config.js

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 6. Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/reelforge

# Edit domain name
sudo nano /etc/nginx/sites-available/reelforge
# Replace "your-domain.com" with your actual domain

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/reelforge /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 7. Setup SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 8. Setup Basic Auth for n8n Editor (Optional)

```bash
# Install htpasswd tool
sudo apt install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Enter password when prompted
```

---

## Verification

### 1. Check Backend Status

```bash
pm2 status
```

Expected output:
```
┌────┬──────────────────┬──────────┬─────────┐
│ id │ name             │ status   │ cpu     │
├────┼──────────────────┼──────────┼─────────┤
│ 0  │ reelforge-api    │ online   │ 0%      │
└────┴──────────────────┴──────────┴─────────┘
```

### 2. Check API Health

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-04T12:00:00.000Z",
  "uptime": 123.456,
  "database": "connected"
}
```

### 3. Access Dashboard

Navigate to: `https://your-domain.com`

**Default credentials:**
- Username: `admin`
- Password: `admin`

⚠️ **IMPORTANT:** Change the password immediately after first login!

---

## Post-Deployment Checklist

- [ ] Dashboard accessible at https://your-domain.com
- [ ] Login works with default credentials
- [ ] Password changed to secure value
- [ ] API health check returns success
- [ ] SSL certificate valid
- [ ] PM2 process running
- [ ] Nginx configuration correct
- [ ] Database connection working

---

## Monitoring & Logs

### View Backend Logs

```bash
pm2 logs reelforge-api
```

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/reelforge_access.log

# Error logs
sudo tail -f /var/log/nginx/reelforge_error.log
```

### View Application Logs

```bash
# Combined logs
tail -f /var/lib/reelforge/logs/combined.log

# Error logs only
tail -f /var/lib/reelforge/logs/error.log
```

---

## Updates & Maintenance

### Update Dashboard

```bash
cd /var/lib/reelforge/dashboard

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
pm2 restart reelforge-api

# Update frontend
cd ../frontend
npm install
npm run build

# Reload nginx
sudo systemctl reload nginx
```

### Restart Backend

```bash
pm2 restart reelforge-api
```

### Stop Backend

```bash
pm2 stop reelforge-api
```

---

## Troubleshooting

### Dashboard Not Loading

1. Check if backend is running:
   ```bash
   pm2 status
   ```

2. Check nginx configuration:
   ```bash
   sudo nginx -t
   ```

3. Check backend logs:
   ```bash
   pm2 logs reelforge-api --lines 100
   ```

### Login Not Working

1. Check session secret in .env
2. Verify database connection
3. Clear browser cookies
4. Check backend logs for errors

### Video Preview Not Working

1. Check video file permissions
2. Verify VIDEO_POOL_DIR path in .env
3. Check nginx video streaming configuration

---

## Security Hardening

1. **Change default admin password**
2. **Use strong SESSION_SECRET** (generate with: `openssl rand -base64 32`)
3. **Enable HTTPS only**
4. **Set up firewall** (only allow 80, 443, 22)
5. **Regular updates**: `apt update && apt upgrade`
6. **Monitor logs regularly**

---

## Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| VPS (4 CPU, 8GB RAM) | $20-40 |
| Domain | $10-15 |
| SSL Certificate | Free (Let's Encrypt) |
| **Total** | **$30-55/month** |
