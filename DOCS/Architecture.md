# System Architecture: Automated Split-Screen Reels Generator

**Version:** 1.0
**Last Updated:** 2026-01-04

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│                              ┌─────────────────┐                                  │
│                              │   SCHEDULER     │                                  │
│                              │   (Cron Job)    │                                  │
│                              │   Daily Trigger │                                  │
│                              └────────┬────────┘                                  │
│                                       │                                            │
│                                       ▼                                            │
│                              ┌─────────────────┐                                  │
│                              │     n8n         │                                  │
│                              │  Master Workflow│                                  │
│                              └────────┬────────┘                                  │
│                                       │                                            │
│                  ┌────────────────────┼────────────────────┐                      │
│                  │                    │                    │                      │
│                  ▼                    ▼                    ▼                      │
│         ┌──────────────────┐  ┌──────────────┐   ┌──────────────────┐            │
│         │  Story Service   │  │Video Service │   │ Caption Service  │            │
│         │  (Claude API)    │  │(AI Video API)│   │  (Claude API)    │            │
│         └─────────┬────────┘  └──────┬───────┘   └────────┬─────────┘            │
│                   │                   │                     │                      │
│                   └───────────────────┼─────────────────────┘                      │
│                                       │                                            │
│                                       ▼                                            │
│                              ┌─────────────────┐                                  │
│                              │  Video Engine    │                                  │
│                              │   (FFmpeg)       │                                  │
│                              │  - Composite     │                                  │
│                              │  - Encode       │                                  │
│                              └────────┬────────┘                                  │
│                                       │                                            │
│                                       ▼                                            │
│                              ┌─────────────────┐                                  │
│                              │ Approval Queue  │                                  │
│                              │ (Human Review)  │                                  │
│                              └────────┬────────┘                                  │
│                                       │                                            │
│                                       ▼                                            │
│                              ┌─────────────────┐                                  │
│                              │ Instagram Agent │                                  │
│                              │ (Graph API)     │                                  │
│                              └────────┬────────┘                                  │
│                                       │                                            │
│                                       ▼                                            │
│                              ┌─────────────────┐                                  │
│                              │   Data Store    │                                  │
│                              │   (PostgreSQL)  │                                  │
│                              │   - Logs        │                                  │
│                              │   - Metadata    │                                  │
│                              │   - Config      │                                  │
│                              └─────────────────┘                                  │
│                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Scheduler (Cron)

**Responsibility:** Trigger the master workflow daily at configured time

**Implementation:**
```bash
# Crontab entry
0 9 * * * /usr/bin/n8n execute --workflow=daily-reels-generator
```

**Configuration:**
- Trigger time: Configurable per account timezone
- Fallback: If workflow is still running, skip to avoid overlap

---

### 2.2 n8n Master Workflow

**Responsibility:** Orchestrate the entire daily generation process

**Flow:**
1. Receive trigger from scheduler
2. Fetch active Instagram accounts from database
3. For each account:
   - Execute sub-workflow: `generate-and-post-reel`
   - Wait for completion or timeout
   - Log result
4. Send daily summary notification

**Configuration:**
```json
{
  "workflowName": "daily-reels-generator",
  "maxConcurrentAccounts": 3,
  "timeoutPerAccount": 3600,
  "notificationOnComplete": true
}
```

---

### 2.3 Story Service

**Responsibility:** Generate engaging story prompts for AI video generation

**Technology:** Claude API (Claude 3.5 Sonnet)

**Input:**
- Account content theme (humor, storytelling, etc.)
- Previous prompts (to avoid repetition)
- Trending topics (optional, via web search)

**Output:**
```json
{
  "prompt": "A cozy coffee shop where the barista is secretly a robot trying to learn human emotions",
  "visual_style": "warm lighting, animated style",
  "duration_hint": 20,
  "story_category": "heartwarming"
}
```

**API Endpoint:**
```
POST https://api.anthropic.com/v1/messages
```

---

### 2.4 Video Service

**Responsibility:** Generate AI videos from prompts

**Design Pattern:** Strategy pattern for provider flexibility

**Interface:**
```typescript
interface VideoGenerationService {
  generate(prompt: string, duration: number): Promise<VideoResult>
  getStatus(jobId: string): Promise<JobStatus>
  download(url: string): Promise<Buffer>
}

class RunwayMLService implements VideoGenerationService { ... }
class LumaService implements VideoGenerationService { ... }
class PikaService implements VideoGenerationService { ... }
```

