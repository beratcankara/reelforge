# Implementation Plan: Automated Split-Screen Instagram Reels Generator

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-01-04  
**Reference Documents:** PRD-Automated-Reels-Generator.md, Architecture.md

---

## 1. Purpose & Scope

### 1.1 Purpose
This Implementation Plan defines the technical execution roadmap for building an automated Instagram Reels generator that creates daily split-screen videos (60% AI-generated content, 40% gameplay footage) and publishes them via Instagram Graph API using n8n workflow automation.

### 1.2 Scope
**In Scope:**
- VPS infrastructure setup with n8n, FFmpeg, PostgreSQL
- AI video generation integration (Luma/Pika/Runway)
- Prompt and caption generation using Claude API
- FFmpeg-based video composition pipeline
- Instagram Graph API integration for posting
- Human approval queue workflow
- Multi-account support architecture
- Cron-based daily automation
- Logging and error handling

**Out of Scope:**
- Analytics dashboard (Phase 2)
- Cross-platform posting (TikTok, YouTube Shorts)
- Real-time engagement optimization
- Machine learning model training

### 1.3 Success Criteria
- System automatically generates and posts 1 video/day per account
- >95% automation success rate
- Video generation completes in <5 minutes
- End-to-end process (trigger to post) <30 minutes
- Zero manual intervention required after approval

---

## 2. Assumptions & Constraints

### 2.1 Assumptions
- Instagram Business accounts are pre-configured with Graph API access
- Facebook App has been approved for content publishing scope
- Access tokens are long-lived (60 days) and auto-renewable
- Copyright-free gameplay footage library (50+ clips) is available
- AI video API provider has been selected and tested
- Budget allocated: $200-350/month for API costs
- VPS provider selected with sufficient resources (4 CPU, 8GB RAM)

### 2.2 Constraints
- Instagram API rate limits: 25 uploads/hour, 200 API calls/hour
- AI video generation time: 2-5 minutes per video
- Video file size: <100MB per Reel
- Maximum video duration: 30 seconds (Instagram requirement)
- FFmpeg processing must complete in <90 seconds
- Daily execution window: 09:00-10:00 (configurable per account)
- Human approval required before posting (Phase 1)

### 2.3 Technical Dependencies
- n8n version: Latest stable (self-hosted)
- Node.js: 20.x LTS
- FFmpeg: 6.x+
- PostgreSQL: 15+
- Claude API: 3.5 Sonnet
- Video API: Luma Dream Machine (primary), Pika Labs (fallback)

---

## 3. High-Level Phases

```
Phase 0: Environment Setup          [Week 1]      ███████████░░░░░░░░░  60%
Phase 1: Core Infrastructure        [Week 1-2]    ███████████░░░░░░░░░  60%
Phase 2: Video Generation Pipeline  [Week 2-3]    ████████░░░░░░░░░░░░  40%
Phase 3: Instagram Integration      [Week 3-4]    ████░░░░░░░░░░░░░░░░  20%
Phase 4: Automation & Orchestration [Week 4]      ██░░░░░░░░░░░░░░░░░░  10%
Phase 5: Testing & Validation       [Week 4-5]    ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Deployment & Monitoring    [Week 5]      ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 4. Detailed Work Breakdown Structure

### Phase 0: Environment Setup
**Duration:** 3 days  
**Objective:** Provision and configure VPS infrastructure

#### 0.1 VPS Provisioning
- 0.1.1 Select VPS provider (DigitalOcean/Hetzner/Vultr)
- 0.1.2 Create Ubuntu 22.04 LTS droplet (4 CPU, 8GB RAM, 100GB SSD)
- 0.1.3 Configure SSH key-based authentication
- 0.1.4 Set up firewall rules (ports: 22, 80, 443)
- 0.1.5 Configure hostname and DNS records

#### 0.2 Base System Configuration
- 0.2.1 Update system packages: `apt update && apt upgrade -y`
- 0.2.2 Install Node.js 20.x LTS via NodeSource repository
- 0.2.3 Install PostgreSQL 15: `apt install postgresql postgresql-contrib`
- 0.2.4 Install FFmpeg 6.x: `apt install ffmpeg`
- 0.2.5 Install Nginx: `apt install nginx`
- 0.2.6 Install PM2 globally: `npm install -g pm2`
- 0.2.7 Install n8n globally: `npm install -g n8n`

#### 0.3 User & Directory Setup
- 0.3.1 Create `n8n` system user: `useradd -m -s /bin/bash n8n`
- 0.3.2 Create directory structure:
  - `/var/lib/n8n` (n8n data)
  - `/var/lib/n8n/videos/{temp,pool,output}` (video storage)
  - `/etc/n8n/secrets` (credentials)
  - `/var/log/n8n` (logs)
- 0.3.3 Set ownership: `chown -R n8n:n8n /var/lib/n8n`
- 0.3.4 Set permissions: `chmod 700 /etc/n8n/secrets`

#### 0.4 SSL & Reverse Proxy
- 0.4.1 Install Certbot: `apt install certbot python3-certbot-nginx`
- 0.4.2 Obtain SSL certificate: `certbot --nginx -d your-domain.com`
- 0.4.3 Configure Nginx for n8n webhook endpoint (port 5678 → 443)
- 0.4.4 Set up Nginx basic auth for n8n editor access
- 0.4.5 Test SSL configuration: `nginx -t && systemctl reload nginx`

**Deliverable:** Fully configured VPS with all dependencies installed

---

### Phase 1: Core Infrastructure
**Duration:** 5 days  
**Objective:** Set up database, n8n, and gameplay video pool

#### 1.1 Database Setup
- 1.1.1 Create PostgreSQL database: `createdb n8n_reels`
- 1.1.2 Create database user with password
- 1.1.3 Execute schema creation script:
  - Table: `instagram_accounts` (credentials, config)
  - Table: `generated_reels` (content log, metadata)
  - Table: `gameplay_videos` (video pool inventory)
  - Table: `approval_queue` (pending approvals)
  - Table: `api_usage_logs` (cost tracking)
- 1.1.4 Create indexes: `created_at`, `account_id`, `status`
- 1.1.5 Test connection from n8n user account
- 1.1.6 Configure automated daily backups via cron

#### 1.2 n8n Installation & Configuration
- 1.2.1 Create n8n environment file: `/etc/n8n/.env`
  - Set `N8N_HOST`, `N8N_PORT`, `N8N_PROTOCOL`
  - Set `WEBHOOK_URL` for Instagram callbacks
  - Configure basic auth credentials
- 1.2.2 Create PM2 ecosystem config: `ecosystem.config.js`
- 1.2.3 Start n8n via PM2: `pm2 start ecosystem.config.js`
- 1.2.4 Configure PM2 auto-restart on boot: `pm2 startup && pm2 save`
- 1.2.5 Verify n8n accessible at `https://your-domain.com/n8n/`
- 1.2.6 Set up n8n credentials store (PostgreSQL)

