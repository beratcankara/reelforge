# Technical Documentation

**Project:** Automated Split-Screen Instagram Reels Generator  
**Version:** 1.0  
**Last Updated:** 2026-01-04  
**Status:** Active Development

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [API Documentation](#3-api-documentation)
4. [Database Schema](#4-database-schema)
5. [Service Specifications](#5-service-specifications)
6. [Workflow Specifications](#6-workflow-specifications)
7. [Configuration](#7-configuration)
8. [Development Guide](#8-development-guide)
9. [Deployment Guide](#9-deployment-guide)
10. [Operations Guide](#10-operations-guide)

---

## 1. System Overview

### 1.1 Purpose
Automated system that generates daily split-screen Instagram Reels combining AI-generated content (60%) with gameplay footage (40%), orchestrated via n8n workflows.

### 1.2 Key Features
- ✅ Automated daily video generation
- ✅ Multi-account Instagram management
- ✅ AI-powered story and caption generation
- ✅ Human approval queue
- ✅ FFmpeg video composition
- ✅ Error handling and retry logic
- ✅ Cost tracking and analytics

### 1.3 System Requirements

**Server:**
- Ubuntu 22.04 LTS
- 4 CPU cores
- 8 GB RAM
- 100 GB SSD storage
- 5 TB/month bandwidth

**External Services:**
- Claude API account (Anthropic)
- Luma Dream Machine API access
- Instagram Business account(s)
- Facebook Developer App (approved)

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         SCHEDULER                               │
│                    Cron Trigger (Daily 09:00)                  │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                      MASTER WORKFLOW (n8n)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ For Each Instagram Account:                              │ │
│  │  1. Generate Story Prompt (Claude API)                   │ │
│  │  2. Generate AI Video (Luma/Pika API)                    │ │
│  │  3. Select Random Gameplay Video                         │ │
│  │  4. Compose Split-Screen (FFmpeg)                        │ │
│  │  5. Generate Caption & Hashtags (Claude API)             │ │
│  │  6. Add to Approval Queue                                │ │
│  │  7. Post to Instagram (After Approval)                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │PostgreSQL│   │   Redis  │   │ File Storage │
    │ Database │   │  Queue   │   │  (Videos)    │
    └──────────┘   └──────────┘   └──────────────┘
```

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Cron Jobs   │  │ n8n Webhooks │  │ Manual API   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────────┐
│ ORCHESTRATION LAYER                           │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │                   n8n Workflows                     │         │
│  │  • daily-reels-generator                           │         │
│  │  • generate-story-prompt                           │         │
│  │  • generate-ai-video                               │         │
│  │  • post-to-instagram                               │         │
│  └────────────────────────┬────────────────────────────┘         │
└─────────────────────────────┼──────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────┐
│ SERVICE LAYER               │                                   │
│  ┌──────────────────────────▼─────────────────────────────┐    │
│  │              Custom Node.js Services                    │    │
│  │  • video-composer.ts    (FFmpeg wrapper)               │    │
│  │  • claude-client.ts     (AI prompt/caption)            │    │
│  │  • video-api-client.ts  (Luma/Pika abstraction)       │    │
│  │  • instagram-client.ts  (Graph API wrapper)           │    │
│  │  • database.ts          (PostgreSQL pool)              │    │
│  └────────────────────────┬────────────────────────────────┘    │
└─────────────────────────────┼──────────────────────────────────┘
                              │
┌─────────────────────────────┼──────────────────────────────────┐
│ DATA LAYER                  │                                   │
│  ┌─────────────┐  ┌─────────▼────┐  ┌───────────────┐         │
│  │ PostgreSQL  │  │     Redis    │  │ File System   │         │
│  │  Database   │  │  (Job Queue) │  │ (Video Pool)  │         │
│  └─────────────┘  └──────────────┘  └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow

```
1. TRIGGER (Cron)
   ↓
2. FETCH ACCOUNTS (PostgreSQL)
   ↓
3. GENERATE PROMPT (Claude API)
   ↓ prompt text
4. GENERATE VIDEO (Luma API)
   ↓ video URL
5. DOWNLOAD VIDEO (HTTP)
   ↓ /tmp/videos/top_xxx.mp4
6. SELECT GAMEPLAY (PostgreSQL Query)
   ↓ /data/videos/pool/gameplay_xxx.mp4
7. COMPOSITE VIDEOS (FFmpeg)
   ↓ /tmp/videos/final_xxx.mp4
8. GENERATE CAPTION (Claude API)
   ↓ caption + hashtags
9. ADD TO QUEUE (PostgreSQL)
   ↓ approval_queue table
10. NOTIFY REVIEWER (Discord/Email)
    ↓ approval received
11. UPLOAD TO INSTAGRAM (Graph API)
    ↓ container_id
12. PUBLISH REEL (Graph API)
    ↓ media_id + permalink
13. LOG RESULT (PostgreSQL)
    ↓ generated_reels table
14. CLEANUP (Delete temp files)
```

---

## 3. API Documentation

### 3.1 Internal Services API

#### 3.1.1 Video Composer Service

**File:** `src/services/video-composer.ts`

```typescript
interface ComposeOptions {
  topVideoPath: string;
  bottomVideoPath: string;
  outputPath: string;
  topHeight: number;      // Default: 1152 (60%)
  bottomHeight: number;   // Default: 768 (40%)
}

interface ComposeResult {
  success: boolean;
  outputPath: string;
  duration: number;
  fileSize: number;
  error?: string;
}

async function composeVideos(options: ComposeOptions): Promise<ComposeResult>
```

**FFmpeg Command:**
```bash
ffmpeg \
  -i ${topVideoPath} \
  -i ${bottomVideoPath} \
  -filter_complex "\
    [0:v]scale=1080:1152,crop=1080:1152[top];\
    [1:v]scale=1080:768,crop=1080:768[bottom];\
    [top][bottom]vstack[v];\
    [0:a]volume=1.0[audio]" \
  -map "[v]" -map "[audio]" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -shortest ${outputPath}
```

---

#### 3.1.2 Claude Client Service

**File:** `src/services/claude-client.ts`

**Generate Story Prompt:**
```typescript
interface StoryPromptRequest {
  theme: string;           // e.g., "humor", "storytelling"
  duration: number;        // Desired video duration in seconds
  previousPrompts: string[]; // Avoid repetition
}

interface StoryPromptResponse {
  prompt: string;
  visualStyle: string;
  duration: number;
  category: string;
}

async function generateStoryPrompt(request: StoryPromptRequest): Promise<StoryPromptResponse>
```

**API Call:**
```typescript
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Generate a ${request.duration}-second video concept for ${request.theme}.
    Avoid these previous prompts: ${request.previousPrompts.join(', ')}
    Return JSON: {"prompt": "...", "visualStyle": "...", "duration": 20, "category": "..."}`
  }]
});
```

**Generate Caption:**
```typescript
interface CaptionRequest {
  storyPrompt: string;
  visualStyle: string;
  accountTheme: string;
}

interface CaptionResponse {
  caption: string;
  hashtags: string[];
  hookType: string;
}

async function generateCaption(request: CaptionRequest): Promise<CaptionResponse>
```

---

#### 3.1.3 Video API Client Service

**File:** `src/services/video-api-client.ts`

**Interface (Strategy Pattern):**
```typescript
interface VideoGenerationProvider {
  name: string;
  generate(prompt: string, duration: number): Promise<VideoJobResult>;
  getStatus(jobId: string): Promise<VideoStatus>;
  download(url: string, destinationPath: string): Promise<string>;
}

interface VideoJobResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
}

interface VideoStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  videoUrl?: string;
  error?: string;
}
```

**Luma Provider Implementation:**
```typescript
class LumaProvider implements VideoGenerationProvider {
  name = 'luma';
  
  async generate(prompt: string, duration: number): Promise<VideoJobResult> {
    const response = await axios.post(
      'https://api.lumalabs.ai/dream-machine/v1/generations',
      {
        prompt,
        aspect_ratio: '9:16',
        duration
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LUMA_API_KEY}`
        }
      }
    );
    
    return {
      jobId: response.data.id,
      status: 'queued',
      estimatedTime: 120 // 2 minutes estimate
    };
  }
  
  async getStatus(jobId: string): Promise<VideoStatus> {
    const response = await axios.get(
      `https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LUMA_API_KEY}`
        }
      }
    );
    
    return {
      status: response.data.state,
      progress: response.data.progress,
      videoUrl: response.data.video?.url
    };
  }
  
  async download(url: string, destinationPath: string): Promise<string> {
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(destinationPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destinationPath));
      writer.on('error', reject);
    });
  }
}
```

---

#### 3.1.4 Instagram Client Service

**File:** `src/services/instagram-client.ts`

**Create Container:**
```typescript
interface CreateContainerRequest {
  accountId: string;
  videoUrl: string;
  caption: string;
  hashtags: string[];
}