**Configuration:**
```json
{
  "videoService": {
    "provider": "luma", // or "runway", "pika"
    "fallbackProvider": "pika",
    "maxRetries": 3,
    "timeout": 300
  }
}
```

---

### 2.5 Video Engine (FFmpeg)

**Responsibility:** Composite top and bottom videos into final split-screen format

**Pipeline:**
```
1. Download AI-generated video (top)
2. Select random gameplay video (bottom)
3. Normalize formats (codec, frame rate, resolution)
4. Composite with vertical stack (60/40 split)
5. Encode to Instagram-compatible MP4
6. Output final video
```

**FFmpeg Command:**
```bash
#!/bin/bash

# Inputs
TOP_VIDEO="$1"
BOTTOM_VIDEO="$2"
OUTPUT="$3"

# Composite: 60% top, 40% bottom
ffmpeg \
  -i "$TOP_VIDEO" \
  -i "$BOTTOM_VIDEO" \
  -filter_complex "\
    [0:v]scale=1080:-1,crop=1080:1152:0:0[top];\
    [1:v]scale=1080:-1,crop=1080:768:0:0[bottom];\
    [top][bottom]vstack=inputs=2[v];\
    [0:a]volume=1.0[audio]" \
  -map "[v]" -map "[audio]" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -shortest \
  "$OUTPUT"
```

**Wrapper Service:** Node.js script for n8n integration
```javascript
// services/video-composer.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function composeVideos(topPath, bottomPath, outputPath) {
  const command = `./scripts/compose-videos.sh "${topPath}" "${bottomPath}" "${outputPath}"`;
  const { stdout, stderr } = await execPromise(command);
  if (stderr && !stderr.includes('deprecated')) {
    console.error('FFmpeg warning:', stderr);
  }
  return outputPath;
}
```

---

### 2.6 Caption Service

**Responsibility:** Generate engaging captions and hashtags

**Technology:** Claude API

**Input:**
- Story prompt used for video
- Video visual style
- Account theme/brand voice
- Target audience

**Output:**
```json
{
  "caption": "POV: You discover your favorite coffee shop is run by an AI learning to love ☕🤖",
  "hashtags": [
    "#pov", "#ai", "#coffee", "#storytime", "#reels",
    "#viral", "#fyp", "#story", "#entertainment", "#future"
  ],
  "hook_type": "question",
  "cta": null
}
```

**Prompt Template:**
```
You are a social media expert. Generate a caption for an Instagram Reel.

Video Story: {story_prompt}
Visual Style: {visual_style}
Account Theme: {account_theme}

Requirements:
- 1-2 sentences maximum
- Engaging hook (POV, question, or statement)
- 1-2 relevant emojis
- 10-15 hashtags (mix of niche and trending)

Return JSON format: {"caption": "...", "hashtags": ["#tag1", "#tag2", ...]}
```

---

### 2.7 Approval Queue

**Responsibility:** Human review interface before final posting

**Implementation Options:**

**Option A: Web Dashboard (Recommended for Phase 2+)**
```
Simple web interface showing:
- Video preview
- Caption and hashtags
- Approve / Reject / Edit buttons
- Batch approve for efficiency
```

**Option B: Discord/Slack Bot (Quick Start)**
```
Bot posts message with:
- Video thumbnail/preview
- Caption text
- Reaction buttons for approve/reject
- Comment to request changes
```

**Option C: Email Digest (Simplest)**
```
Email sent with:
- Video attachment or link
- Caption and hashtags
- Reply "APPROVE" or "REJECT"
```

**Database Schema:**
```sql
CREATE TABLE approval_queue (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50),
  video_path VARCHAR(255),
  caption TEXT,
  hashtags TEXT,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'posted'
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  notes TEXT
);
```

---

### 2.8 Instagram Agent

**Responsibility:** Handle all Instagram Graph API interactions

**Key Operations:**

1. **Upload Video**
```http
POST https://graph.facebook.com/v18.0/{ig-user-id}/media
Content-Type: application/json

{
  "video_url": "https://cdn.example.com/video.mp4",
  "caption": "Your caption here #hashtags",
  "media_type": "REELS",
  "share_to_feed": false
}
```

