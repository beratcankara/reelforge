# PRD: Automated Split-Screen Instagram Reels Generator

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-01-04

---

## 1. Executive Summary

Build a fully automated system that generates and publishes split-screen Instagram Reels featuring:
- **Top 60%:** AI-generated storytelling/entertainment videos
- **Bottom 40%:** Copyright-free gameplay footage (Subway Surfers / GTA 5 parkour)

The system operates via n8n workflows on a VPS, scheduled via cron jobs, posting unique content daily to multiple Instagram accounts.

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SCHEDULER (Cron)                               │
│                         Daily Trigger at Configured Time                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MASTER n8n WORKFLOW                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  For each Instagram account in target list:                          │   │
│  │    1. Generate story concept/prompt                                  │   │
│  │    2. Call AI Video API to generate top video                        │   │
│  │    3. Select random bottom gameplay video from pool                  │   │
│  │    4. Composite videos (60/40 split)                                 │   │
│  │    5. Generate caption + hashtags                                    │   │
│  │    6. Upload & publish to Instagram                                  │   │
│  │    7. Log result + metadata                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Requirements

### 3.1 Video Specifications

| Parameter | Value |
|-----------|-------|
| Output Resolution | 1080x1920 (9:16 vertical) |
| Top Section (AI Video) | 60% height (approx 1080x1152) |
| Bottom Section (Gameplay) | 40% height (approx 1080x768) |
| Target Duration | 15-30 seconds |
| Format | MP4 (H.264 codec, AAC audio) |
| Frame Rate | 30 FPS |
| Bitrate | 4-6 Mbps (recommended for Instagram) |

### 3.2 AI Video Generation

**Requirements:**
- Text-to-video generation based on story prompts
- API-flexible design (support multiple providers)
- Generate 15-30 second clips
- Vertical orientation or adaptable to vertical crop

**Candidate APIs (to be evaluated):**

| Provider | API Access | Quality | Max Duration | Pricing Model |
|----------|-----------|---------|--------------|---------------|
| RunwayML Gen-3 | ✓ | High | 4-18s | Credits/second |
| Pika Labs | ✓ | Medium | 3-15s | Subscription |
| Luma Dream Machine | ✓ | High | 5-9s | Credits |
| Stable Video Diffusion | Open | Medium | 4s | Self-hosted |

**Recommendation:** Build abstraction layer to swap providers easily.

### 3.3 Gameplay Video Pool

**Requirements:**
- Pre-curated library of copyright-free gameplay footage
- Video types: Subway Surfers gameplay, GTA 5 parkour maps
- Organized by mood/energy level (optional metadata tagging)
- Minimum 50+ unique clips to avoid repetition
- Format: MP4, already sized for bottom 40% or full-screen for cropping

**Storage Structure:**
```
/gameplay-footage/
├── subway-surfers/
│   ├── high-energy/
│   │   ├── clip_001.mp4
│   │   ├── clip_002.mp4
│   │   └── ...
│   └── medium-energy/
│       └── ...
└── gta5-parkour/
    ├── chill/
    └── intense/
```

### 3.4 Story/Prompt Generation

**Requirements:**
- Generate engaging storytelling/entertainment concepts
- Themes: micro-stories, entertaining scenarios, intriguing hooks
- Length: 15-30 seconds of spoken or visual narrative
- Variety engine to avoid repetitive content

**Prompt Template Strategy:**
```
"Create a {15-30} second video showing {story concept}.
The video should be {style/mood}. Focus on {visual focus}.
End with a {hook/reveal/cliffhanger}."
```

**Story Categories:**
- Unexpected plot twists
- Relatable everyday situations
- "What if" scenarios
- Mini life lessons
- Humorous observations
- Intriguing questions

### 3.5 Caption & Hashtag Generation

**Caption Requirements:**
- 1-2 sentences maximum (Instagram attention span)
- Engaging hook or question
- Call-to-action optional
- Emoji usage (1-2 relevant emojis)

**Hashtag Strategy:**
- 3-5 high-relevance tags
- 3-5 medium-relevance tags
- 3-5 trending/viral tags (fetched dynamically if possible)
- Total: 15-25 hashtags

**Example:**
```
Caption: POV: When you realize the coffee maker was unplugged all morning ☕😤

Hashtags: #pov #relatable #morningstruggles #coffee #life #fyp #reels
#viral #trending #explore #funny #humor #storytime #story
```

### 3.6 Multi-Account Management

**Requirements:**
- Support N Instagram accounts
- Each account receives unique content (not identical reposts)
- Content can be:
  - Completely unique per account
  - Category-themed per account (e.g., one account for humor, one for motivation)
  - Rotated through accounts with variations