#### 1.3 Gameplay Video Pool Setup
- 1.3.1 Create storage structure:
  - `/var/lib/n8n/videos/pool/subway-surfers/high-energy/`
  - `/var/lib/n8n/videos/pool/subway-surfers/medium-energy/`
  - `/var/lib/n8n/videos/pool/gta5-parkour/chill/`
  - `/var/lib/n8n/videos/pool/gta5-parkour/intense/`
- 1.3.2 Source 50+ copyright-free gameplay clips (15-30s each)
- 1.3.3 Normalize videos to 1080x1920, 30fps, MP4/H.264 format
- 1.3.4 Insert video metadata into `gameplay_videos` table
- 1.3.5 Create selection script: `get-random-gameplay.js`
- 1.3.6 Test random selection query with mood filter

#### 1.4 API Configuration
- 1.4.1 Store Claude API key in `/etc/n8n/secrets/claude_api_key.txt`
- 1.4.2 Store Video API credentials in `/etc/n8n/secrets/video_api_keys.json`
- 1.4.3 Encrypt Instagram tokens using AES-256-GCM
- 1.4.4 Create n8n credentials for all external APIs
- 1.4.5 Test API connectivity for each service
- 1.4.6 Set up API usage tracking in `api_usage_logs` table

**Deliverable:** Database schema, n8n running, 50+ gameplay videos ready, API credentials configured

---

### Phase 2: Video Generation Pipeline
**Duration:** 7 days  
**Objective:** Build AI video generation and FFmpeg composition workflow

#### 2.1 Story Prompt Generation
- 2.1.1 Create n8n sub-workflow: `generate-story-prompt`
- 2.1.2 Add HTTP Request node for Claude API
- 2.1.3 Build prompt template for story generation:
  ```
  Generate a 15-30 second video concept for {content_theme}.
  Requirements: {visual_style}, {mood}, ending with {hook_type}.
  Avoid repetition from: {previous_prompts}.
  Return JSON: {"prompt": "...", "visual_style": "...", "duration": 20}
  ```
- 2.1.4 Add Function node to validate prompt output
- 2.1.5 Store generated prompts in database to track uniqueness
- 2.1.6 Test with 10 sample themes (humor, storytelling, motivation)

#### 2.2 AI Video Generation Integration
- 2.2.1 Create n8n sub-workflow: `generate-ai-video`
- 2.2.2 Implement HTTP Request node for Luma API:
  - POST `/generation` with prompt and duration
  - Extract `job_id` from response