2. **Check Upload Status**
```http
GET https://graph.facebook.com/v18.0/{container-id}
fields=status_code
```

3. **Publish Reel**
```http
POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
{
  "creation_id": "{container-id}"
}
```

**Error Handling:**
```javascript
const INSTAGRAM_ERRORS = {
  RATE_LIMIT: { code: 4, action: 'exponential_backoff' },
  TOKEN_EXPIRED: { code: 190, action: 'refresh_token' },
  PERMISSION_DENIED: { code: 200, action: 'alert_admin' },
  VIDEO_TOO_LONG: { code: 136503, action: 'truncate_video' },
  VIDEO_TOO_LARGE: { code: 136509, action: 'compress_video' }
};

function handleInstagramError(error) {
  const handler = INSTAGRAM_ERRORS[error.code];
  if (handler) {
    return ACTIONS[handler.action](error);
  }
  throw error;
}
```

---

### 2.9 Data Store (PostgreSQL)

**Responsibility:** Persist all configuration, logs, and metadata

**Schema Overview:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         PostgreSQL Database                      │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  - instagram_accounts        (account credentials & config)      │
│  - generated_reels           (content log & metadata)            │
│  - gameplay_videos           (video pool inventory)              │
│  - approval_queue            (pending approvals)                 │
│  - api_usage_logs            (cost tracking & rate limits)       │
│  - performance_metrics       (engagement analytics)              │
│  - error_logs                (debugging & monitoring)            │
└─────────────────────────────────────────────────────────────────┘
```

**Connection Pool:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Orchestration** | n8n | Latest | Workflow automation |
| **Runtime** | Node.js | 20.x LTS | Script execution |
| **Video Processing** | FFmpeg | 6.x+ | Video composition |
| **Database** | PostgreSQL | 15+ | Data persistence |
| **AI - Prompts** | Claude API | 3.5 Sonnet | Story & caption generation |
| **AI - Video** | Luma / Pika / Runway | - | Video generation |
| **Social API** | Instagram Graph API | v18.0 | Content publishing |
| **Hosting** | VPS (Linux) | Ubuntu 22.04 | Infrastructure |
| **Reverse Proxy** | Nginx | 1.24+ | SSL & routing |
| **Process Manager** | PM2 | Latest | n8n process management |

---

## 4. Data Flow Diagram

```
┌─────────────┐
│   Cron      │  9:00 AM (configurable)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MASTER WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Get Account Config  │  ──────►  PostgreSQL: SELECT * FROM instagram_accounts
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Generate Story      │  ──────►  Claude API: POST /v1/messages
│ (Prompt Creation)   │  ◄─────  { prompt, style, duration }
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Generate AI Video   │  ──────►  Video API: POST /generate
│ (Top Screen)        │  ◄─────  { job_id, status: "processing" }
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Poll for Completion │  ──────►  Video API: GET /job/{job_id}
│ (every 10s)         │  ◄─────  { status: "complete", url: "..." }
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Download Video      │  ──────►  HTTP GET → /tmp/videos/top_{timestamp}.mp4
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Select Gameplay     │  ──────►  PostgreSQL: SELECT * FROM gameplay_videos
│ (Bottom Screen)     │              ORDER BY RANDOM() LIMIT 1
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Composite Videos    │  ──────►  FFmpeg: compose-videos.sh
│ (FFmpeg)            │  ──────►  Output: /tmp/videos/final_{timestamp}.mp4
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Generate Caption    │  ──────►  Claude API: POST /v1/messages
│ & Hashtags          │  ◄─────  { caption, hashtags: [] }
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Upload to Cloud     │  ──────►  (Optional) S3/R2 for public URL
│ (for Instagram)     │  ◄─────  { url: "https://cdn.../video.mp4" }
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Add to Approval     │  ──────►  PostgreSQL: INSERT INTO approval_queue
│ Queue               │              (status: 'pending')
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Notify Reviewer     │  ──────►  Discord/Slack webhook or Email
└─────────────────────┘
            │
            ▼ (after human approval)
┌─────────────────────┐
│ Create Container    │  ──────►  Instagram API: POST /media
│ (Instagram API)     │  ◄─────  { id: "container_xxx" }
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Publish Reel        │  ──────►  Instagram API: POST /media_publish
└──────────┬──────────┘
            │
            ▼
