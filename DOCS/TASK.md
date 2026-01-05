# TASK MANAGEMENT - Automated Reels Generator Project

**Project:** Automated Split-Screen Instagram Reels Generator + Management Dashboard  
**Status:** Active Development  
**Last Updated:** 2026-01-04  
**Version:** 1.0

---

## Overview

This document tracks all tasks required to complete the automated Instagram Reels generation system. The project consists of two main systems:

1. **Main Automation System** - n8n-based backend for AI video generation and Instagram posting
2. **Management Dashboard** - Modern web interface for approvals, monitoring, and configuration

**Current State:**
- ✅ Dashboard frontend fully built with mock data and animations
- ✅ Dashboard backend code structure complete (untested)
- ⏳ Database not yet configured
- ⏳ Main automation system not yet built
- ⏳ No deployment configuration

---

## Priority Legend

- 🔴 **Critical** - Blocking other tasks, must complete first
- 🟡 **High** - Core functionality, needed soon
- 🟢 **Medium** - Important but not blocking
- 🔵 **Low** - Nice-to-have, can be deferred

---

## PHASE 1: Dashboard Backend Setup & Integration

### Task 1: Database Setup 🔴
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 2-3 hours

- [ ] **Task 1.1:** Install PostgreSQL
  - [ ] Install PostgreSQL 15+ on Ubuntu VPS or via Docker
  - [ ] Create database: `reels_dashboard`
  - [ ] Create database user with appropriate permissions
  - [ ] Test connection: `psql -U username -d reels_dashboard`
  
- [ ] **Task 1.2:** Configure environment variables
  - [ ] Copy `backend/.env.example` to `backend/.env`
  - [ ] Set `DATABASE_URL` with PostgreSQL connection string
  - [ ] Generate secure `SESSION_SECRET` (32+ chars random string)
  - [ ] Add `ADMIN_EMAIL` (your Google account email)
  - [ ] Set `FRONTEND_URL=http://localhost:5173` (dev) or production URL
  - [ ] Verify .env file is in .gitignore

- [ ] **Task 1.3:** Run database migrations
  - [ ] Navigate to `reels-dashboard/backend/`
  - [ ] Run `bun install` to ensure dependencies installed
  - [ ] Run `bun run db:push` to create tables
  - [ ] Verify 9 tables created: users, sessions, instagram_accounts, approvals, notifications, system_logs, settings, analytics_snapshots, workflow_status
  - [ ] Check table schemas match `backend/src/db/schema.ts`

**Validation:**
```bash
# Connect to database and verify tables
psql -U username -d reels_dashboard -c "\dt"
# Should show all 9 tables
```

---

### Task 2: Google OAuth Setup 🔴
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 1-2 hours

- [ ] **Task 2.1:** Create Google Cloud Project
  - [ ] Go to https://console.cloud.google.com/
  - [ ] Create new project: "Reels Dashboard"
  - [ ] Enable Google+ API or Google Identity services
  
- [ ] **Task 2.2:** Configure OAuth consent screen
  - [ ] Set app name: "Reels Management Dashboard"
  - [ ] Add your email as developer contact
  - [ ] Set user type: External (for testing) or Internal (if G Suite)
  - [ ] Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
  - [ ] Add your email to test users
  
- [ ] **Task 2.3:** Create OAuth 2.0 credentials
  - [ ] Create "OAuth 2.0 Client ID"
  - [ ] Application type: Web application
  - [ ] Authorized redirect URIs:
    - Development: `http://localhost:5173/auth/callback`
    - Production: `https://dashboard.sitedomain.com/auth/callback`
  - [ ] Copy Client ID to `backend/.env` as `GOOGLE_CLIENT_ID`
  - [ ] Copy Client Secret to `backend/.env` as `GOOGLE_CLIENT_SECRET`

- [ ] **Task 2.4:** Update frontend OAuth configuration
  - [ ] Open `frontend/src/pages/Login.tsx`
  - [ ] Replace placeholder client ID with real Google Client ID (if hardcoded)
  - [ ] Verify redirect URI matches OAuth settings

**Validation:**
- Test OAuth flow initiates from login page
- Verify redirect to Google consent screen works
- Check callback URL receives authorization code

---

### Task 3: Backend Server Testing 🔴
**Priority:** Critical  
**Dependencies:** Task 1, Task 2  
**Estimated Time:** 2-3 hours

- [ ] **Task 3.1:** Start backend server
  - [ ] Navigate to `reels-dashboard/backend/`
  - [ ] Run `bun run dev`
  - [ ] Verify server starts on port 3001
  - [ ] Check console for any errors
  - [ ] Test health endpoint: `curl http://localhost:3001/health`

- [ ] **Task 3.2:** Test authentication endpoints
  - [ ] Test GET `/api/auth/google` - should redirect to Google
  - [ ] Complete OAuth flow manually
  - [ ] Test GET `/api/auth/me` - should return user or 401
  - [ ] Test POST `/api/auth/logout` - should clear session
  - [ ] Verify session cookie created and persisted

- [ ] **Task 3.3:** Test API routes with dummy data
  - [ ] Manually insert test data into database tables
  - [ ] Test GET `/api/approvals` - should return approvals list
  - [ ] Test GET `/api/accounts` - should return accounts list
  - [ ] Test GET `/api/analytics` - should return analytics data
  - [ ] Test GET `/api/workflows` - should return workflow status
  - [ ] Test GET `/api/logs` - should return system logs
  - [ ] Test GET `/api/settings` - should return settings
  - [ ] Test PATCH `/api/settings` - should update settings