- 2.2.3 Add polling loop (every 10s) to check generation status
- 2.2.4 Implement timeout handling (5 min max wait)
- 2.2.5 Add fallback provider switch (Pika Labs) on primary failure
- 2.2.6 Download generated video to `/var/lib/n8n/videos/temp/`
- 2.2.7 Validate video metadata (duration, resolution, format)
- 2.2.8 Test end-to-end generation with 5 sample prompts

#### 2.3 FFmpeg Video Composition
- 2.3.1 Create shell script: `/usr/local/bin/compose-videos.sh`
  ```bash
  #!/bin/bash
  TOP_VIDEO="$1"
  BOTTOM_VIDEO="$2"
  OUTPUT="$3"
  
  ffmpeg -i "$TOP_VIDEO" -i "$BOTTOM_VIDEO" \
    -filter_complex "\
      [0:v]scale=1080:1152,crop=1080:1152[top];\
      [1:v]scale=1080:768,crop=1080:768[bottom];\
      [top][bottom]vstack[v];\
      [0:a]volume=1.0[audio]" \
    -map "[v]" -map "[audio]" \
    -c:v libx264 -preset medium -crf 23 \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    -shortest "$OUTPUT"
  ```
- 2.3.2 Create Node.js wrapper: `services/video-composer.js`
- 2.3.3 Add n8n Execute Command node to call FFmpeg script
- 2.3.4 Implement error handling for FFmpeg failures
- 2.3.5 Add video quality validation (bitrate, resolution check)
- 2.3.6 Test composition with 10 different video pairs
- 2.3.7 Measure average processing time (target: <90s)

#### 2.4 Caption & Hashtag Generation
- 2.4.1 Create n8n sub-workflow: `generate-caption`
- 2.4.2 Add HTTP Request node for Claude API
- 2.4.3 Build caption prompt template:
  ```
  Create Instagram Reel caption for video about: {story_prompt}
  Theme: {account_theme}
  Requirements: 1-2 sentences, engaging hook, 1-2 emojis, 10-15 hashtags
  Return JSON: {"caption": "...", "hashtags": ["#tag1", "#tag2", ...]}
  ```
- 2.4.4 Add Function node to validate caption length (<125 chars)
- 2.4.5 Implement hashtag diversity check (avoid repetition)
- 2.4.6 Test caption generation for 10 sample stories

#### 2.5 Integration Testing
- 2.5.1 Create end-to-end test workflow: `test-video-pipeline`
- 2.5.2 Run full pipeline: prompt → video → compose → caption
- 2.5.3 Measure total execution time (target: <5 min)
- 2.5.4 Validate output video format (1080x1920, MP4, <100MB)
- 2.5.5 Check caption + hashtags formatting
- 2.5.6 Document any failures and fix blocking issues

**Deliverable:** Working video generation pipeline producing final MP4 with captions

---

### Phase 3: Instagram Integration
**Duration:** 5 days  
**Objective:** Implement Instagram Graph API posting with approval queue

