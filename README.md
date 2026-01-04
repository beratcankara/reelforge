# ReelForge

**Automated Split-Screen Instagram Reels Generator**

A fully automated system that generates and publishes split-screen Instagram Reels featuring AI-generated storytelling videos combined with copyright-free gameplay footage.

## Overview

ReelForge automates the creation of engaging Instagram Reels with:
- **Top 60%:** AI-generated storytelling/entertainment videos (via Luma/Pika APIs)
- **Bottom 40%:** Copyright-free gameplay footage (Subway Surfers / GTA 5 parkour)
- **Automated posting** to multiple Instagram accounts via Graph API
- **Scheduled execution** through n8n workflows on VPS

## Features

- Automated daily Reel generation and posting
- Multi-account Instagram management
- AI-powered story and caption generation (Claude API)
- Split-screen video composition (FFmpeg)
- Human approval queue before publishing
- PostgreSQL database for logging and metadata
- Configurable content themes per account

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Orchestration** | n8n (self-hosted) |
| **Runtime** | Node.js 20.x LTS |
| **Video Processing** | FFmpeg 6.x+ |
| **Database** | PostgreSQL 15+ |
| **AI - Text** | Claude API 3.5 Sonnet |
| **AI - Video** | Luma Dream Machine / Pika Labs |
| **Social API** | Instagram Graph API v18.0 |
| **Hosting** | Ubuntu 22.04 LTS VPS |
| **Reverse Proxy** | Nginx |
| **Process Manager** | PM2 |

## Project Structure

```
reelforge/
├── DOCS/
│   ├── PRD-Automated-Reels-Generator.md    # Product requirements
│   ├── Architecture.md                       # System architecture
│   ├── TECH_STACK.md                         # Technology stack details
│   ├── implementation_plan.md                # Implementation phases
│   └── TECHNICAL_DOCUMENTATION.md           # Technical docs
├── src/                                      # Source code (to be implemented)
│   ├── services/                             # Business logic
│   ├── models/                               # Data models
│   ├── utils/                                # Utilities
│   └── scripts/                              # Standalone scripts
├── workflows/                                # n8n workflow definitions
├── data/                                     # Data storage
│   └── videos/                               # Video pool and output
└── README.md
```

## Video Specifications

| Parameter | Value |
|-----------|-------|
| Output Resolution | 1080x1920 (9:16 vertical) |
| Top Section (AI Video) | 60% height (1080x1152) |
| Bottom Section (Gameplay) | 40% height (1080x768) |
| Target Duration | 15-30 seconds |
| Format | MP4 (H.264 codec, AAC audio) |
| Frame Rate | 30 FPS |

## Setup

### Prerequisites

- Ubuntu 22.04 LTS VPS (4 CPU, 8 GB RAM, 100 GB SSD)
- Node.js 20.x LTS
- PostgreSQL 15+
- FFmpeg 6.x+
- Instagram Business Account
- API keys for Claude, Video API, and Instagram

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/reelforge.git
cd reelforge

# Install dependencies
npm install

# Install n8n globally
npm install -g n8n

# Setup PM2
npm install -g pm2
pm2 startup
```

### Environment Configuration

Create `.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=n8n_reels
DB_USER=n8n
DB_PASSWORD=your_secure_password

# Claude API
CLAUDE_API_KEY=sk-ant-xxxxx

# Video API (Luma)
VIDEO_API_PROVIDER=luma
VIDEO_API_KEY=your_luma_key

# Instagram
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret

# n8n
N8N_HOST=localhost
N8N_PORT=5678
WEBHOOK_URL=https://your-domain.com/
```

### Database Setup

```bash
# Create database
sudo -u postgres createdb n8n_reels

# Run schema
psql -U n8n -d n8n_reels -f src/scripts/setup-db.sql
```

## Usage

### Start n8n

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Or start directly
n8n start
```

### Manual Workflow Execution

Access n8n editor at `http://localhost:5678` and trigger workflows manually.

### Scheduled Execution

Configure cron jobs:

```bash
# Daily at 9:00 AM
0 9 * * * /usr/bin/n8n execute --workflow=daily-reels-generator
```

## Documentation

- [Product Requirements (PRD)](DOCS/PRD-Automated-Reels-Generator.md)
- [System Architecture](DOCS/Architecture.md)
- [Technology Stack](DOCS/TECH_STACK.md)
- [Implementation Plan](DOCS/implementation_plan.md)
- [Technical Documentation](DOCS/TECHNICAL_DOCUMENTATION.md)

## Cost Estimation (Monthly)

| Service | Cost |
|---------|------|
| VPS | $20-40 |
| Claude API | $15-25 |
| Video API | $150-250 |
| Domain + SSL | $10-15 |
| **Total** | **$195-340** |

## Implementation Status

### Phase 1: Foundation (Week 1)
- [ ] Set up VPS with n8n, FFmpeg, database
- [ ] Configure Instagram Graph API access
- [ ] Create database schema
- [ ] Prepare gameplay video pool (50+ clips)
- [ ] Test AI video API options

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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Authors

- **Yusuf & Hazar** - Project owners

## Acknowledgments

- n8n for the excellent workflow automation platform
- Anthropic for Claude API
- Luma AI and Pika Labs for video generation APIs