- [ ] **Task 3.4:** Fix any backend issues
  - [ ] Debug authentication middleware issues
  - [ ] Fix CORS configuration if needed
  - [ ] Resolve database query errors
  - [ ] Add error logging where needed
  - [ ] Handle edge cases (null values, missing data)

**Validation:**
```bash
# All endpoints should return valid JSON
curl -X GET http://localhost:3001/api/auth/me
curl -X GET http://localhost:3001/api/approvals
curl -X GET http://localhost:3001/api/accounts
```

---

### Task 4: Frontend-Backend Integration 🟡
**Priority:** High  
**Dependencies:** Task 3  
**Estimated Time:** 2-3 hours

- [ ] **Task 4.1:** Disable mock data mode
  - [ ] Open `frontend/src/lib/mockApi.ts`
  - [ ] Change `const USE_MOCK_DATA = false`
  - [ ] Verify `VITE_API_URL` set in `frontend/.env`
  - [ ] Set to `http://localhost:3001` for development

- [ ] **Task 4.2:** Test real authentication flow
  - [ ] Start frontend: `bun run dev` in frontend directory
  - [ ] Navigate to http://localhost:5173
  - [ ] Click "Sign in with Google"
  - [ ] Complete OAuth flow
  - [ ] Verify redirect to dashboard
  - [ ] Check user info displayed in sidebar
  - [ ] Test logout functionality

- [ ] **Task 4.3:** Test all pages with real API
  - [ ] Overview page - verify stats load
  - [ ] Approvals page - verify pending reels load
  - [ ] Accounts page - verify Instagram accounts load
  - [ ] Analytics page - verify charts render
  - [ ] Workflows page - verify workflow status loads
  - [ ] Logs page - verify system logs display
  - [ ] Settings page - verify settings load and update

- [ ] **Task 4.4:** Handle API errors gracefully
  - [ ] Add error boundaries for crashed components
  - [ ] Display user-friendly error messages
  - [ ] Add retry logic for failed requests
  - [ ] Show loading states during API calls
  - [ ] Handle 401 Unauthorized (redirect to login)
  - [ ] Handle 403 Forbidden (show access denied)
  - [ ] Handle 500 Server Error (show error toast)

- [ ] **Task 4.5:** Test edge cases
  - [ ] Empty state: No approvals pending
  - [ ] Empty state: No accounts connected
  - [ ] Empty state: No logs available
  - [ ] Network offline: Show offline message
  - [ ] Slow API: Verify loading spinners show
  - [ ] Session expiry: Redirect to login

**Validation:**
- All pages load without mock data
- Authentication flow works end-to-end
- Error states display properly
- No console errors in browser

---

### Task 5: WebSocket Real-time Updates 🟢
**Priority:** Medium  
**Dependencies:** Task 3  
**Estimated Time:** 3-4 hours

- [ ] **Task 5.1:** Backend WebSocket setup
  - [ ] Implement WebSocket server in `backend/src/websocket/server.ts`
  - [ ] Add authentication to WebSocket connections
  - [ ] Create notification broadcast function
  - [ ] Add WebSocket upgrade handler to main server
  - [ ] Test WebSocket connection with `wscat` tool

- [ ] **Task 5.2:** Frontend WebSocket client
  - [ ] Create `frontend/src/lib/websocket.ts`
  - [ ] Implement reconnection logic with exponential backoff
  - [ ] Add WebSocket hook: `useWebSocket()`
  - [ ] Connect to backend WebSocket on auth success
  - [ ] Handle incoming messages (notifications, log updates)

- [ ] **Task 5.3:** Real-time notifications
  - [ ] Listen for new approval notifications
  - [ ] Update notification store when message received
  - [ ] Show toast notification for new approvals
  - [ ] Update notification bell badge count
  - [ ] Add sound notification (optional)

- [ ] **Task 5.4:** Real-time log streaming
  - [ ] Stream new log entries to Logs page
  - [ ] Auto-scroll to bottom when new logs arrive
  - [ ] Add "pause auto-scroll" toggle
  - [ ] Limit in-memory logs to last 500 entries

**Validation:**
- WebSocket connects successfully after login
- Notifications appear in real-time
- Logs stream without page refresh
- Reconnection works after disconnect

---

## PHASE 2: Main Automation System Setup

### Task 6: VPS & Infrastructure Setup 🔴
**Priority:** Critical  
**Dependencies:** None  
**Estimated Time:** 3-4 hours

- [ ] **Task 6.1:** VPS provisioning
  - [ ] Confirm VPS specs: Ubuntu 22.04+, 4GB+ RAM, 50GB+ SSD
  - [ ] Update system: `apt update && apt upgrade -y`
  - [ ] Install essential tools: `git curl wget htop`
  - [ ] Configure firewall: `ufw allow 22,80,443,5678/tcp`
  - [ ] Set timezone: `timedatectl set-timezone UTC`

- [ ] **Task 6.2:** Install Node.js 20.x
  - [ ] Add NodeSource repository
  - [ ] Install Node.js: `apt install nodejs`
  - [ ] Verify version: `node --version` (should be 20.x)
  - [ ] Install npm globally: `npm install -g npm@latest`

- [ ] **Task 6.3:** Install PostgreSQL
  - [ ] Install PostgreSQL 15+
  - [ ] Create database: `reels_automation`
  - [ ] Create user with password
  - [ ] Enable remote connections (if needed)
  - [ ] Test connection