interface CreateContainerResponse {
  containerId: string;
}

async function createContainer(request: CreateContainerRequest): Promise<CreateContainerResponse>
```

**API Implementation:**
```typescript
const response = await axios.post(
  `https://graph.facebook.com/v18.0/${accountId}/media`,
  {
    video_url: request.videoUrl,
    caption: `${request.caption}\n\n${request.hashtags.join(' ')}`,
    media_type: 'REELS',
    share_to_feed: false
  },
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

return { containerId: response.data.id };
```

**Check Upload Status:**
```typescript
interface UploadStatus {
  status: 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
  statusCode: string;
}

async function checkUploadStatus(containerId: string): Promise<UploadStatus>
```

**Publish Container:**
```typescript
interface PublishRequest {
  accountId: string;
  containerId: string;
}

interface PublishResponse {
  mediaId: string;
  permalink?: string;
}

async function publishContainer(request: PublishRequest): Promise<PublishResponse>
```

---

### 3.2 External API Specifications

#### 3.2.1 Claude API

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Authentication:**
```
Header: x-api-key: ${CLAUDE_API_KEY}
Header: anthropic-version: 2023-06-01
```

**Request Example:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Generate a video concept..."
    }
  ]
}
```

**Response Example:**
```json
{
  "id": "msg_xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"prompt\": \"...\", \"visualStyle\": \"...\"}"
    }
  ],
  "usage": {
    "input_tokens": 150,
    "output_tokens": 80
  }
}
```

---

#### 3.2.2 Luma Dream Machine API

**Base URL:** `https://api.lumalabs.ai/dream-machine/v1`

**Authentication:**
```
Header: Authorization: Bearer ${LUMA_API_KEY}
```

**Generate Video:**
```http
POST /generations
Content-Type: application/json

{
  "prompt": "A cozy coffee shop with warm lighting...",
  "aspect_ratio": "9:16",
  "duration": 20
}
```

**Response:**
```json
{
  "id": "gen_abc123",
  "state": "queued",
  "created_at": "2026-01-04T09:00:00Z"
}
```

**Get Status:**
```http
GET /generations/{id}
```

**Response:**
```json
{
  "id": "gen_abc123",
  "state": "completed",
  "progress": 100,
  "video": {
    "url": "https://cdn.lumalabs.ai/videos/xxx.mp4",
    "duration": 20,
    "width": 1080,
    "height": 1920
  }
}
```

---

#### 3.2.3 Instagram Graph API

**Base URL:** `https://graph.facebook.com/v18.0`

**Authentication:**
```
Query Parameter: access_token=${INSTAGRAM_ACCESS_TOKEN}
```

**Create Media Container:**
```http
POST /{ig-user-id}/media
Content-Type: application/json

{
  "video_url": "https://cdn.example.com/video.mp4",
  "caption": "POV: Amazing story ☕\n\n#pov #viral #reels",
  "media_type": "REELS",
  "share_to_feed": false
}
```

**Response:**
```json
{
  "id": "17895695668004550"
}
```

**Check Container Status:**
```http
GET /{container-id}?fields=status_code
```

**Response:**
```json
{
  "status_code": "FINISHED",
  "id": "17895695668004550"
}
```

**Publish Container:**
```http
POST /{ig-user-id}/media_publish
Content-Type: application/json

{
  "creation_id": "17895695668004550"
}
```

**Response:**
```json
{
  "id": "17895695668004551"
}
```

**Get Media Permalink:**
```http
GET /{media-id}?fields=permalink,timestamp
```

**Response:**
```json
{
  "permalink": "https://www.instagram.com/reel/xxx/",
  "timestamp": "2026-01-04T09:30:00+0000",
  "id": "17895695668004551"
}
```

---

## 4. Database Schema

### 4.1 Schema Definition

**File:** `src/scripts/setup-db.sql`

```sql
-- Instagram Accounts Table
CREATE TABLE instagram_accounts (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  instagram_user_id VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  content_theme VARCHAR(50) NOT NULL,
  posting_timezone VARCHAR(50) DEFAULT 'UTC',
  optimal_posting_time TIME DEFAULT '09:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated Reels Log
CREATE TABLE generated_reels (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  prompt_used TEXT NOT NULL,
  video_api_provider VARCHAR(50) NOT NULL,
  video_api_job_id VARCHAR(100),
  top_video_path VARCHAR(255),
  bottom_video_path VARCHAR(255),
  final_video_path VARCHAR(255),
  caption TEXT NOT NULL,
  hashtags TEXT NOT NULL,
  instagram_container_id VARCHAR(100),
  instagram_media_id VARCHAR(100),
  instagram_permalink TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Status: pending, processing, approval_queue, approved, posted, failed
  error_message TEXT,
  metadata JSONB,
  posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reels_account ON generated_reels(account_id);
CREATE INDEX idx_reels_status ON generated_reels(status);
CREATE INDEX idx_reels_created ON generated_reels(created_at DESC);

-- Gameplay Videos Pool
CREATE TABLE gameplay_videos (
  id VARCHAR(50) PRIMARY KEY,
  file_path VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  -- Category: subway-surfers, gta5-parkour
  mood VARCHAR(50),
  -- Mood: high-energy, medium-energy, chill, intense
  duration_seconds INT NOT NULL,
  file_size_mb DECIMAL(10, 2),
  resolution VARCHAR(20),
  last_used_at TIMESTAMP,
  use_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gameplay_category ON gameplay_videos(category);
CREATE INDEX idx_gameplay_mood ON gameplay_videos(mood);

-- Approval Queue
CREATE TABLE approval_queue (
  id VARCHAR(50) PRIMARY KEY,
  reel_id VARCHAR(50) REFERENCES generated_reels(id) ON DELETE CASCADE,
  account_id VARCHAR(50) REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  video_preview_url TEXT,
  caption TEXT NOT NULL,
  hashtags TEXT NOT NULL,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  -- Status: pending, approved, rejected, expired
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  notes TEXT
);

CREATE INDEX idx_approval_status ON approval_queue(status);
CREATE INDEX idx_approval_created ON approval_queue(created_at DESC);

-- API Usage Logs
CREATE TABLE api_usage_logs (
  id SERIAL PRIMARY KEY,
  api_provider VARCHAR(50) NOT NULL,
  -- Provider: claude, luma, pika, instagram
  operation VARCHAR(100) NOT NULL,
  -- Operation: generate_prompt, generate_caption, generate_video, upload_media
  request_data JSONB,
  response_data JSONB,
  tokens_used INT,
  cost_usd DECIMAL(10, 4),
  duration_ms INT,
  status VARCHAR(20) NOT NULL,
  -- Status: success, failed, rate_limited
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_logs_provider ON api_usage_logs(api_provider);
CREATE INDEX idx_api_logs_created ON api_usage_logs(created_at DESC);

-- Performance Metrics
CREATE TABLE performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  -- Metrics: workflow_execution_time, video_generation_time, ffmpeg_composition_time
  metric_value DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  -- Unit: seconds, milliseconds, count, percentage
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_metrics_created ON performance_metrics(created_at DESC);

-- Error Logs
CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  error_type VARCHAR(50) NOT NULL,
  -- Type: api_error, ffmpeg_error, database_error, workflow_error
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  severity VARCHAR(20) NOT NULL,
  -- Severity: low, medium, high, critical
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_errors_type ON error_logs(error_type);
CREATE INDEX idx_errors_severity ON error_logs(severity);
CREATE INDEX idx_errors_resolved ON error_logs(resolved);
```

### 4.2 Sample Data

```sql
-- Insert Sample Instagram Account
INSERT INTO instagram_accounts (
  id, username, instagram_user_id, access_token, token_expires_at,
  content_theme, posting_timezone, optimal_posting_time
) VALUES (
  'acc_001',
  'example.reels',
  '17841405309211844',
  'encrypted_token_here',
  NOW() + INTERVAL '60 days',
  'humor',
  'America/New_York',
  '09:00:00'
);

-- Insert Sample Gameplay Videos
INSERT INTO gameplay_videos (
  id, file_path, category, mood, duration_seconds, file_size_mb, resolution
) VALUES
  ('vid_001', '/data/videos/pool/subway-surfers/high-energy/clip_001.mp4', 'subway-surfers', 'high-energy', 30, 15.5, '1080x1920'),
  ('vid_002', '/data/videos/pool/subway-surfers/medium-energy/clip_002.mp4', 'subway-surfers', 'medium-energy', 25, 12.3, '1080x1920'),
  ('vid_003', '/data/videos/pool/gta5-parkour/chill/clip_001.mp4', 'gta5-parkour', 'chill', 28, 14.2, '1080x1920');
```

### 4.3 Database Queries

**Get Active Accounts:**
```sql
SELECT id, username, content_theme, optimal_posting_time
FROM instagram_accounts
WHERE is_active = true
ORDER BY optimal_posting_time;
```

**Get Random Gameplay Video:**
```sql
SELECT id, file_path, duration_seconds
FROM gameplay_videos
WHERE category = 'subway-surfers'
  AND mood = 'high-energy'
ORDER BY RANDOM()
LIMIT 1;
```

**Log API Usage:**
```sql
INSERT INTO api_usage_logs (
  api_provider, operation, tokens_used, cost_usd, duration_ms, status
) VALUES (
  'claude', 'generate_prompt', 150, 0.0045, 1250, 'success'
);
```

**Get Pending Approvals:**
```sql
SELECT 
  aq.id,
  aq.video_preview_url,
  aq.caption,
  aq.hashtags,
  ia.username,
  aq.created_at
FROM approval_queue aq
JOIN instagram_accounts ia ON aq.account_id = ia.id
WHERE aq.status = 'pending'
  AND aq.created_at > NOW() - INTERVAL '24 hours'
ORDER BY aq.created_at DESC;
```

---

## 5. Service Specifications

### 5.1 Video Composer Service

**Purpose:** Wrap FFmpeg for split-screen video composition

**Dependencies:**
- FFmpeg 6.x+
- fluent-ffmpeg npm package
- fs/promises (Node.js)

**Configuration:**
```typescript
const VIDEO_CONFIG = {
  outputWidth: 1080,
  outputHeight: 1920,
  topSectionHeight: 1152,  // 60%
  bottomSectionHeight: 768, // 40%
  codec: 'libx264',
  preset: 'medium',
  crf: 23,
  audioCodec: 'aac',
  audioBitrate: '128k'
};
```

**Error Handling:**
- Validate input file existence
- Check video format compatibility
- Handle FFmpeg process errors
- Retry on transient failures (max 3 attempts)
- Log detailed error messages with stack traces

---

### 5.2 Claude Client Service

**Purpose:** Generate story prompts and captions using Claude API

**Rate Limiting:**
- Max 5 requests per second
- Implement exponential backoff on 429 errors
- Cache responses for identical prompts (24-hour TTL)

**Prompt Templates:**

**Story Generation Template:**
```typescript
const STORY_PROMPT_TEMPLATE = `You are a creative video concept generator for Instagram Reels.

Generate a ${duration}-second video concept for ${theme} content.
Avoid repetition from these previous prompts: ${previousPrompts.join(', ')}

Requirements:
- Engaging visual narrative
- Clear beginning, middle, end
- Suitable for AI video generation
- Vertical format (9:16)
- ${theme} style

Return ONLY valid JSON in this exact format:
{
  "prompt": "Detailed visual description for AI video generation",
  "visualStyle": "Visual style and mood",
  "duration": ${duration},
  "category": "Content category"
}`;
```

**Caption Generation Template:**
```typescript
const CAPTION_PROMPT_TEMPLATE = `You are a social media expert for Instagram Reels.

Create an engaging caption for this video concept:
Story: ${storyPrompt}
Visual Style: ${visualStyle}
Account Theme: ${accountTheme}

Requirements:
- 1-2 sentences maximum
- Engaging hook (POV, question, or statement)
- 1-2 relevant emojis
- 10-15 hashtags (mix of niche and trending)

Return ONLY valid JSON in this exact format:
{
  "caption": "Engaging caption text with emojis",
  "hashtags": ["#tag1", "#tag2", ...],
  "hookType": "pov|question|statement"
}`;
```

---

### 5.3 Database Service

**Purpose:** PostgreSQL connection pool management

**Connection Pool Configuration:**
```typescript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'n8n_reels',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum pool connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000
});
```

**Query Wrapper with Error Handling:**
```typescript
async function query<T>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    logger.error('Database query error', { sql, params, error });
    throw error;
  } finally {
    client.release();
  }
}
```

---

## 6. Workflow Specifications

### 6.1 Master Workflow: `daily-reels-generator`

**Trigger:** Cron (Daily at 09:00 UTC)

**Nodes:**

1. **Cron Trigger**
   - Schedule: `0 9 * * *`
   - Timezone: UTC

2. **Get Active Accounts**
   - Type: PostgreSQL Query
   - Query: `SELECT * FROM instagram_accounts WHERE is_active = true`

3. **Loop Over Accounts**
   - Type: Split In Batches
   - Batch Size: 1
   - Options: Sequential execution

4. **Execute Sub-Workflow**
   - Type: Execute Workflow
   - Workflow: `generate-and-post-reel`
   - Wait for completion: true
   - Timeout: 3600 seconds

5. **Log Execution Result**
   - Type: PostgreSQL Insert
   - Table: `performance_metrics`

6. **Send Summary Notification**
   - Type: Discord Webhook / Email
   - Trigger: On workflow completion

**Error Handling:**
- Continue on error (don't stop entire batch if one account fails)
- Log failed accounts to `error_logs` table
- Send alert notification on >20% failure rate

---

### 6.2 Sub-Workflow: `generate-and-post-reel`

**Input:** Instagram account object

**Nodes:**

1. **Generate Story Prompt**
   - Type: HTTP Request (Claude API)
   - Input: Account theme, previous prompts
   - Output: Story prompt object

2. **Generate AI Video**
   - Type: HTTP Request (Luma API)
   - Input: Story prompt
   - Output: Job ID

3. **Poll Video Status**
   - Type: Loop with HTTP Request
   - Interval: 10 seconds
   - Max wait: 5 minutes
   - Exit condition: Status = 'completed'

4. **Download Generated Video**
   - Type: HTTP Request
   - Save to: `/var/lib/n8n/videos/temp/top_{timestamp}.mp4`

5. **Select Random Gameplay Video**
   - Type: PostgreSQL Query
   - Query: Random selection from pool

6. **Compose Videos**
   - Type: Execute Command (Node.js script)
   - Command: Call video-composer service
   - Output: `/var/lib/n8n/videos/temp/final_{timestamp}.mp4`

7. **Generate Caption**
   - Type: HTTP Request (Claude API)
   - Input: Story prompt, account theme
   - Output: Caption + hashtags

8. **Upload to CDN** (Optional)
   - Type: HTTP Request (S3/Cloudflare R2)
   - Get public URL for Instagram

9. **Add to Approval Queue**
   - Type: PostgreSQL Insert
   - Table: `approval_queue`
   - Status: 'pending'

10. **Send Approval Notification**
    - Type: Discord Webhook
    - Include: Video preview, caption, approve/reject buttons

**Error Handling:**
- Retry failed API calls (max 3 attempts)
- Fall back to Pika if Luma fails
- Log all errors to `error_logs` table
- Clean up temporary files on failure

---

### 6.3 Workflow: `process-approved-posts`

**Trigger:** Cron (Every 30 minutes)

**Nodes:**

1. **Get Approved Items**
   - Type: PostgreSQL Query
   - Query: `SELECT * FROM approval_queue WHERE status = 'approved'`

2. **For Each Approved Item**
   - Type: Loop

3. **Create Instagram Container**
   - Type: HTTP Request (Instagram API)
   - Output: Container ID

4. **Poll Container Status**
   - Type: Loop with HTTP Request
   - Wait for: Status = 'FINISHED'

5. **Publish Container**
   - Type: HTTP Request (Instagram API)
   - Output: Media ID + Permalink

6. **Update Database**
   - Type: PostgreSQL Update
   - Set: `status = 'posted'`, `posted_at = NOW()`

7. **Clean Up Files**
   - Type: Execute Command
   - Delete temporary video files

---

## 7. Configuration

### 7.1 Environment Variables

**File:** `.env`

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=n8n_reels
DB_USER=n8n
DB_PASSWORD=your_secure_password

# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password
WEBHOOK_URL=https://your-domain.com

# Claude API
CLAUDE_API_KEY=sk-ant-xxxxx
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Video API (Luma)
LUMA_API_KEY=luma_xxxxx
LUMA_API_URL=https://api.lumalabs.ai/dream-machine/v1

# Video API (Pika - Fallback)
PIKA_API_KEY=pika_xxxxx
PIKA_API_URL=https://api.pika.art/v1

# Instagram
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/callback

# File Storage
VIDEO_TEMP_DIR=/var/lib/n8n/videos/temp
VIDEO_POOL_DIR=/var/lib/n8n/videos/pool
VIDEO_OUTPUT_DIR=/var/lib/n8n/videos/output

# Notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/n8n-reels-automation

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### 7.2 PM2 Configuration

**File:** `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'n8n',
      script: 'n8n',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env_file: '/var/lib/n8n-reels-automation/.env',
      error_file: '/var/log/n8n-reels-automation/n8n-error.log',
      out_file: '/var/log/n8n-reels-automation/n8n-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};
```

---

## 8. Development Guide

### 8.1 Local Setup

**Prerequisites:**
- Node.js 20.x LTS
- PostgreSQL 15+
- FFmpeg 6.x+
- Git

**Steps:**

```bash
# 1. Clone repository
git clone <repository-url>
cd n8n-reels-automation

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your credentials

# 4. Set up database
createdb n8n_reels
psql n8n_reels < src/scripts/setup-db.sql

# 5. Create directories
mkdir -p data/videos/{temp,pool,output}
mkdir -p logs

# 6. Start development
npm run dev
```

### 8.2 Development Commands

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "db:migrate": "psql $DB_NAME < src/scripts/setup-db.sql",
    "db:seed": "ts-node src/scripts/seed-gameplay.ts"
  }
}
```

### 8.3 Testing

**Unit Tests:**
```typescript
// tests/services/video-composer.test.ts
describe('VideoComposer', () => {
  it('should compose videos with 60/40 split', async () => {
    const result = await composeVideos({
      topVideoPath: 'test/fixtures/top.mp4',
      bottomVideoPath: 'test/fixtures/bottom.mp4',
      outputPath: 'test/output/final.mp4'
    });
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.outputPath)).toBe(true);
  });
});
```

---

## 9. Deployment Guide

### 9.1 VPS Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
sudo apt install -y nodejs npm postgresql nginx ffmpeg

# 3. Install global packages
sudo npm install -g n8n pm2

# 4. Create user
sudo useradd -m -s /bin/bash n8n

# 5. Create directories
sudo mkdir -p /var/lib/n8n-reels-automation
sudo mkdir -p /var/lib/n8n/videos/{temp,pool,output}
sudo mkdir -p /var/log/n8n-reels-automation

# 6. Set permissions
sudo chown -R n8n:n8n /var/lib/n8n-reels-automation
sudo chown -R n8n:n8n /var/lib/n8n

# 7. Setup PostgreSQL
sudo -u postgres createdb n8n_reels
sudo -u postgres psql -c "CREATE USER n8n WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE n8n_reels TO n8n;"

# 8. Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 9.2 SSL Configuration

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 9.3 Deployment Checklist

- [ ] VPS provisioned and accessible
- [ ] All dependencies installed
- [ ] Database created and schema applied
- [ ] Environment variables configured
- [ ] Gameplay video pool populated (50+ clips)
- [ ] SSL certificate installed
- [ ] Nginx configured
- [ ] PM2 ecosystem file created
- [ ] n8n started and accessible
- [ ] Workflows imported
- [ ] Instagram API credentials configured
- [ ] Test run completed successfully

---

## 10. Operations Guide

### 10.1 Starting Services

```bash
# Start n8n with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
```

### 10.2 Monitoring

```bash
# View PM2 status
pm2 status

