# Deployment Guide - Reels Dashboard

This guide explains how to deploy the Reels Dashboard to production using Coolify.

## Prerequisites

- VPS with Docker and Coolify installed
- Domain name (e.g., `dashboard.yourdomain.com`)
- Google OAuth credentials
- SSL certificate (Coolify handles this automatically)

## Deployment Steps

### 1. Prepare Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set:
- `DB_PASSWORD` - Secure database password
- `FRONTEND_URL` - Your domain (https://dashboard.yourdomain.com)
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `GOOGLE_REDIRECT_URI` - https://dashboard.yourdomain.com/api/auth/google/callback
- `SESSION_SECRET` - Generate with: `openssl rand -base64 32`
- `ADMIN_EMAIL` - Your Gmail address

### 2. Update Google OAuth Settings

Go to Google Cloud Console → Credentials → OAuth 2.0 Client IDs → Edit

Add to Authorized redirect URIs:
```
https://dashboard.yourdomain.com/api/auth/google/callback
```

### 3. Deploy with Coolify

#### Option A: Deploy from Git Repository (Recommended)

1. Push your code to GitHub/GitLab
2. In Coolify dashboard:
   - Click "New Resource" → "Docker Compose"
   - Select your Git repository
   - Branch: `main`
   - Docker Compose Location: `/reels-dashboard`
   - Set environment variables from `.env.production`
3. Configure domain:
   - Domain: `dashboard.yourdomain.com`
   - Enable SSL (Coolify auto-configures Let's Encrypt)
4. Deploy!

#### Option B: Manual Deployment

1. SCP files to VPS:
```bash
scp -r reels-dashboard/ user@your-vps:/home/user/
```

2. SSH into VPS:
```bash
ssh user@your-vps
cd /home/user/reels-dashboard
```

3. Create `.env.production` file with your values

4. Build and start:
```bash
docker-compose --env-file .env.production up -d --build
```

### 4. Initial Database Setup

After first deployment, run migrations:

```bash
# SSH into backend container
docker exec -it reels-dashboard-backend sh

# Run migrations (Drizzle will auto-create tables)
# Tables are created automatically on first connection
```

### 5. Verify Deployment

1. Visit `https://dashboard.yourdomain.com`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Dashboard should load with empty data

### 6. Add Test Data (Optional)

```bash
# Connect to database
docker exec -it reels-dashboard-db psql -U reels_user -d reels_dashboard

# Run test data SQL (copy from development)
\i /path/to/test_data.sql
```

## Architecture

```
┌─────────────────────────────────────────┐
│     Cloudflare / DNS Provider           │
│     dashboard.yourdomain.com            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     Coolify Reverse Proxy (Traefik)     │
│     SSL Termination (Let's Encrypt)     │
└────────────┬──────────────┬─────────────┘
             │              │
             ▼              ▼
┌─────────────────┐   ┌──────────────────┐
│   Frontend      │   │   Backend        │
│   (Nginx:80)    │   │   (Bun:3001)     │
│   Port: 3000    │   │   Port: 3001     │
└─────────────────┘   └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │   PostgreSQL     │
                      │   Port: 5432     │
                      └──────────────────┘
```

## Health Checks

- Frontend: `https://dashboard.yourdomain.com`
- Backend Health: `https://dashboard.yourdomain.com/api/health`
- Database: Internal only (not exposed)

## Troubleshooting

### Frontend doesn't load
- Check Nginx logs: `docker logs reels-dashboard-frontend`
- Verify build completed: `docker exec reels-dashboard-frontend ls /usr/share/nginx/html`

### Backend errors
- Check logs: `docker logs reels-dashboard-backend`
- Verify database connection: `docker exec reels-dashboard-backend bun run db:push`

### Database connection fails
- Check if PostgreSQL is running: `docker ps | grep postgres`
- Verify credentials in `.env.production`
- Check network: `docker network inspect reels-network`

### OAuth not working
- Verify redirect URI in Google Cloud Console
- Check `GOOGLE_REDIRECT_URI` matches exactly
- Ensure domain uses HTTPS

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose --env-file .env.production up -d --build

# Or in Coolify: Click "Redeploy"
```

## Backup

```bash
# Backup database
docker exec reels-dashboard-db pg_dump -U reels_user reels_dashboard > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i reels-dashboard-db psql -U reels_user reels_dashboard < backup.sql
```

## Monitoring

- Check container status: `docker-compose ps`
- View logs: `docker-compose logs -f`
- Monitor resources: `docker stats`

## Security Checklist

- [ ] Environment variables set securely
- [ ] SSL certificate active (HTTPS)
- [ ] Database password is strong (20+ characters)
- [ ] Session secret is random and unique
- [ ] Google OAuth restricted to production domain
- [ ] Admin email whitelisted correctly
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Regular backups scheduled

## Support

For issues, check:
1. Docker logs
2. Coolify deployment logs
3. Browser console (F12)
4. Network tab for API errors

---

**Deployment Time Estimate:** 20-30 minutes
**First-Time Setup:** Add 10-15 minutes for OAuth configuration