- [ ] **Task 6.4:** Install FFmpeg with full codecs
  - [ ] Add PPA for FFmpeg: `add-apt-repository ppa:savoury1/ffmpeg4`
  - [ ] Install FFmpeg: `apt install ffmpeg`
  - [ ] Verify version: `ffmpeg -version` (should be 4.4+)
  - [ ] Test encoding: `ffmpeg -i test.mp4 -c:v libx264 output.mp4`
  - [ ] Install additional codecs if needed

- [ ] **Task 6.5:** Install Docker (for n8n)
  - [ ] Install Docker Engine: `curl -fsSL get.docker.com | sh`
  - [ ] Add user to docker group: `usermod -aG docker $USER`
  - [ ] Install Docker Compose
  - [ ] Verify: `docker --version && docker-compose --version`

**Validation:**
```bash
node --version     # v20.x.x
psql --version     # PostgreSQL 15+
ffmpeg -version    # 4.4+
docker --version   # 20+
```

---

### Task 7: n8n Installation & Configuration 🔴
**Priority:** Critical  
**Dependencies:** Task 6  
**Estimated Time:** 2-3 hours

- [ ] **Task 7.1:** Install n8n via Docker
  - [ ] Create directory: `mkdir -p ~/n8n-data`
  - [ ] Create docker-compose.yml for n8n
  - [ ] Configure environment variables:
    - `N8N_BASIC_AUTH_ACTIVE=true`
    - `N8N_BASIC_AUTH_USER=admin`
    - `N8N_BASIC_AUTH_PASSWORD=<secure_password>`
    - `N8N_HOST=n8n.sitedomain.com`
    - `WEBHOOK_URL=https://n8n.sitedomain.com/`
  - [ ] Start n8n: `docker-compose up -d`
  - [ ] Verify running: `docker ps`

- [ ] **Task 7.2:** Setup n8n database connection
  - [ ] Add PostgreSQL credentials node in n8n
  - [ ] Test connection to `reels_automation` database
  - [ ] Save credentials for reuse

- [ ] **Task 7.3:** Configure reverse proxy (Nginx)
  - [ ] Install Nginx: `apt install nginx`
  - [ ] Create site config: `/etc/nginx/sites-available/n8n`
  - [ ] Enable SSL with Let's Encrypt
  - [ ] Proxy to n8n port (default 5678)
  - [ ] Test config: `nginx -t`
  - [ ] Reload: `systemctl reload nginx`

- [ ] **Task 7.4:** Access n8n web interface
  - [ ] Navigate to https://n8n.sitedomain.com
  - [ ] Login with basic auth credentials
  - [ ] Explore n8n UI and familiarize

**Validation:**
- n8n accessible via domain
- Can create and save workflows
- Database connection works

---

### Task 8: AI Video Generation Integration 🟡
**Priority:** High  
**Dependencies:** Task 7  
**Estimated Time:** 4-6 hours

- [ ] **Task 8.1:** Choose AI video provider
  - [ ] Research options: Luma Dream Machine, Runway Gen-3, Pika
  - [ ] Sign up for API access
  - [ ] Review API documentation
  - [ ] Test API with sample prompts
  - [ ] Check pricing and rate limits

- [ ] **Task 8.2:** Create AI video generation node
  - [ ] Create HTTP Request node in n8n
  - [ ] Configure API endpoint and authentication
  - [ ] Set request body with prompt parameters
  - [ ] Add error handling for API failures
  - [ ] Test with sample prompt

- [ ] **Task 8.3:** Setup video polling/webhook
  - [ ] Implement status polling (if no webhook)
  - [ ] Add wait/retry logic for video generation
  - [ ] Download generated video to VPS
  - [ ] Store video path in database
  - [ ] Verify video file integrity

- [ ] **Task 8.4:** Create prompt generation workflow
  - [ ] Setup Claude API credentials in n8n
  - [ ] Create HTTP Request node for Claude
  - [ ] Design prompt template for video ideas
  - [ ] Parse Claude response to extract:
    - Video prompt for AI generator
    - Instagram caption
    - Hashtags
    - Hook/title
  - [ ] Store generated prompts in database

**Validation:**
```bash
# Verify video file downloaded
ls -lh /path/to/videos/
# Should show .mp4 file with reasonable size
```

---

### Task 9: FFmpeg Video Composition Pipeline 🟡
**Priority:** High  
**Dependencies:** Task 8  
**Estimated Time:** 5-7 hours

- [ ] **Task 9.1:** Create gameplay footage library
  - [ ] Prepare 50+ copyright-free gameplay clips
  - [ ] Standardize format: 1080x1920, MP4, 30fps
  - [ ] Organize in directory: `/var/reels/gameplay/`
  - [ ] Create index/catalog in database
  - [ ] Implement random selection logic

- [ ] **Task 9.2:** Build FFmpeg composition script
  - [ ] Create script: `compose_reel.sh`
  - [ ] Input parameters:
    - AI video path
    - Gameplay video path
    - Output path
    - Audio option (AI audio vs gameplay audio)
  - [ ] FFmpeg command for split-screen:
    - Top 60%: AI generated video (scaled)
    - Bottom 40%: Gameplay video (scaled)
    - Resolution: 1080x1920 (9:16)
    - Duration: 15-60 seconds
    - Audio: From AI video or gameplay
  - [ ] Add progress logging
  - [ ] Verify output file created

- [ ] **Task 9.3:** Integrate FFmpeg into n8n workflow
  - [ ] Create Execute Command node in n8n
  - [ ] Pass video paths as parameters
  - [ ] Capture stdout/stderr for logging
  - [ ] Check exit code for success/failure
  - [ ] Move final video to output directory
  - [ ] Update database with final video path