**Account Configuration Structure:**
```json
{
  "accounts": [
    {
      "id": "instagram_account_1",
      "name": "@example.account1",
      "credentials": "instagram_business_api_token",
      "content_theme": "humor",
      "posting_timezone": "America/New_York",
      "optimal_posting_time": "09:00"
    },
    {
      "id": "instagram_account_2",
      "name": "@example.account2",
      "credentials": "instagram_business_api_token",
      "content_theme": "storytelling",
      "posting_timezone": "Europe/London",
      "optimal_posting_time": "18:00"
    }
  ]
}
```

---

## 4. n8n Workflow Design

### 4.1 Master Workflow: `daily-reels-generator`

```
┌──────────────────┐
│  Cron Trigger    │  Daily at configured time
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Get Target      │  Fetch list of Instagram accounts
│  Accounts        │  to post to today
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Loop Over       │  For each account
│  Accounts        │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUB-WORKFLOW PER ACCOUNT                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Generate Story Prompt (AI - Claude/Codex)          │ │
│  │     ↓                                                   │ │
│  │  2. Call AI Video API with prompt                      │ │
│  │     ↓                                                   │ │
│  │  3. Download generated video                           │ │
│  │     ↓                                                   │ │
│  │  4. Select random gameplay video                       │ │
│  │     ↓                                                   │ │
│  │  5. Composite videos (FFmpeg or API)                   │ │
│  │     ↓                                                   │ │
│  │  6. Generate caption + hashtags (AI)                   │ │
│  │     ↓                                                   │ │
│  │  7. Upload to Instagram (Graph API)                    │ │
│  │     ↓                                                   │ │
│  │  8. Log success/failure + metadata to database        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Sub-Workflow: `generate-and-post-reel`

**Node-by-Node Breakdown:**

| Node | Purpose | Implementation |
|------|---------|----------------|
| **Start** | Triggered by master workflow | Webhook or direct call |
| **Get Account Config** | Fetch account-specific settings | Read from database/JSON |
| **Generate Prompt** | Create story concept | AI API (Claude) |
| **Call Video API** | Generate top video | HTTP Request (flexible provider) |
| **Wait for Completion** | Poll for video ready status | Loop with delay |
| **Download Video** | Get generated video file | HTTP Request → Binary file |
| **Select Gameplay** | Pick random bottom video | Random selection from pool |
| **Composite Videos** | Merge into split-screen | FFmpeg command or service API |
| **Generate Caption** | Create text + hashtags | AI API (Claude) |
| **Upload to Instagram** | Publish the Reel | Instagram Graph API |
| **Log Result** | Store metadata and status | Database write |
| **End** | Return success/failure | Response to master |

### 4.3 Error Handling Strategy

| Error Type | Handling Approach |
|------------|-------------------|
| AI Video API failure | Retry 3x with backoff; log failure; skip account for day |
| FFmpeg composite failure | Log error; store raw videos for manual review |
| Instagram API rate limit | Queue for retry; implement exponential backoff |
| Instagram upload failure | Store video locally; alert for manual posting |
| Network timeout | Retry with increasing delay; fail after 3 attempts |
| Account credential invalid | Alert immediately; skip account |

---

## 5. Instagram Posting Strategy

### 5.1 API Options

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Instagram Graph API** | Official, stable | Requires app review, business account | ✓ Primary choice |
| **Ayrshare API** | Easy setup, multi-platform | Monthly cost | Alternative |
| **Buffer/Hootsuite API** | Reliable, managed | Limited automation | Not recommended |

**Recommended: Instagram Graph API**
- Endpoint: `POST /{user-id}/media`
- Requires: Instagram Business Account + Facebook App
- Scopes: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`

### 5.2 Posting Flow

1. **Create Container:** Upload video, get container ID
2. **Publish Container:** Publish container, get media ID
3. **Verify:** Check post status
4. **Log:** Store media ID, permalink, timestamp

### 5.3 Rate Limiting

| Action | Limit |
|--------|-------|
| Video uploads per hour | ~25-50 (varies by app status) |
| Daily posts per account | Recommend max 1-2 to avoid spam flags |
| API calls per hour | 200 (hard limit) |

**Implementation:**
- Implement delays between account postings
- Respect 429 responses with backoff
- Stagger posts across optimal times

---

## 6. Data Models

### 6.1 Accounts Table

```sql
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
```

### 6.2 Generated Content Log