#### 3.1 Instagram App Configuration
- 3.1.1 Create Facebook Developer App
- 3.1.2 Add Instagram Graph API product
- 3.1.3 Configure app scopes:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`
- 3.1.4 Generate long-lived access tokens for each account
- 3.1.5 Test token validity: `GET /me?fields=id,username`
- 3.1.6 Implement token refresh logic (expires in 60 days)
- 3.1.7 Store encrypted tokens in database

#### 3.2 Instagram Account Management
- 3.2.1 Insert account records into `instagram_accounts` table
- 3.2.2 Configure per-account settings:
  - `content_theme` (humor, storytelling, etc.)
  - `posting_timezone` (America/New_York, etc.)
  - `optimal_posting_time` (09:00, 18:00, etc.)
- 3.2.3 Create n8n workflow node to fetch active accounts
- 3.2.4 Test multi-account iteration logic

#### 3.3 Custom Web Dashboard (Approval Interface)
- 3.3.1 Set up Express.js backend server (port 3001)
  - Install dependencies: express, cors, pg, helmet, winston
  - Configure PostgreSQL connection pool
  - Set up session-based authentication
- 3.3.2 Create API endpoints:
  - `POST /api/auth/login` - User authentication
  - `GET /api/approvals` - List pending approvals
  - `GET /api/approvals/:id` - Get single approval details
  - `POST /api/approvals/:id/approve` - Approve video
  - `POST /api/approvals/:id/reject` - Reject video
  - `PUT /api/approvals/:id/edit` - Edit caption/hashtags
  - `GET /api/accounts` - Manage Instagram accounts
  - `GET /api/stats/overview` - Dashboard statistics
  - `GET /api/videos/:id` - Stream video for preview
- 3.3.3 Build React.js frontend:
  - Create pages: Login, Dashboard, Approvals, Accounts, Statistics
  - Components: ApprovalCard, VideoPreview, AccountList, StatsGrid
  - State management: Zustand for auth/app state
  - Styling: Tailwind CSS with custom dark theme
- 3.3.4 Dashboard features:
  - Video preview with HTML5 video player
  - Approve/Reject buttons with confirmation
  - Caption and hashtag editing
  - Account management (add/remove/toggle)
  - Real-time statistics overview
  - Recent activity log
- 3.3.5 Configure Nginx reverse proxy:
  - Serve React build on `/`
  - Proxy API requests to backend on `/api/`
  - Enable HTTPS with SSL certificate
  - Set up basic auth for n8n editor
- 3.3.6 Deployment:
  - Build React frontend (`npm run build`)
  - Start backend with PM2
  - Configure SSL with Let's Encrypt
  - Test end-to-end approval flow

#### 3.4 Instagram Posting Workflow
- 3.4.1 Create n8n sub-workflow: `post-to-instagram`
- 3.4.2 Implement container creation:
  - POST `/{ig-user-id}/media`
  - Payload: `video_url`, `caption`, `media_type: REELS`
  - Extract `container_id`
- 3.4.3 Add polling loop for upload status:
  - GET `/{container-id}?fields=status_code`
  - Wait until `status_code: FINISHED`
- 3.4.4 Implement container publishing:
  - POST `/{ig-user-id}/media_publish`
  - Payload: `creation_id: {container_id}`
  - Extract `media_id` and `permalink`
- 3.4.5 Log success to `generated_reels` table
- 3.4.6 Delete temporary files from `/var/lib/n8n/videos/temp/`

#### 3.5 Error Handling
- 3.5.1 Implement rate limit detection (HTTP 429)
- 3.5.2 Add exponential backoff retry logic (3 attempts)
- 3.5.3 Handle token expiration (HTTP 190) with auto-refresh
- 3.5.4 Catch video validation errors (too large, wrong format)
- 3.5.5 Store failure details in `generated_reels.error_message`
- 3.5.6 Send alert notification on critical failures

#### 3.6 Testing
- 3.6.1 Test video upload with single account
- 3.6.2 Verify Reel appears on Instagram profile
- 3.6.3 Test approval queue with 3 pending videos
- 3.6.4 Simulate rate limit and validate backoff
- 3.6.5 Test multi-account posting (2 accounts)

**Deliverable:** Functional Instagram posting pipeline with approval queue

---

### Phase 4: Automation & Orchestration
**Duration:** 4 days  
**Objective:** Build master workflow and cron scheduling

#### 4.1 Master Workflow Creation
- 4.1.1 Create n8n workflow: `daily-reels-generator`
- 4.1.2 Add Cron Trigger node (daily at 09:00 UTC)
- 4.1.3 Implement account fetcher:
  - Query `instagram_accounts` WHERE `is_active = true`
  - Order by `optimal_posting_time`
- 4.1.4 Add Loop Over Items node for account iteration
- 4.1.5 Call sub-workflows for each account:
  - `generate-story-prompt`
  - `generate-ai-video`
  - Select random gameplay video
  - Composite videos (FFmpeg)
  - `generate-caption`
  - `add-to-approval-queue`
- 4.1.6 Add concurrency control (max 3 accounts in parallel)
- 4.1.7 Implement timeout per account (3600s)

#### 4.2 Workflow Orchestration
- 4.2.1 Create execution summary aggregator
- 4.2.2 Log workflow start/end times to database
- 4.2.3 Calculate success rate: `(successful_posts / total_accounts)`
- 4.2.4 Send daily summary notification (Discord/Email)
- 4.2.5 Implement failure recovery: skip failed account, continue to next

#### 4.3 Cron Configuration
- 4.3.1 Configure n8n Cron Trigger with timezone awareness
- 4.3.2 Add workflow execution locking (prevent overlap)
- 4.3.3 Set up fallback manual trigger webhook
- 4.3.4 Test cron execution at specified time
- 4.3.5 Validate workflow completes within 1 hour window

#### 4.4 Approval Automation
- 4.4.1 Create scheduled workflow: `process-approved-posts`
- 4.4.2 Run every 30 minutes to check for approved items
- 4.4.3 Query `approval_queue` WHERE `status = 'approved'`
- 4.4.4 Call `post-to-instagram` for each approved item
- 4.4.5 Update queue status to 'posted' on success
- 4.4.6 Clean up videos older than 7 days

#### 4.5 Testing
- 4.5.1 Dry run master workflow with 1 account
- 4.5.2 Test with 3 accounts (different themes)
- 4.5.3 Simulate partial failure (1 account fails, others succeed)
- 4.5.4 Verify cron trigger fires correctly
- 4.5.5 Measure total execution time (should be <30 min for 3 accounts)

**Deliverable:** Fully automated daily workflow with multi-account support

---

### Phase 5: Testing & Validation
**Duration:** 4 days  
**Objective:** Comprehensive testing and quality assurance

#### 5.1 Unit Testing
- 5.1.1 Test story prompt generation (10 variations)
- 5.1.2 Test AI video API integration (primary and fallback)
- 5.1.3 Test FFmpeg composition with edge cases:
  - Different aspect ratios
  - Missing audio in top video
  - Duration mismatch (15s top, 30s bottom)
- 5.1.4 Test caption generation with various themes
- 5.1.5 Test Instagram API error handling scenarios

#### 5.2 Integration Testing
- 5.2.1 Run full pipeline 10 times with different accounts
- 5.2.2 Validate video quality consistency
- 5.2.3 Test approval queue workflow end-to-end
- 5.2.4 Verify database logging accuracy
- 5.2.5 Check file cleanup after posting

#### 5.3 Load Testing
- 5.3.1 Test 5 accounts in parallel
- 5.3.2 Measure database connection pool usage
- 5.3.3 Monitor VPS resource consumption (CPU, RAM, disk I/O)
- 5.3.4 Validate no memory leaks after 24-hour run
- 5.3.5 Test recovery after VPS restart

#### 5.4 Security Testing
- 5.4.1 Verify API credentials encryption at rest
- 5.4.2 Test HTTPS certificate configuration
- 5.4.3 Validate firewall rules (only 22, 80, 443 open)
- 5.4.4 Check file permissions on sensitive directories
- 5.4.5 Test SSH key-only authentication

#### 5.5 Performance Validation
- 5.5.1 Measure average video generation time (<5 min)
- 5.5.2 Measure FFmpeg composition time (<90s)
- 5.5.3 Measure Instagram upload time (<2 min)
- 5.5.4 Calculate end-to-end latency (trigger → approval ready)
- 5.5.5 Document performance baseline metrics

#### 5.6 User Acceptance Testing
- 5.6.1 Review 20 generated videos for quality
- 5.6.2 Validate captions are contextually relevant
- 5.6.3 Check hashtag diversity and relevance
- 5.6.4 Verify split-screen composition is visually clean
- 5.6.5 Confirm videos meet Instagram content guidelines

**Deliverable:** Test report with pass/fail status and performance metrics

---

### Phase 6: Deployment & Monitoring
**Duration:** 3 days  
**Objective:** Production deployment and monitoring setup

#### 6.1 Production Deployment
- 6.1.1 Create deployment checklist document
- 6.1.2 Back up database: `pg_dump n8n_reels > backup.sql`
- 6.1.3 Enable n8n production mode in environment
- 6.1.4 Activate master workflow with cron trigger
- 6.1.5 Monitor first automated run (09:00 next day)
- 6.1.6 Validate first post successfully published to Instagram

#### 6.2 Logging & Monitoring
- 6.2.1 Configure n8n execution logs retention (30 days)
- 6.2.2 Set up log rotation for system logs:
  - `/var/log/n8n/error.log` (rotate daily)
  - `/var/log/nginx/access.log` (rotate weekly)
- 6.2.3 Create monitoring dashboard (optional: Grafana)
  - Workflow execution count
  - Success/failure rate
  - API response times
  - Disk usage trend
- 6.2.4 Set up alerting rules:
  - Alert if workflow fails 3 times in a row
  - Alert if disk usage >80%
  - Alert if API budget >90% of monthly limit

#### 6.3 Backup Strategy
- 6.3.1 Configure daily PostgreSQL backups via cron
  ```bash
  0 2 * * * pg_dump n8n_reels | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
  ```
- 6.3.2 Set up weekly backup of gameplay video pool
- 6.3.3 Configure backup retention (keep 14 days)
- 6.3.4 Test database restore procedure
- 6.3.5 Document backup/restore process

#### 6.4 Documentation
- 6.4.1 Create operations runbook:
  - How to add new Instagram account
  - How to manually approve/reject video
  - How to trigger manual workflow run
  - How to check workflow execution logs
  - How to restart n8n service
- 6.4.2 Document troubleshooting procedures:
  - FFmpeg composition failure
  - Instagram API errors
  - Token expiration handling
  - Disk space cleanup
- 6.4.3 Create API cost tracking spreadsheet
- 6.4.4 Document workflow architecture diagram

#### 6.5 Handoff & Training
- 6.5.1 Conduct system walkthrough session
- 6.5.2 Demonstrate approval queue workflow
- 6.5.3 Show how to monitor daily execution
- 6.5.4 Review emergency procedures
- 6.5.5 Transfer credentials securely

**Deliverable:** Production system operational with monitoring and documentation

---

## 5. Dependencies & Execution Order

### 5.1 Critical Path
```
Phase 0 (VPS Setup)
    ↓