- [ ] **Task 9.4:** Add video quality checks
  - [ ] Verify resolution: `ffprobe -v error -select_streams v:0 -show_entries stream=width,height`
  - [ ] Check duration matches expected range
  - [ ] Verify audio stream exists
  - [ ] Ensure file size reasonable (5-50MB)
  - [ ] Add retry logic if quality check fails

**Validation:**
```bash
# Test composition script manually
./compose_reel.sh ai_video.mp4 gameplay.mp4 output.mp4
# Check output
ffprobe output.mp4
# Should show 1080x1920, 30fps, with audio
```

---

### Task 10: Instagram Graph API Integration 🟡
**Priority:** High  
**Dependencies:** Task 9  
**Estimated Time:** 4-5 hours

- [ ] **Task 10.1:** Setup Facebook App
  - [ ] Create Facebook App at developers.facebook.com
  - [ ] Add Instagram Graph API product
  - [ ] Request permissions:
    - `instagram_basic`
    - `instagram_content_publish`
    - `pages_read_engagement`
  - [ ] Submit for app review (if required)
  - [ ] Get App ID and App Secret

- [ ] **Task 10.2:** Get Instagram Business Account tokens
  - [ ] Link Instagram Business account to Facebook Page
  - [ ] Use Graph API Explorer to generate token
  - [ ] Exchange short-lived token for long-lived (60 days)
  - [ ] Store token securely in n8n credentials
  - [ ] Setup token refresh automation (before 60 days)

- [ ] **Task 10.3:** Create media container upload flow
  - [ ] POST to `/me/media` with video URL
  - [ ] Required params: `media_type=REELS`, `video_url`, `caption`
  - [ ] Get container ID from response
  - [ ] Poll container status until ready
  - [ ] Handle errors (invalid video, caption too long, etc.)

- [ ] **Task 10.4:** Publish reel workflow
  - [ ] POST to `/me/media_publish` with container ID
  - [ ] Parse response for media ID
  - [ ] Store media ID in database
  - [ ] Log publish timestamp
  - [ ] Handle rate limits (avoid spam detection)

- [ ] **Task 10.5:** Video hosting for Graph API
  - [ ] Setup public web server for video hosting
  - [ ] Configure Nginx to serve videos from `/var/reels/final/`
  - [ ] Ensure HTTPS enabled (Graph API requires HTTPS URLs)
  - [ ] Set proper MIME types: `video/mp4`
  - [ ] Add CORS headers if needed

**Validation:**
```bash
# Test upload to Instagram
curl -X POST "https://graph.facebook.com/v18.0/{ig-user-id}/media" \
  -d "media_type=REELS" \
  -d "video_url=https://yourdomain.com/video.mp4" \
  -d "caption=Test reel" \
  -d "access_token={token}"
```

---

### Task 11: Human Approval Queue Workflow 🟡
**Priority:** High  
**Dependencies:** Task 9, Dashboard backend (Task 3)  
**Estimated Time:** 3-4 hours

- [ ] **Task 11.1:** Create approval records in database
  - [ ] After video composition, insert into `approvals` table
  - [ ] Store: reel ID, video URL, thumbnail, caption, hashtags, status='pending'
  - [ ] Set created_at timestamp
  - [ ] Link to Instagram account

- [ ] **Task 11.2:** Implement approval webhook endpoint
  - [ ] Create endpoint in dashboard backend: `POST /api/webhooks/approval-decision`
  - [ ] Accept: `approval_id`, `status` (approved/rejected), `updated_caption`, `updated_hashtags`
  - [ ] Update approval record in database
  - [ ] Return success/failure response
  - [ ] Add webhook authentication (shared secret)

- [ ] **Task 11.3:** Create approval check node in n8n
  - [ ] Add Wait node or Webhook node
  - [ ] Poll database for approval status every 5 minutes
  - [ ] If status='approved': proceed to publish
  - [ ] If status='rejected': stop workflow and log
  - [ ] If pending >24 hours: send reminder notification

- [ ] **Task 11.4:** Integrate with dashboard
  - [ ] Ensure approvals appear in dashboard Approvals page
  - [ ] Test approve button triggers webhook
  - [ ] Test reject button triggers webhook
  - [ ] Verify caption/hashtag edits saved
  - [ ] Test video preview modal

- [ ] **Task 11.5:** Add notification on new approval
  - [ ] Send Discord webhook notification
  - [ ] Create in-app notification in dashboard
  - [ ] Include: video thumbnail, AI-generated caption, link to approve
  - [ ] Test notifications arrive promptly

**Validation:**
- Generate test video and create approval
- Verify appears in dashboard
- Approve/reject and check n8n workflow proceeds correctly

---

### Task 12: Complete n8n Workflow Integration 🟡
**Priority:** High  
**Dependencies:** Task 8, 9, 10, 11  
**Estimated Time:** 4-6 hours

- [ ] **Task 12.1:** Build main workflow
  - [ ] Create new workflow: "Daily Reels Generator"
  - [ ] Add nodes in sequence:
    1. Cron trigger (daily at 9 AM)
    2. Generate prompt via Claude
    3. Generate AI video (Luma/Runway)
    4. Select random gameplay video
    5. Compose split-screen with FFmpeg
    6. Create approval record
    7. Wait for approval
    8. Upload to Instagram
    9. Log success
  - [ ] Add error handling branches
  - [ ] Test full workflow end-to-end

- [ ] **Task 12.2:** Multi-account support
  - [ ] Add loop node to iterate over accounts
  - [ ] Query active accounts from database
  - [ ] Run workflow for each account sequentially
  - [ ] Add delay between accounts (avoid rate limits)
  - [ ] Log account-specific results