# View n8n logs
pm2 logs n8n

# View real-time logs
tail -f /var/log/n8n-reels-automation/n8n-out.log

# Monitor resource usage
pm2 monit
```

### 10.3 Database Maintenance

```bash
# Backup database
pg_dump n8n_reels | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip -c backup_20260104.sql.gz | psql n8n_reels

# Vacuum database (optimize)
psql n8n_reels -c "VACUUM ANALYZE;"
```

### 10.4 Common Operations

**Add New Instagram Account:**
```sql
INSERT INTO instagram_accounts (
  id, username, instagram_user_id, access_token, 
  token_expires_at, content_theme
) VALUES (
  'acc_002', 'new.account', '12345678', 'token_here',
  NOW() + INTERVAL '60 days', 'storytelling'
);
```

**Approve Pending Video:**
```sql
UPDATE approval_queue
SET status = 'approved', reviewed_at = NOW(), reviewed_by = 'admin'
WHERE id = 'queue_123';
```

**Clean Up Old Files:**
```bash
# Delete videos older than 7 days
find /var/lib/n8n/videos/temp -type f -mtime +7 -delete
```

### 10.5 Troubleshooting

**Issue: n8n not starting**
```bash
# Check logs
pm2 logs n8n --lines 100

# Restart service
pm2 restart n8n

# Check port availability
netstat -tulpn | grep 5678
```

**Issue: Database connection failed**
```bash
# Test connection
psql -h localhost -U n8n -d n8n_reels

# Check PostgreSQL status
sudo systemctl status postgresql
```

**Issue: FFmpeg composition fails**
```bash
# Test FFmpeg manually
ffmpeg -version

# Check video file permissions
ls -la /var/lib/n8n/videos/pool/

# Test composition manually
bash /usr/local/bin/compose-videos.sh top.mp4 bottom.mp4 output.mp4
```

**Issue: Instagram API errors**
```bash
# Check token validity
curl "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"

# View API logs
psql n8n_reels -c "SELECT * FROM api_usage_logs WHERE api_provider='instagram' ORDER BY created_at DESC LIMIT 10;"
```

---

**Document Status:** Complete  
**Last Updated:** 2026-01-04  
**Maintained By:** Development Team  
**Version:** 1.0