Phase 1.1 (Database) → Phase 1.2 (n8n) → Phase 1.3 (Video Pool)
    ↓
Phase 2.1 (Prompt Gen) → Phase 2.2 (AI Video) → Phase 2.3 (FFmpeg) → Phase 2.4 (Caption)
    ↓
Phase 3.1 (Instagram App) → Phase 3.3 (Approval Queue) → Phase 3.4 (Posting)
    ↓
Phase 4.1 (Master Workflow) → Phase 4.3 (Cron)
    ↓
Phase 5 (Testing) → Phase 6 (Deployment)
```

### 5.2 Parallel Work Opportunities
- Phase 1.3 (Video Pool) can run parallel to Phase 1.1-1.2
- Phase 2.1 and Phase 2.4 can be developed simultaneously
- Phase 3.1 (Instagram setup) can start during Phase 2

### 5.3 External Dependencies
| Dependency | Required By | Lead Time | Risk Level |
|------------|-------------|-----------|------------|
| Facebook App Approval | Phase 3.1 | 3-7 days | Medium |
| AI Video API Access | Phase 2.2 | 1-2 days | Low |
| Claude API Key | Phase 2.1 | <1 day | Low |
| VPS Provisioning | Phase 0.1 | <1 hour | Low |
| SSL Certificate | Phase 0.4 | <30 min | Low |
| Gameplay Footage | Phase 1.3 | 2-3 days | Medium |

### 5.4 Blocking Risks
- **Instagram App Rejection:** If Facebook rejects app, must pivot to alternative posting service (Ayrshare)
- **AI Video API Quota:** If API provider limits access, switch to fallback provider
- **VPS Performance:** If VPS underpowered, upgrade to higher tier immediately

---

## 6. Milestones & Deliverables

| Milestone | Completion Criteria | Target Date | Status |
|-----------|---------------------|-------------|--------|
| **M1: Infrastructure Ready** | VPS configured, n8n running, database created | End of Week 1 | Pending |
| **M2: Video Pipeline Functional** | Can generate AI video, composite with gameplay, output final MP4 | End of Week 2 | Pending |
| **M3: Instagram Posting Works** | Successfully posted 1 test Reel to Instagram | End of Week 3 | Pending |
| **M4: Automation Complete** | Master workflow runs daily via cron, multi-account support | End of Week 4 | Pending |
| **M5: Production Ready** | All tests passed, monitoring active, documentation complete | End of Week 5 | Pending |

### 6.1 Phase Deliverables

**Phase 0:**
- ✅ VPS with Ubuntu 22.04, SSH access configured
- ✅ All dependencies installed (Node.js, PostgreSQL, FFmpeg, n8n, Nginx)
- ✅ SSL certificate active

**Phase 1:**
- ✅ PostgreSQL database with all tables created
- ✅ n8n accessible via HTTPS with basic auth
- ✅ 50+ gameplay videos in pool with metadata
- ✅ API credentials stored securely

**Phase 2:**
- ✅ Working story prompt generation sub-workflow
- ✅ AI video generation with polling logic
- ✅ FFmpeg composition script producing valid MP4
- ✅ Caption generation with hashtags

**Phase 3:**
- ✅ Instagram app configured with access tokens
- ✅ Approval queue workflow with Discord notifications
- ✅ Instagram posting workflow (create container → publish)
- ✅ Error handling for common API failures

**Phase 4:**
- ✅ Master workflow orchestrating all sub-workflows
- ✅ Cron trigger running daily at configured time
- ✅ Multi-account iteration logic
- ✅ Automated approval processing

**Phase 5:**
- ✅ Test report with 95%+ success rate
- ✅ Performance benchmarks documented
- ✅ Security audit passed

**Phase 6:**
- ✅ Production system live and monitored
- ✅ Backup strategy implemented
- ✅ Operations runbook completed
- ✅ First automated post successfully published

---

## 7. Validation & Review Points

### 7.1 Phase Gate Reviews

**Gate 1: End of Phase 0**
- **Criteria:** VPS accessible, all dependencies installed, SSL working
- **Reviewers:** DevOps lead, Project owner
- **Go/No-Go Decision:** Proceed to Phase 1 if all infrastructure tests pass

**Gate 2: End of Phase 1**
- **Criteria:** n8n running, database operational, video pool loaded
- **Reviewers:** Backend developer, Project owner
- **Go/No-Go Decision:** Proceed to Phase 2 if database schema validated

**Gate 3: End of Phase 2**
- **Criteria:** Can generate full video (prompt → AI → compose → caption)
- **Reviewers:** Full team
- **Go/No-Go Decision:** Proceed to Phase 3 if 5 test videos produced successfully
- **Quality Check:** Review video quality, caption relevance

**Gate 4: End of Phase 3**
- **Criteria:** Successfully posted 3 test Reels to Instagram
- **Reviewers:** Full team, Instagram account owner
- **Go/No-Go Decision:** Proceed to Phase 4 if posts visible on Instagram
- **Quality Check:** Verify no content policy violations

**Gate 5: End of Phase 4**
- **Criteria:** Master workflow runs automatically, multi-account tested
- **Reviewers:** Full team
- **Go/No-Go Decision:** Proceed to Phase 5 if 3 accounts posted successfully
- **Quality Check:** Review execution logs, timing metrics

**Gate 6: End of Phase 5**
- **Criteria:** All tests passed, performance meets SLA
- **Reviewers:** Full team, QA lead
- **Go/No-Go Decision:** Proceed to deployment if success rate >95%
- **Quality Check:** Review test report, security audit

### 7.2 Daily Standup Checkpoints
- Review previous day's progress against plan
- Identify blockers and dependencies
- Update task completion status
- Adjust timeline if delays detected

### 7.3 Code Review Requirements
- All FFmpeg scripts must be reviewed for command injection vulnerabilities
- n8n workflows must be exported and version-controlled
- Database migration scripts must be tested on staging before production
- API integration code must handle all documented error codes

---

## 8. Implementation Risks

### 8.1 High-Priority Risks

| Risk ID | Description | Impact | Probability | Mitigation Strategy |
|---------|-------------|--------|-------------|---------------------|
| **R1** | Instagram API rate limits block posting | High | Medium | Implement exponential backoff, spread posts across time windows |
| **R2** | AI video API downtime or quota exhausted | High | Medium | Configure fallback provider (Pika if Luma fails), set daily budget alerts |
| **R3** | FFmpeg composition fails with certain video formats | Medium | Low | Pre-normalize all gameplay videos, add format validation before composition |
| **R4** | Instagram account shadowbanned for automation | High | Medium | Use official API only, vary posting times ±30 min, limit to 1-2 posts/day |
| **R5** | VPS disk fills up with temporary videos | Medium | High | Implement automatic cleanup cron job (delete files >7 days old) |
| **R6** | API costs exceed monthly budget | Medium | Medium | Set hard spend limits per API, track costs daily in database |
| **R7** | Copyright strike on gameplay footage | High | Low | Verify all footage is copyright-free, maintain source documentation |
| **R8** | Access token expiration not detected | Medium | Low | Implement token refresh logic, alert 7 days before expiry |

### 8.2 Medium-Priority Risks

| Risk ID | Description | Impact | Probability | Mitigation Strategy |
|---------|-------------|--------|-------------|---------------------|
| **R9** | Generated content violates Instagram guidelines | Medium | Low | Implement content review keywords, require human approval before posting |
| **R10** | n8n workflow execution timeout during peak load | Low | Medium | Increase timeout to 1 hour, optimize FFmpeg with `-preset fast` |
| **R11** | Database connection pool exhausted | Medium | Low | Set max connections to 20, implement connection retry logic |
| **R12** | Nginx reverse proxy misconfiguration | Low | Low | Test webhook endpoint thoroughly, use standard n8n proxy config |

### 8.3 Risk Monitoring
- Review `api_usage_logs` table daily for cost trends
- Monitor Instagram post frequency and engagement metrics
- Track error rates in n8n execution logs
- Set up alerts for critical thresholds (budget, error rate, disk space)

---

## 9. Exit Criteria (Definition of Done)

### 9.1 System-Level Exit Criteria
- ✅ System automatically generates and posts 1 video per account daily
- ✅ No manual intervention required except approval step
- ✅ Cron trigger fires reliably at configured time
- ✅ All workflows execute successfully >95% of the time
- ✅ Video quality meets Instagram specifications (1080x1920, <100MB, H.264)
- ✅ Captions and hashtags are contextually relevant
- ✅ Error handling gracefully manages API failures
- ✅ Logging captures all execution details for debugging

### 9.2 Performance Exit Criteria
- ✅ AI video generation completes in <5 minutes
- ✅ FFmpeg composition completes in <90 seconds
- ✅ Instagram upload and publish completes in <5 minutes
- ✅ Total end-to-end time (trigger to approval ready) <30 minutes
- ✅ VPS resource usage <70% (CPU, RAM, disk)
- ✅ Database query response time <500ms for all operations

### 9.3 Quality Exit Criteria
- ✅ 10 consecutive successful posts with no errors
- ✅ Video split-screen alignment is pixel-perfect
- ✅ Audio quality is clear with no distortion
- ✅ Captions contain no grammatical errors
- ✅ Hashtags are relevant and not repetitive
- ✅ No copyright claims on posted content
- ✅ No Instagram content policy violations

### 9.4 Documentation Exit Criteria
- ✅ Operations runbook completed with step-by-step procedures
- ✅ Troubleshooting guide covers all common failure scenarios
- ✅ Architecture diagram updated to reflect actual implementation
- ✅ API cost tracking spreadsheet established
- ✅ Backup and restore procedures documented and tested
- ✅ Credentials handoff completed securely

### 9.5 Security Exit Criteria
- ✅ All API keys stored encrypted
- ✅ SSH access restricted to key-based auth only
- ✅ Firewall rules block all unnecessary ports
- ✅ HTTPS certificate valid and auto-renewing
- ✅ Database credentials not exposed in logs
- ✅ Instagram tokens encrypted at rest

### 9.6 Acceptance Criteria
- ✅ Project owner approves final system demonstration
- ✅ 7-day continuous operation with no critical failures
- ✅ Cost per video within budget ($5-10 per video)
- ✅ Approval queue workflow tested and approved
- ✅ Multi-account posting validated (3+ accounts)

---

## 10. Post-Implementation Plan

### 10.1 Week 1 Post-Launch
- Monitor daily execution logs
- Track success rate and error patterns
- Review video quality feedback
- Adjust cron timing if needed
- Optimize FFmpeg preset for speed/quality balance

### 10.2 Month 1 Review
- Analyze API cost trends vs budget
- Review Instagram engagement metrics (views, likes, shares)
- Identify most successful content themes
- Evaluate video generation provider performance
- Consider adding more accounts if stable

### 10.3 Optimization Opportunities
- **Phase 2 Enhancements:**
  - Add A/B testing for caption variations
  - Implement trending hashtag scraper
  - Auto-detect optimal posting times per account
  - Build analytics dashboard for engagement metrics
- **Scaling Plan:**
  - Support 5-10 accounts
  - Implement job queue (Redis/Bull) for parallel processing
  - Add cross-platform posting (TikTok, YouTube Shorts)

### 10.4 Maintenance Schedule
- **Daily:** Review execution logs, check approval queue
- **Weekly:** Database backup verification, disk cleanup check
- **Monthly:** API token renewal check, cost analysis
- **Quarterly:** Security audit, dependency updates (n8n, FFmpeg, Node.js)

---

## 11. Change Management

### 11.1 Scope Change Process
Any change to scope requires:
1. Document change request with rationale
2. Assess impact on timeline and budget
3. Review with project owner
4. Update Implementation Plan document
5. Communicate changes to all stakeholders

### 11.2 Emergency Hotfix Process
For critical production issues:
1. Identify root cause via logs
2. Develop minimal fix (don't refactor)
3. Test fix in staging environment
4. Deploy during low-traffic window
5. Monitor for 24 hours
6. Document issue and resolution

---

## Appendix A: Technology Reference

### A.1 FFmpeg Command Reference
```bash
# Composite split-screen video (60/40)
ffmpeg -i top.mp4 -i bottom.mp4 \
  -filter_complex "[0:v]scale=1080:1152,crop=1080:1152[top];\
                   [1:v]scale=1080:768,crop=1080:768[bottom];\
                   [top][bottom]vstack[v];\
                   [0:a]volume=1.0[audio]" \
  -map "[v]" -map "[audio]" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k -movflags +faststart \
  -shortest output.mp4