- [ ] **Task 12.3:** Error handling & retry logic
  - [ ] Add Try-Catch nodes around critical steps
  - [ ] Retry failed API calls up to 3 times
  - [ ] Log errors to database system_logs table
  - [ ] Send Discord alert on critical failures
  - [ ] Skip account and continue if unrecoverable error

- [ ] **Task 12.4:** Logging and monitoring
  - [ ] Log workflow start/end times
  - [ ] Log each step completion
  - [ ] Track API costs (AI video, Claude)
  - [ ] Store metrics in analytics_snapshots table
  - [ ] Create daily summary report

**Validation:**
- Run workflow manually and verify all steps complete
- Check logs in dashboard Logs page
- Verify video posted to Instagram
- Test error scenarios (network failure, API error)

---

## PHASE 3: Deployment & Production Setup

### Task 13: Coolify Setup for Dashboard 🟢
**Priority:** Medium  
**Dependencies:** Task 4 (dashboard working)  
**Estimated Time:** 3-4 hours

- [ ] **Task 13.1:** Install Coolify on VPS
  - [ ] Run installation script from coolify.io
  - [ ] Access Coolify UI (default port 3000)
  - [ ] Setup admin account
  - [ ] Configure domain: dashboard.sitedomain.com

- [ ] **Task 13.2:** Create Dockerfiles
  - [ ] Create `frontend/Dockerfile`:
    - Use `oven/bun` as base image
    - Copy package.json and install deps
    - Copy source and run `bun run build`
    - Serve with static server or Nginx
  - [ ] Create `backend/Dockerfile`:
    - Use `oven/bun` as base image
    - Copy package.json and install deps
    - Copy source code
    - Expose port 3001
    - CMD: `bun run start`

- [ ] **Task 13.3:** Create docker-compose.yml
  - [ ] Define services: frontend, backend, postgres
  - [ ] Configure networking between services
  - [ ] Add volume mounts for database persistence
  - [ ] Set environment variables
  - [ ] Add healthchecks

- [ ] **Task 13.4:** Deploy via Coolify
  - [ ] Connect Git repository to Coolify
  - [ ] Configure build settings (use Bun)
  - [ ] Set environment variables in Coolify UI
  - [ ] Configure domain and SSL
  - [ ] Deploy and verify application running