┌─────────────────────┐
│ Log Success         │  ──────►  PostgreSQL: INSERT INTO generated_reels
│ & Cleanup           │              DELETE /tmp/videos/*
└─────────────────────┘
```

---

## 5. Security Architecture

### 5.1 Secrets Management

**Approach:** Environment variables + file-based secrets

```
/etc/n8n/secrets/
├── .env                  # Main environment file
├── claude_api_key.txt    # Claude API key
├── video_api_keys.json   # Video API credentials
├── instagram_tokens.json # Instagram access tokens
└── db_credentials.txt    # Database password
```

**File Permissions:**
```bash
chmod 600 /etc/n8n/secrets/*
chown n8n:n8n /etc/n8n/secrets/*
```

### 5.2 API Key Rotation

**Strategy:**
- Claude API: Rotate every 90 days
- Video API: Monitor usage, rotate if compromised
- Instagram tokens: Auto-refresh via OAuth flow

### 5.3 Network Security

```
┌─────────────────────────────────────────────────────────┐
│                     VPS Firewall                         │
├─────────────────────────────────────────────────────────┤
│  INBOUND:                                               │
│  - SSH (22):      Key-based auth only                   │
│  - HTTP (80):     Redirect to HTTPS                    │
│  - HTTPS (443):   Nginx → n8n webhook                   │
│  - n8n Editor (5678): Localhost only (VPN)             │
│                                                         │
│  OUTBOUND:                                              │
│  - HTTPS (443):   API calls, video downloads           │
│  - All other:    Blocked                               │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Instagram Token Storage

**Encryption:** AES-256-GCM for access tokens at rest

```javascript
const crypto = require('crypto');

function encryptToken(token, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

---

## 6. Scalability Architecture

### 6.1 Current Scope (Phase 1)

```
Single Account Setup:
┌─────────────────────────────────────────┐
│  1 Account × 1 Video/Day                │
│  ~30 videos/month                       │
│  Video generation: ~2-5 min each        │
│  Total daily runtime: ~15-30 min        │
└─────────────────────────────────────────┘
```

**Infrastructure:** Single VPS instance sufficient

### 6.2 Growth Path (Phase 2+)

```
Multi-Account Setup:
┌─────────────────────────────────────────────────────────────┐
│  5 Accounts × 1 Video/Day                                   │
│  ~150 videos/month                                          │
│  Parallel processing needed                                 │
│  Consider: Job queue + worker pool                          │
└─────────────────────────────────────────────────────────────┘
```

**Scaling Options:**

**Option A: Horizontal Scaling**
```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│  n8n Instance  │      │  n8n Instance  │      │  n8n Instance  │
│  (Account 1-2) │      │  (Account 3-4) │      │  (Account 5+)  │
└────────────────┘      └────────────────┘      └────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                      ┌──────────────────────┐
                      │  Shared PostgreSQL   │
                      │  Shared Video Pool   │
                      └──────────────────────┘
```

**Option B: Queue-Based Architecture**
```
┌─────────────┐     ┌──────────────────────────────┐
┌─────────────┤     │    Job Queue (Redis/Bull)     │
│   Scheduler │────►│                              │
└─────────────┘     │  Job 1: Account 1 [pending]  │
                    │  Job 2: Account 2 [running]  │
                    │  Job 3: Account 3 [queued]   │
                    └──────────┬───────────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          ┌─────────┐   ┌─────────┐   ┌─────────┐
          │ Worker 1│   │ Worker 2│   │ Worker 3│
          └─────────┘   └─────────┘   └─────────┘
```

### 6.3 Performance Considerations

| Component | Bottleneck Risk | Mitigation |
|-----------|-----------------|------------|
| AI Video API | Rate limits, queue time | Stagger requests, use multiple providers |
| FFmpeg | CPU intensive | Use `-preset ultrafast` for drafts, optimize later |
| Instagram API | 25 uploads/hour limit | Spread posts across optimal times |
| Storage | Video accumulation | Auto-delete after 30 days, use lifecycle policies |
| Database | Query performance | Add indexes on `created_at`, `account_id` |

---

## 7. Monitoring & Observability

### 7.1 Metrics to Track

**System Metrics:**
```
- Workflow execution time
- API response times (Claude, Video, Instagram)
- Error rates by service
- Daily success rate (%)
- Queue depth (approval queue)
```

**Business Metrics:**
```
- Cost per video (API usage)
- Videos posted per day
- Approval rate (% approved vs rejected)
- Time from generation to posting
```

### 7.2 Logging Strategy

**Log Levels:**
```javascript
const LOG_LEVELS = {
  ERROR: 'Failed API calls, posting failures',
  WARN: 'Rate limit warnings, slow responses',
  INFO: 'Workflow start/completion, posts published',
  DEBUG: 'API request details, FFmpeg commands'
};
```

**Log Structure:**
```json
{
  "timestamp": "2026-01-04T09:00:00Z",
  "level": "INFO",
  "workflow": "generate-and-post-reel",
  "account": "example_account",
  "action": "video_generated",
  "duration_ms": 124500,
  "metadata": {
    "video_api": "luma",
    "prompt_length": 85,
    "video_duration": 18
  }
}
```

### 7.3 Alerting Rules

**Critical Alerts (Immediate):**
```
- Workflow failure rate > 20%
- Instagram API token expired
- VPS disk space < 10%
- Daily budget exceeded (90% of $500)
```

**Warning Alerts (Daily Digest):**
```
- Average video generation time > 10 min
- Approval queue > 24 hours old
- API costs trending > budget
```

---

## 8. Deployment Architecture

### 8.1 VPS Setup

**Initial Provisioning:**
```bash
#!/bin/bash
# setup-vps.sh

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y nodejs npm postgresql nginx ffmpeg

# Install n8n globally
npm install -g n8n

# Create n8n user
useradd -m -s /bin/bash n8n

# Setup directories
mkdir -p /var/lib/n8n
mkdir -p /etc/n8n/secrets
mkdir -p /var/lib/n8n/videos/{temp,pool,output}

# Setup database
sudo -u postgres createdb n8n_reels
sudo -u postgres psql -c "CREATE USER n8n WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE n8n_reels TO n8n;"

# Setup PM2
npm install -g pm2
pm2 startup
```

### 8.2 Environment Configuration

```bash
# /etc/n8n/.env

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=n8n_reels
DB_USER=n8n
DB_PASSWORD=secure_password

# Claude API
CLAUDE_API_KEY=sk-ant-xxxxx
CLAUDE_API_URL=https://api.anthropic.com

# Video API (Luma example)
VIDEO_API_PROVIDER=luma
VIDEO_API_KEY=luma_xxxxx
VIDEO_API_URL=https://api.lumalabs.ai

# Instagram
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/callback

# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_PATH=/
WEBHOOK_URL=https://your-domain.com/

# File Storage
VIDEO_TEMP_DIR=/var/lib/n8n/videos/temp
VIDEO_POOL_DIR=/var/lib/n8n/videos/pool
VIDEO_OUTPUT_DIR=/var/lib/n8n/videos/output
```

### 8.3 Process Management (PM2)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'n8n',
    script: 'n8n',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      N8N_BASIC_AUTH_ACTIVE: 'true',
      N8N_BASIC_AUTH_USER: 'admin',
      N8N_BASIC_AUTH_PASSWORD: 'secure_password',
      N8N_HOST: 'localhost',
      N8N_PORT: 5678,
      WEBHOOK_URL: 'https://your-domain.com/'
    },
    error_file: '/var/log/n8n/error.log',
    out_file: '/var/log/n8n/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 8.4 Nginx Configuration

```nginx
# /etc/nginx/sites-available/n8n

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # n8n webhooks
    location /webhook/ {
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # n8n editor (VPN only recommended)
    location /n8n/ {
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 9. Cost Breakdown

### 9.1 Monthly Operating Costs (Phase 1)

| Service | Tier | Cost |
|---------|------|------|
| **VPS** | 4 CPU, 8GB RAM, 100GB SSD | $20-40 |
| **Claude API** | ~60 calls/day (prompt + caption) | $15-25 |
| **Video API** | ~30 videos/month (Luma/Pika) | $150-250 |
| **PostgreSQL** | Self-hosted | $0 |
| **Domain + SSL** | Standard | $10-15 |
| **Monitoring** (optional) | Uptime monitoring | $0-10 |
| **Total** | | **$195-340** |

### 9.2 Cost Optimization Tips

1. **Prompt Caching:** Cache common story templates to reduce Claude calls
2. **Video Batching:** Generate multiple videos in single API session (if supported)
3. **Free Tier Utilization:** Some providers offer free monthly credits
4. **Self-Hosting:** Consider Stable Video Diffusion for longer runs

---

## 10. Architecture Decision Records

### ADR-001: n8n vs Custom Workflow Engine

**Decision:** Use n8n for orchestration

**Rationale:**
- Visual workflow debugging
- Low-code reduces development time
- Built-in webhook support
- Active community and integrations
- Easy to hand off to non-technical users

**Trade-offs:**
- Less control than custom code
- Potential licensing costs at scale
- Dependency on n8n updates

**Revisit:** When daily workflows > 100 or complexity requires custom logic

---

### ADR-002: PostgreSQL vs SQLite

**Decision:** PostgreSQL for production

**Rationale:**
- Better concurrent access
- JSONB support for metadata
- Easier to scale horizontally
- Better backup/replication tools

**Trade-offs:**
- Additional infrastructure complexity
- Overkill for single-account testing

**Revisit:** Never for this use case

---

### ADR-003: Human Approval Step

**Decision:** Add approval queue before posting

**Rationale:**
- Prevents costly mistakes (offensive content, technical issues)
- Allows quality control
- Builds confidence in automation
- Required for brand safety

**Trade-offs:**
- Adds latency (manual review time)
- Requires daily human attention
- Reduces "fully automated" benefit

**Revisit:** After 50 successful posts with 95%+ approval rate

---

## 11. Integration Points

### 11.1 External API Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Dependencies                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Claude     │    │ Video API    │    │  Instagram   │      │
│  │     API      │    │ (Luma/Pika)  │    │  Graph API   │      │
│  │              │    │              │    │              │      │
│  │  - Stories   │    │  - Gen Video │    │  - Upload    │      │
│  │  - Captions  │    │  - Poll      │    │  - Publish   │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                    │              │
│         └───────────────────┼────────────────────┘              │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │   n8n Workflows │                         │
│                    │   (HTTP Nodes)  │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 API Response Time SLAs

| API | Expected Response | Timeout | Retry Strategy |
|-----|-------------------|---------|----------------|
| Claude (prompt) | 2-5 seconds | 30 seconds | 3x, exponential backoff |
| Claude (caption) | 2-3 seconds | 30 seconds | 3x, exponential backoff |
| Video API (submit) | 1-2 seconds | 10 seconds | 3x, immediate |
| Video API (poll) | 1 second | 5 seconds | Poll until 5 min max |
| Video Download | 5-30 seconds | 120 seconds | 3x, exponential backoff |
| Instagram Upload | 10-60 seconds | 300 seconds | 3x, exponential backoff |
| Instagram Publish | 5-15 seconds | 60 seconds | 3x, exponential backoff |

---

## 12. Future Enhancements

### 12.1 Planned Features

**Short-term (3 months):**
- [ ] Multi-account support (3-5 accounts)
- [ ] Analytics dashboard
- [ ] A/B testing for captions
- [ ] Trending hashtag detection
- [ ] Web-based approval interface

**Medium-term (6 months):**
- [ ] Automatic optimization of posting times
- [ ] Engagement-based content iteration
- [ ] Additional video formats (Stories, Posts)
- [ ] Cross-platform posting (TikTok, YouTube Shorts)

**Long-term (12 months):**
- [ ] Machine learning for story generation
- [ ] Fully autonomous content strategy
- [ ] Real-time trend detection and response
- [ ] Multi-language support

### 12.2 Architecture Evolution

```
Phase 1 (Current)          Phase 2                    Phase 3
─────────────────          ──────────────             ──────────────
Single VPS                 Multi-VPS                  Kubernetes
│                           │                           │
├─ n8n                      ├─ Load Balancer           ├─ API Gateway
├─ PostgreSQL               ├─ n8n Cluster             ├─ Service Mesh
├─ FFmpeg                   ├─ PostgreSQL (Primary)    ├─ Auto-scaling
└─ Cron                     ├─ PostgreSQL Replica      └─ GitOps (ArgoCD)
                            └─ Redis Queue
```

---

**End of Architecture Document**