```

### A.2 Instagram Graph API Endpoints
```http
# Create container
POST https://graph.facebook.com/v18.0/{ig-user-id}/media
{
  "video_url": "https://cdn.example.com/video.mp4",
  "caption": "Your caption #hashtags",
  "media_type": "REELS"
}

# Publish container
POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
{
  "creation_id": "{container-id}"
}
```

### A.3 Claude API Prompt Example
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Generate a 20-second video concept for a humorous Instagram Reel. Return JSON: {\"prompt\": \"...\", \"visual_style\": \"...\", \"duration\": 20}"
    }
  ]
}
```

---

## Appendix B: Database Schema Quick Reference

```sql
-- Instagram Accounts
CREATE TABLE instagram_accounts (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100),
  access_token TEXT,
  token_expires_at TIMESTAMP,
  content_theme VARCHAR(50),
  posting_timezone VARCHAR(50),
  optimal_posting_time TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Reels Log
CREATE TABLE generated_reels (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) REFERENCES instagram_accounts(id),
  prompt_used TEXT,
  video_api_provider VARCHAR(50),
  caption TEXT,
  hashtags TEXT,
  instagram_media_id VARCHAR(100),
  instagram_permalink TEXT,
  posted_at TIMESTAMP,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Approval Queue
CREATE TABLE approval_queue (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50),
  video_path VARCHAR(255),
  caption TEXT,
  hashtags TEXT,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100)
);

-- Gameplay Videos Pool
CREATE TABLE gameplay_videos (
  id VARCHAR(50) PRIMARY KEY,
  file_path VARCHAR(255),
  category VARCHAR(50),
  mood VARCHAR(50),
  duration_seconds INT,
  last_used_at TIMESTAMP,
  use_count INT DEFAULT 0
);
```

---

**Document Status:** Ready for Execution  
**Next Action:** Begin Phase 0 - VPS Provisioning  
**Contact:** Project Owner for clarifications and approvals