- [ ] **Task 13.5:** Configure production environment
  - [ ] Update `frontend/.env` with production API URL
  - [ ] Set `backend/.env` with production database
  - [ ] Configure CORS for production domain
  - [ ] Setup SSL certificates (Let's Encrypt)
  - [ ] Test HTTPS access

**Validation:**
- Access https://dashboard.sitedomain.com
- Login with Google OAuth
- Verify all features work in production

---

### Task 14: Monitoring & Alerting Setup 🟢
**Priority:** Medium  
**Dependencies:** Task 12, 13  
**Estimated Time:** 3-4 hours

- [ ] **Task 14.1:** Setup Discord webhook alerts
  - [ ] Create Discord server and channel
  - [ ] Generate webhook URL
  - [ ] Store in n8n credentials
  - [ ] Create notification templates:
    - New approval needed
    - Video published successfully
    - Workflow error/failure
    - Daily summary report
  - [ ] Test each alert type

- [ ] **Task 14.2:** Configure system logs
  - [ ] Ensure all n8n workflows log to database
  - [ ] Add log levels: INFO, WARN, ERROR
  - [ ] Include context: account, workflow, timestamp
  - [ ] Implement log rotation (keep last 30 days)
  - [ ] Add log filtering in dashboard

- [ ] **Task 14.3:** Setup uptime monitoring
  - [ ] Use external service (UptimeRobot or similar)
  - [ ] Monitor:
    - Dashboard URL (https://dashboard.sitedomain.com)
    - n8n URL (https://n8n.sitedomain.com)
    - Backend API health endpoint
  - [ ] Configure email alerts for downtime
  - [ ] Set check interval: 5 minutes

- [ ] **Task 14.4:** Database backup automation
  - [ ] Create backup script: `pg_dump reels_automation`
  - [ ] Setup cron job: daily at 2 AM
  - [ ] Store backups in `/var/backups/postgres/`
  - [ ] Implement rotation: keep last 7 days
  - [ ] Test restore process

**Validation:**
```bash
# Test Discord webhook
curl -X POST webhook_url -H "Content-Type: application/json" \
  -d '{"content": "Test alert"}'
# Test backup
pg_restore -d test_db latest_backup.sql
```

---

### Task 15: Production Hardening & Security 🟡
**Priority:** High  
**Dependencies:** Task 13  
**Estimated Time:** 3-4 hours

- [ ] **Task 15.1:** Secure environment variables
  - [ ] Never commit .env files to Git
  - [ ] Use Coolify secret management
  - [ ] Rotate sensitive credentials
  - [ ] Use strong passwords (20+ chars)
  - [ ] Store API keys in n8n credentials vault

- [ ] **Task 15.2:** Configure firewall rules
  - [ ] Only allow ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - [ ] Block direct access to PostgreSQL port (5432)
  - [ ] Block n8n port (5678) - only accessible via Nginx
  - [ ] Setup fail2ban for SSH brute-force protection
  - [ ] Test firewall: `ufw status verbose`

- [ ] **Task 15.3:** Setup SSL/TLS certificates
  - [ ] Install Certbot: `apt install certbot python3-certbot-nginx`
  - [ ] Generate certificates for all domains:
    - dashboard.sitedomain.com
    - n8n.sitedomain.com
    - api.sitedomain.com (if separate)
  - [ ] Configure auto-renewal cron job
  - [ ] Test renewal: `certbot renew --dry-run`

- [ ] **Task 15.4:** Rate limiting and DDoS protection
  - [ ] Configure Nginx rate limiting
  - [ ] Limit requests per IP: 100/minute for API
  - [ ] Add Cloudflare (optional) for DDoS protection
  - [ ] Monitor suspicious traffic

- [ ] **Task 15.5:** Security audit
  - [ ] Review all API endpoints for authentication
  - [ ] Check for SQL injection vulnerabilities
  - [ ] Validate all user inputs
  - [ ] Test CSRF protection
  - [ ] Verify session security (httpOnly, secure, sameSite)
  - [ ] Run security scanner (e.g., OWASP ZAP)

**Validation:**
```bash
# Test SSL
curl -I https://dashboard.sitedomain.com
# Should show: Strict-Transport-Security header

# Test rate limiting
for i in {1..150}; do curl https://api.sitedomain.com/test; done
# Should show 429 Too Many Requests after 100
```

---

## PHASE 4: Advanced Features & Optimization

### Task 16: Multi-Account Management 🟢
**Priority:** Medium  
**Dependencies:** Task 10, 12  
**Estimated Time:** 4-5 hours

- [ ] **Task 16.1:** Account CRUD operations
  - [ ] Create "Add Account" form in dashboard
  - [ ] OAuth flow for each Instagram account
  - [ ] Store account credentials securely
  - [ ] Display all accounts in Accounts page
  - [ ] Add enable/disable toggle per account
  - [ ] Delete account with confirmation

- [ ] **Task 16.2:** Per-account configuration
  - [ ] Posting schedule (time of day)
  - [ ] Frequency (daily, every 2 days, etc.)
  - [ ] Video style preferences
  - [ ] Caption tone/style
  - [ ] Hashtag strategy (trending vs niche)
  - [ ] Auto-approve setting (bypass approval queue)

- [ ] **Task 16.3:** Account rotation in workflow
  - [ ] Implement round-robin or priority-based selection
  - [ ] Respect account-specific schedules
  - [ ] Skip disabled accounts
  - [ ] Handle account-specific errors gracefully

**Validation:**
- Add 3 test accounts
- Verify each gets unique schedule and settings
- Test workflow runs for all active accounts

---

### Task 17: Analytics & Reporting 🟢
**Priority:** Medium  
**Dependencies:** Task 10, Dashboard (Task 4)  
**Estimated Time:** 5-6 hours

- [ ] **Task 17.1:** Fetch Instagram Insights
  - [ ] Create n8n workflow to fetch metrics daily
  - [ ] Use Graph API: `/{media-id}/insights`
  - [ ] Metrics: impressions, reach, likes, comments, shares, saves
  - [ ] Store in `analytics_snapshots` table
  - [ ] Track engagement rate calculation

- [ ] **Task 17.2:** Cost tracking
  - [ ] Log AI video generation cost per reel
  - [ ] Log Claude API cost per prompt
  - [ ] Calculate total monthly spend
  - [ ] Display in analytics dashboard
  - [ ] Add budget alerts (e.g., >$300/month)

- [ ] **Task 17.3:** Performance metrics
  - [ ] Track video generation time
  - [ ] Track upload success rate
  - [ ] Monitor workflow execution time
  - [ ] Calculate automation success rate
  - [ ] Identify bottlenecks

- [ ] **Task 17.4:** Build analytics charts
  - [ ] Engagement over time (line chart)
  - [ ] Cost breakdown (pie chart)
  - [ ] Success rate by account (bar chart)
  - [ ] Top performing reels (table)
  - [ ] Use Recharts library in dashboard

**Validation:**
- Analytics page shows real data
- Charts render correctly
- Metrics update daily automatically

---

### Task 18: Advanced Approval Features 🔵
**Priority:** Low  
**Dependencies:** Task 11  
**Estimated Time:** 3-4 hours

- [ ] **Task 18.1:** Bulk approve/reject
  - [ ] Add checkboxes to approval cards
  - [ ] "Select All" button
  - [ ] "Approve Selected" and "Reject Selected" buttons
  - [ ] Confirmation modal for bulk actions
  - [ ] Process in batch API call

- [ ] **Task 18.2:** Schedule posting time
  - [ ] Add date/time picker to approval modal
  - [ ] Store scheduled time in database
  - [ ] n8n checks scheduled time before posting
  - [ ] Show "Scheduled for..." badge in dashboard
  - [ ] Allow rescheduling

- [ ] **Task 18.3:** Caption and hashtag editing
  - [ ] Inline editing in approval modal
  - [ ] Character count for caption (2,200 limit)
  - [ ] Hashtag suggestions
  - [ ] Preview formatted caption
  - [ ] Save edits with approval

- [ ] **Task 18.4:** Video preview enhancements
  - [ ] Add video player controls (play, pause, seek)
  - [ ] Show video metadata (duration, resolution)
  - [ ] Download video option
  - [ ] Share preview link (authenticated)

**Validation:**
- Bulk approve 5 reels at once
- Schedule a reel for specific time
- Edit caption and verify changes saved

---

### Task 19: Workflow Management UI 🔵
**Priority:** Low  
**Dependencies:** Task 12, Dashboard  
**Estimated Time:** 4-5 hours

- [ ] **Task 19.1:** n8n API integration
  - [ ] Research n8n REST API documentation
  - [ ] Setup API credentials in dashboard backend
  - [ ] Test API calls: list workflows, get status, trigger

- [ ] **Task 19.2:** Workflow status display
  - [ ] Fetch active workflows from n8n
  - [ ] Show: name, status (active/inactive), last run, success rate
  - [ ] Real-time status updates (via WebSocket or polling)
  - [ ] Color-coded status badges

- [ ] **Task 19.3:** Manual workflow triggering
  - [ ] "Run Now" button per workflow
  - [ ] Confirmation modal
  - [ ] API call to n8n to trigger workflow
  - [ ] Show progress indicator
  - [ ] Display result (success/failure)

- [ ] **Task 19.4:** Workflow logs viewer
  - [ ] Fetch execution history from n8n
  - [ ] Display: execution ID, start time, duration, status
  - [ ] Click to view detailed logs
  - [ ] Filter by status (success, error, running)

**Validation:**
- Workflows page shows all n8n workflows
- Manual trigger works and logs appear
- Status updates in real-time

---

### Task 20: Performance Optimization 🔵
**Priority:** Low  
**Dependencies:** All previous tasks  
**Estimated Time:** 4-6 hours

- [ ] **Task 20.1:** Database optimization
  - [ ] Add indexes on frequently queried columns
  - [ ] Optimize slow queries (use EXPLAIN ANALYZE)
  - [ ] Implement database connection pooling
  - [ ] Configure PostgreSQL performance settings
  - [ ] Setup query caching where appropriate

- [ ] **Task 20.2:** Frontend performance
  - [ ] Code splitting with lazy loading
  - [ ] Optimize bundle size (analyze with Vite)
  - [ ] Lazy load heavy components (charts, video player)
  - [ ] Implement virtual scrolling for long lists
  - [ ] Add service worker for offline support

- [ ] **Task 20.3:** API optimization
  - [ ] Implement response caching (Redis optional)
  - [ ] Add pagination to list endpoints
  - [ ] Reduce payload size (only send needed fields)
  - [ ] Compress responses (gzip/brotli)
  - [ ] Optimize database queries (N+1 problem)

- [ ] **Task 20.4:** Video processing optimization
  - [ ] Use FFmpeg hardware acceleration (if available)
  - [ ] Optimize FFmpeg encoding settings for speed
  - [ ] Parallel processing for multiple videos
  - [ ] Pre-scale gameplay footage to avoid runtime scaling
  - [ ] Cache intermediate files

**Validation:**
```bash
# Measure performance
# Frontend: Lighthouse score >90
# API: Response time <200ms
# Video processing: <2 minutes per video
```

---

## PHASE 5: Testing & Documentation

### Task 21: Comprehensive Testing 🟡
**Priority:** High  
**Dependencies:** Most features complete  
**Estimated Time:** 6-8 hours

- [ ] **Task 21.1:** Unit tests (backend)
  - [ ] Setup testing framework (Bun built-in test or Vitest)
  - [ ] Test authentication logic
  - [ ] Test API route handlers
  - [ ] Test database queries
  - [ ] Test utility functions
  - [ ] Aim for >70% code coverage

- [ ] **Task 21.2:** Integration tests
  - [ ] Test complete approval flow (create → approve → post)
  - [ ] Test OAuth flow end-to-end
  - [ ] Test multi-account workflow execution
  - [ ] Test WebSocket notifications
  - [ ] Test error handling paths

- [ ] **Task 21.3:** E2E tests (frontend)
  - [ ] Setup Playwright or Cypress
  - [ ] Test login flow
  - [ ] Test navigation between pages
  - [ ] Test approve/reject actions
  - [ ] Test settings updates
  - [ ] Test analytics charts rendering

- [ ] **Task 21.4:** Manual testing checklist
  - [ ] Test on different browsers (Chrome, Firefox, Safari)
  - [ ] Test on mobile devices (responsive design)
  - [ ] Test with slow network (throttling)
  - [ ] Test edge cases (empty states, errors)
  - [ ] Test accessibility (keyboard navigation, screen readers)

**Validation:**
```bash
# Run all tests
bun test
# All tests should pass
```

---

### Task 22: Documentation 🟡
**Priority:** High  
**Dependencies:** All features complete  
**Estimated Time:** 4-6 hours

- [ ] **Task 22.1:** User documentation
  - [ ] Create user guide for dashboard
  - [ ] Document approval workflow
  - [ ] Explain analytics metrics
  - [ ] Add screenshots and videos
  - [ ] Publish as README or wiki

- [ ] **Task 22.2:** Developer documentation
  - [ ] Document API endpoints (OpenAPI/Swagger)
  - [ ] Explain database schema
  - [ ] Document environment variables
  - [ ] Add architecture diagrams
  - [ ] Code comments for complex logic

- [ ] **Task 22.3:** Deployment documentation
  - [ ] Step-by-step deployment guide
  - [ ] Troubleshooting common issues
  - [ ] Backup and restore procedures
  - [ ] Scaling recommendations
  - [ ] Security best practices

- [ ] **Task 22.4:** n8n workflow documentation
  - [ ] Export workflows as JSON
  - [ ] Document each node purpose
  - [ ] Explain configuration options
  - [ ] Provide import instructions
  - [ ] Add workflow diagrams

**Validation:**
- Follow deployment guide on fresh VPS
- Verify all steps work as documented

---

## PHASE 6: Launch & Maintenance

### Task 23: Production Launch 🟡
**Priority:** High  
**Dependencies:** Task 21, 22  
**Estimated Time:** 2-3 hours

- [ ] **Task 23.1:** Pre-launch checklist
  - [ ] All tests passing
  - [ ] Security audit complete
  - [ ] Backups configured
  - [ ] Monitoring active
  - [ ] Documentation published
  - [ ] SSL certificates valid

- [ ] **Task 23.2:** Soft launch
  - [ ] Enable workflows for 1 account only
  - [ ] Monitor for 3-7 days
  - [ ] Check for errors and issues
  - [ ] Verify Instagram posting works
  - [ ] Gather initial metrics

- [ ] **Task 23.3:** Full launch
  - [ ] Enable all accounts
  - [ ] Announce to team (if applicable)
  - [ ] Monitor closely for first week
  - [ ] Be ready for hotfixes
  - [ ] Collect user feedback

- [ ] **Task 23.4:** Post-launch review
  - [ ] Review metrics after 2 weeks
  - [ ] Identify issues and improvements
  - [ ] Prioritize next features
  - [ ] Document lessons learned

**Validation:**
- System runs autonomously for 1 week
- No critical errors or downtime
- Videos posting daily as expected

---

### Task 24: Ongoing Maintenance 🔵
**Priority:** Low  
**Dependencies:** Production launch  
**Estimated Time:** Ongoing

- [ ] **Task 24.1:** Regular monitoring
  - [ ] Check dashboard daily
  - [ ] Review error logs weekly
  - [ ] Monitor API costs monthly
  - [ ] Track engagement metrics
  - [ ] Respond to alerts promptly

- [ ] **Task 24.2:** Updates and patches
  - [ ] Update dependencies monthly
  - [ ] Apply security patches immediately
  - [ ] Update Node.js/Bun as needed
  - [ ] Refresh Instagram access tokens (before 60 days)
  - [ ] Test updates in staging first

- [ ] **Task 24.3:** Content optimization
  - [ ] Review top-performing content
  - [ ] Adjust prompt templates
  - [ ] Update hashtag strategies
  - [ ] Refresh gameplay footage library
  - [ ] A/B test different styles

- [ ] **Task 24.4:** Capacity planning
  - [ ] Monitor VPS resource usage
  - [ ] Upgrade if CPU/RAM/disk >80%
  - [ ] Scale database if slow queries
  - [ ] Consider CDN for videos
  - [ ] Optimize costs vs performance

---

## Quick Reference: Dependencies Tree

```
CRITICAL PATH (Must complete in order):
Task 1 (Database) → Task 2 (OAuth) → Task 3 (Backend Test) → Task 4 (Frontend Integration)

PARALLEL TRACKS:
Track A: Task 6 (VPS) → Task 7 (n8n) → Task 8 (AI) → Task 9 (FFmpeg) → Task 10 (Instagram)
Track B: Task 5 (WebSocket) [can start after Task 3]
Track C: Task 13 (Deployment) [can start after Task 4]

FINAL INTEGRATION:
Task 11 (Approval Queue) requires: Track A complete + Task 4 complete
Task 12 (Main Workflow) requires: Task 8, 9, 10, 11 complete

POLISH & LAUNCH:
Task 14-15 (Monitoring/Security) → Task 21-22 (Testing/Docs) → Task 23 (Launch)
```

---

## Progress Tracking

**Last Updated:** 2026-01-04

### Summary
- **Total Tasks:** 24 major tasks, ~150+ sub-tasks
- **Estimated Time:** 80-120 hours
- **Completed:** 0%
- **In Progress:** Task 1 (Database Setup)
- **Blocked:** None

### Current Sprint Focus
1. ✅ Task 0: Review documentation (COMPLETE)
2. ⏳ Task 1: Database Setup (IN PROGRESS)
3. ⏳ Task 2: Google OAuth Setup (NEXT)
4. ⏳ Task 3: Backend Server Testing (NEXT)

### Notes
- Dashboard frontend and backend code already built (from previous session)
- Using Bun runtime throughout project
- WSL environment may require workarounds for some tools
- Main automation system (n8n workflows) not yet started

---

## Risk Assessment

### High Risk Items
1. **Instagram API Rate Limits** - May limit posting frequency
   - Mitigation: Implement smart throttling, monitor limits
2. **AI Video Provider Reliability** - API downtime or quota issues
   - Mitigation: Fallback to secondary provider, queue system
3. **FFmpeg Complexity** - Video composition errors
   - Mitigation: Extensive testing, quality checks, fallback options

### Medium Risk Items
1. **OAuth Token Expiry** - Tokens expire, breaking automation
   - Mitigation: Auto-refresh tokens, monitoring alerts
2. **Database Performance** - Slow queries with large datasets
   - Mitigation: Indexing, query optimization, caching
3. **VPS Resource Limits** - Out of memory/CPU
   - Mitigation: Monitor usage, upgrade plan if needed

### Low Risk Items
1. **Frontend Browser Compatibility** - UI issues on older browsers
   - Mitigation: Test on major browsers, graceful degradation
2. **Discord Webhook Failures** - Notifications not sent
   - Mitigation: Retry logic, fallback to email

---

## Success Metrics

### Technical Metrics
- [ ] Automation success rate >95%
- [ ] Video generation time <5 minutes
- [ ] End-to-end workflow <30 minutes
- [ ] Dashboard page load time <2 seconds
- [ ] API response time <200ms
- [ ] Uptime >99.5%

### Business Metrics
- [ ] 1 video posted per day per account
- [ ] API costs within budget ($200-350/month)
- [ ] Engagement rate tracking functional
- [ ] Zero manual intervention needed (post-approval)
- [ ] Support for 5+ Instagram accounts

---

**END OF TASK DOCUMENT**