```sql
CREATE TABLE generated_reels (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) REFERENCES instagram_accounts(id),
  prompt_used TEXT,
  video_api_provider VARCHAR(50),
  video_api_call_id TEXT,
  caption TEXT,
  hashtags TEXT,
  instagram_media_id VARCHAR(100),
  instagram_permalink TEXT,
  posted_at TIMESTAMP,
  status VARCHAR(20), -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.3 Video Pool

```sql
CREATE TABLE gameplay_videos (
  id VARCHAR(50) PRIMARY KEY,
  file_path VARCHAR(255),
  category VARCHAR(50), -- 'subway-surfers', 'gta5-parkour'
  mood VARCHAR(50), -- 'high-energy', 'chill', etc.
  duration_seconds INT,
  last_used_at TIMESTAMP,
  use_count INT DEFAULT 0
);
```

---

## 7. Infrastructure Requirements

### 7.1 Server Specifications (VPS)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| Bandwidth | 2 TB/month | 5 TB/month |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 7.2 Software Stack

| Component | Version/Type |
|-----------|--------------|
| n8n | Latest (self-hosted) |
| Node.js | 18.x or 20.x |
| FFmpeg | 5.x+ |
| Database | PostgreSQL 14+ or SQLite |
| Python | 3.10+ (for utility scripts) |

### 7.3 External Services

| Service | Purpose |
|---------|---------|
| AI Video API | Top video generation |
| Claude API | Prompt + caption generation |
| Instagram Graph API | Content publishing |
| Cloud Storage (optional) | Video backup/CDN |

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up VPS with n8n, FFmpeg, database
- [ ] Configure Instagram Graph API access
- [ ] Create database schema
- [ ] Prepare gameplay video pool (50+ clips)
- [ ] Test AI video API options (select provider)

### Phase 2: Core Workflow (Week 2)
- [ ] Build video generation sub-workflow
- [ ] Implement FFmpeg composite pipeline
- [ ] Build caption generation pipeline
- [ ] Test video composition quality

### Phase 3: Instagram Integration (Week 3)
- [ ] Implement Instagram Graph API posting
- [ ] Test upload & publish flow
- [ ] Implement error handling & logging
- [ ] Configure multi-account support

### Phase 4: Automation & Scheduling (Week 4)
- [ ] Set up cron job triggers
- [ ] Implement master workflow with account loop
- [ ] Add monitoring & alerts
- [ ] End-to-end testing

### Phase 5: Optimization (Week 5+)
- [ ] Analyze performance metrics
- [ ] A/B test content variations
- [ ] Optimize posting times per account
- [ ] Scale to additional accounts

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily automation success rate | >95% | (successful posts / attempts) |
| Average video generation time | <5 minutes | From trigger to API completion |
| Average posting latency | <10 minutes | From generation to live on Instagram |
| Content uniqueness | >90% | Different prompts/videos per account |
| Uptime | >99% | System availability |

**Engagement Metrics (tracked via Instagram Insights):**
- Average views per Reel
- Engagement rate (likes + comments / views)
- Follower growth rate
- Save/share rate

---

## 10. Risks & Mitigations

### 10.1 High Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Instagram API suspension | High | Medium | Use official API; respect limits; manual review queue |
| AI video API downtime | Medium | Medium | Backup provider; queue for retry |
| Copyright claims on gameplay | High | Low | Use verified copyright-free sources only |
| Account shadowbanning | High | Medium | Vary content; limit posting frequency; human-like patterns |
| Cost overrun (AI APIs) | Medium | Medium | Set budgets; implement cost monitoring |

### 10.2 Platform Compliance

**Instagram Automation Best Practices:**
- ✅ Use official Instagram Graph API
- ✅ Respect rate limits strictly
- ✅ Vary posting times slightly (±30 min)
- ✅ Rotate through content themes
- ❌ Never use unofficial/automated likes/follows
- ❌ Never post duplicate content across accounts
- ❌ Never exceed 2-3 posts per day per account

---

## 11. Open Questions & Decisions Needed

| Question | Decision Needed By | Priority |
|----------|-------------------|----------|
| Which AI video API provider? | Before Phase 1 | High |
| Instagram Business App approval status? | Before Phase 2 | High |
| Total number of Instagram accounts to support? | Before Phase 2 | Medium |
| Budget for AI video generation costs? | Before Phase 1 | High |
| Should we implement content moderation/pre-review? | Before Phase 3 | Medium |
| Do we need analytics dashboard for performance? | Before Phase 5 | Low |

---

## 12. Appendix

### A. FFmpeg Composite Command Example

```bash
ffmpeg \
  -i top_video.mp4 \
  -i bottom_video.mp4 \
  -filter_complex "\
    [0:v]scale=1080:1152,crop=1080:1152[top];\
    [1:v]scale=1080:768,crop=1080:768[bottom];\
    [top][bottom]vstack" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -shortest \
  output_composite.mp4
```

### B. Instagram Graph API Endpoints

**Create Container:**
```http
POST https://graph.facebook.com/v18.0/{ig-user-id}/media
{
  "video_url": "https://example.com/video.mp4",
  "caption": "Your caption here",
  "media_type": "REELS"
}
```

**Publish Container:**
```http
POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
{
  "creation_id": "{container-id}"
}
```

---

**Document Status:** Ready for review and feedback.
