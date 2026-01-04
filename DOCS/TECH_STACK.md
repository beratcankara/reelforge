# Technology Stack Definition

**Project:** Automated Split-Screen Instagram Reels Generator  
**Version:** 1.0  
**Last Updated:** 2026-01-04  
**Status:** Approved for Development

---

## 1. Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ORCHESTRATION LAYER                                     │    │
│  │  • n8n (Workflow Automation)                           │    │
│  │  • Cron (Scheduling)                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ APPLICATION LAYER                                       │    │
│  │  • Node.js 20.x LTS (Runtime)                          │    │
│  │  • TypeScript (Type Safety)                            │    │
│  │  • Express.js (API Server)                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ DATA LAYER                                              │    │
│  │  • PostgreSQL 15+ (Primary Database)                   │    │
│  │  • Redis (Caching & Job Queue)                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ PROCESSING LAYER                                        │    │
│  │  • FFmpeg 6.x+ (Video Composition)                     │    │
│  │  • Sharp (Image Processing)                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ EXTERNAL SERVICES                                       │    │
│  │  • Claude API 3.5 Sonnet (AI Text)                     │    │
│  │  • Luma Dream Machine (AI Video - Primary)            │    │
│  │  • Pika Labs (AI Video - Fallback)                     │    │
│  │  • Instagram Graph API v18.0 (Publishing)              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ INFRASTRUCTURE LAYER                                    │    │
│  │  • Ubuntu 22.04 LTS (OS)                               │    │
│  │  • Nginx (Reverse Proxy & SSL)                         │    │
│  │  • PM2 (Process Management)                            │    │
│  │  • Docker (Optional - Future)                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technologies

### 2.1 Orchestration & Automation

#### **n8n (Workflow Automation)**
- **Version:** Latest stable (self-hosted)
- **Purpose:** Visual workflow orchestration for entire automation pipeline
- **Why chosen:**
  - Low-code/no-code interface for rapid iteration
  - Self-hosted for full control and cost optimization
  - Built-in integrations with HTTP APIs
  - Visual debugging and execution history
  - Webhook support for Instagram callbacks
- **Installation:** `npm install -g n8n`

#### **Cron (Task Scheduling)**
- **Version:** System cron (built-in)
- **Purpose:** Daily workflow triggers at configured times
- **Configuration:** Native Linux crontab

---

### 2.2 Application Runtime

#### **Node.js**
- **Version:** 20.x LTS
- **Purpose:** Primary runtime for n8n and custom services
- **Why chosen:**
  - LTS support until April 2026
  - Best performance for I/O-heavy operations
  - Native async/await support
  - Rich ecosystem for video/API integrations
- **Installation:** Via NodeSource repository

#### **TypeScript**
- **Version:** 5.x
- **Purpose:** Type-safe development for custom services
- **Why chosen:**
  - Compile-time type checking
  - Better IDE support and autocomplete
  - Easier refactoring and maintenance
  - Industry standard for Node.js projects
- **Configuration:** `tsconfig.json` with strict mode

#### **Express.js** (Optional)
- **Version:** 4.x
- **Purpose:** Lightweight API server for approval queue interface
- **Use cases:**
  - Webhook endpoints for Instagram callbacks
  - Optional web dashboard for approvals
  - Health check endpoints

---

### 2.3 Data Persistence

#### **PostgreSQL**
- **Version:** 15+
- **Purpose:** Primary database for all persistent data
- **Schema:**
  - `instagram_accounts` - Account credentials & config
  - `generated_reels` - Content log & metadata
  - `gameplay_videos` - Video pool inventory
  - `approval_queue` - Pending approvals
  - `api_usage_logs` - Cost tracking
  - `performance_metrics` - Analytics
- **Why chosen:**
  - ACID compliance for critical data
  - JSONB support for flexible metadata
  - Excellent backup/restore tools
  - Better scalability than SQLite
- **Connection:** `pg` npm package with connection pooling

#### **Redis** (Optional - Phase 2)
- **Version:** 7.x
- **Purpose:** Job queue and caching layer
- **Use cases:**
  - Bull queue for video generation jobs
  - Cache frequently accessed gameplay videos
  - Session storage for approval interface
- **Why chosen:**
  - In-memory performance for job queues
  - Persistent queue support
  - Built-in pub/sub for notifications

---

### 2.4 Video Processing

#### **FFmpeg**
- **Version:** 6.x+
- **Purpose:** Video composition, encoding, and normalization
- **Key operations:**
  - Split-screen composition (60/40 vertical stack)
  - Format conversion (ensure H.264/AAC)
  - Resolution scaling (1080x1920)
  - Audio mixing and normalization
- **Installation:** `apt install ffmpeg`
- **Node.js wrapper:** `fluent-ffmpeg` npm package

#### **Sharp** (Optional)
- **Version:** Latest
- **Purpose:** Thumbnail generation for approval queue
- **Use cases:**
  - Extract first frame as preview image
  - Generate thumbnails for web interface
- **Installation:** `npm install sharp`

---

### 2.5 External API Services

#### **Claude API (Anthropic)**
- **Version:** Claude 3.5 Sonnet
- **Purpose:** 
  - Story prompt generation
  - Caption and hashtag generation
- **Why chosen:**
  - Superior creative writing quality
  - JSON mode for structured output
  - Context window up to 200K tokens
  - Reliable API with good rate limits
- **Pricing:** ~$3 per million input tokens, ~$15 per million output tokens
- **SDK:** `@anthropic-ai/sdk` npm package

#### **Luma Dream Machine (Primary Video API)**
- **Version:** Latest API
- **Purpose:** AI video generation from text prompts
- **Why chosen:**
  - High-quality output (1080p capable)
  - Reasonable generation time (2-5 minutes)
  - API access available
  - Good motion coherence
- **Pricing:** Credits-based, ~$0.10-0.30 per generation
- **Integration:** HTTP REST API

#### **Pika Labs (Fallback Video API)**
- **Version:** Latest API
- **Purpose:** Backup video generation provider
- **Why chosen:**
  - Alternative if Luma has downtime
  - Different style options
  - API access available
- **Pricing:** Subscription-based
- **Integration:** HTTP REST API

#### **Instagram Graph API**
- **Version:** v18.0
- **Purpose:** Content publishing to Instagram
- **Required scopes:**
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_read_engagement`
- **Why chosen:**
  - Official API (stable and supported)
  - No risk of account bans
  - Access to analytics
- **SDK:** Direct HTTP API calls (no official Node.js SDK)

---

### 2.6 Infrastructure

#### **Operating System: Ubuntu 22.04 LTS**
- **Why chosen:**
  - Long-term support until 2027
  - Excellent package management (apt)
  - Large community and documentation
  - Optimized for server workloads
- **VPS Requirements:**
  - 4 CPU cores
  - 8 GB RAM
  - 100 GB SSD storage
  - 5 TB/month bandwidth

#### **Nginx**
- **Version:** 1.24+
- **Purpose:** 
  - Reverse proxy for n8n
  - SSL/TLS termination
  - Static file serving (optional)
- **Why chosen:**
  - Industry standard for reverse proxying
  - Excellent performance
  - Easy Let's Encrypt integration
- **Installation:** `apt install nginx`

#### **PM2**
- **Version:** Latest
- **Purpose:** Process management for n8n and custom services
- **Features:**
  - Auto-restart on crashes
  - Log management
  - Startup script generation
  - CPU/memory monitoring
- **Installation:** `npm install -g pm2`

#### **Let's Encrypt (Certbot)**
- **Version:** Latest
- **Purpose:** Free SSL/TLS certificates
- **Why chosen:**
  - Free and automated
  - Auto-renewal support
  - Widely trusted
- **Installation:** `apt install certbot python3-certbot-nginx`

---

## 3. Development Tools

### 3.1 Version Control
- **Git:** For code versioning
- **GitHub/GitLab:** Repository hosting and collaboration
- **.gitignore:** Exclude secrets, node_modules, temp videos

### 3.2 Package Management
- **npm:** Node.js package manager (comes with Node.js)
- **package.json:** Dependency management
- **package-lock.json:** Lock versions for reproducibility

### 3.3 Environment Management
- **dotenv:** Environment variable management
- **.env files:** Store configuration and secrets locally
- **File structure:**
  - `.env.example` - Template with placeholder values
  - `.env` - Actual secrets (git-ignored)

### 3.4 Code Quality
- **ESLint:** JavaScript/TypeScript linting
- **Prettier:** Code formatting
- **Husky (Optional):** Pre-commit hooks
- **TypeScript:** Static type checking

### 3.5 Testing (Phase 2)
- **Jest:** Unit and integration testing
- **Supertest:** API endpoint testing
- **FFmpeg test suite:** Video quality validation

---

## 4. Key NPM Packages

### 4.1 Core Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "axios": "^1.6.0",
    "express": "^4.18.0",
    "fluent-ffmpeg": "^2.1.2",
    "pg": "^8.11.0",
    "dotenv": "^16.4.0",
    "winston": "^3.11.0",
    "bull": "^4.12.0",
    "ioredis": "^5.3.0",
    "sharp": "^0.33.0",
    "form-data": "^4.0.0"
  }
}
```

### 4.2 Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.0",
    "@types/fluent-ffmpeg": "^2.1.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
```

### 4.3 Package Descriptions

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Official Claude API client |
| `axios` | HTTP client for API calls |
| `express` | Web server framework |
| `fluent-ffmpeg` | FFmpeg wrapper for Node.js |
| `pg` | PostgreSQL client |
| `dotenv` | Environment variable loader |
| `winston` | Logging framework |
| `bull` | Redis-based job queue |
| `ioredis` | Redis client |
| `sharp` | Image processing |
| `form-data` | Multipart form data for uploads |

---

## 5. File Structure

```
/var/lib/n8n-reels-automation/
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Template for environment setup
├── package.json                  # NPM dependencies
├── tsconfig.json                 # TypeScript configuration
├── ecosystem.config.js           # PM2 process configuration
│
├── src/                          # Source code
│   ├── services/                 # Business logic services
│   │   ├── video-composer.ts     # FFmpeg video composition
│   │   ├── claude-client.ts      # Claude API wrapper
│   │   ├── video-api-client.ts   # AI Video API abstraction
│   │   ├── instagram-client.ts   # Instagram Graph API
│   │   └── database.ts           # PostgreSQL connection pool
│   │
│   ├── models/                   # Data models & types
│   │   ├── Account.ts
│   │   ├── Reel.ts
│   │   └── VideoMetadata.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts             # Winston logger setup
│   │   ├── error-handler.ts      # Error handling utilities
│   │   └── validation.ts         # Input validation
│   │
│   ├── scripts/                  # Standalone scripts
│   │   ├── compose-videos.sh     # FFmpeg shell script
│   │   ├── setup-db.sql          # Database schema
│   │   └── seed-gameplay.ts      # Populate video pool
│   │
│   └── server.ts                 # Express API server (optional)
│
├── workflows/                    # n8n workflow exports (JSON)
│   ├── daily-reels-generator.json
│   ├── generate-story-prompt.json
│   ├── generate-ai-video.json
│   └── post-to-instagram.json
│
├── data/                         # Data storage
│   ├── videos/
│   │   ├── temp/                 # Temporary working directory
│   │   ├── pool/                 # Gameplay video pool
│   │   │   ├── subway-surfers/
│   │   │   └── gta5-parkour/
│   │   └── output/               # Final composed videos
│   │
│   └── backups/                  # Database backups
│
├── logs/                         # Application logs
│   ├── n8n/
│   ├── application/
│   └── nginx/
│
└── docs/                         # Documentation
    ├── Architecture.md
    ├── PRD-Automated-Reels-Generator.md
    ├── implementation_plan.md
    ├── TECH_STACK.md
    └── API_DOCUMENTATION.md
```

---

## 6. Security Stack

### 6.1 Secrets Management
- **Environment Variables:** Store in `.env` file (never commit)
- **File Permissions:** `chmod 600` on sensitive files
- **Encryption at Rest:** AES-256-GCM for Instagram tokens
- **Key Rotation:** Automatic token refresh for Instagram

### 6.2 Network Security
- **Firewall:** UFW (Uncomplicated Firewall)
  - Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
  - n8n editor: localhost only or VPN-restricted
- **SSH:** Key-based authentication only
- **SSL/TLS:** Let's Encrypt certificates with auto-renewal

### 6.3 Application Security
- **Input Validation:** Validate all user inputs and API responses
- **SQL Injection Prevention:** Parameterized queries only
- **Command Injection Prevention:** Escape FFmpeg arguments
- **Rate Limiting:** Implement backoff for external APIs
- **HTTPS Only:** No plain HTTP for external communications

---

## 7. Monitoring & Observability Stack

### 7.1 Logging
- **Winston:** Application-level logging
- **Log Levels:** ERROR, WARN, INFO, DEBUG
- **Log Rotation:** Daily rotation, keep 30 days
- **Centralized Logs:** `/var/log/n8n-reels-automation/`

### 7.2 Monitoring (Phase 2)
- **Prometheus (Optional):** Metrics collection
- **Grafana (Optional):** Visualization dashboard
- **Custom Metrics:**
  - Workflow execution time
  - API response times
  - Success/failure rates
  - Cost per video

### 7.3 Alerting (Phase 2)
- **Discord Webhooks:** Real-time alerts for critical failures
- **Email Notifications:** Daily summary reports
- **Alert Rules:**
  - Workflow failure rate > 20%
  - API budget > 90%
  - Disk usage > 80%

---

## 8. Deployment Stack

### 8.1 Process Management
- **PM2:** Keep n8n and custom services running
- **Systemd:** Fallback for system-level services
- **Auto-restart:** On crashes and system reboot

### 8.2 Backup Strategy
- **PostgreSQL Backups:** Daily via `pg_dump`
- **Video Pool Backups:** Weekly via rsync
- **Retention:** 14 days
- **Storage:** Local + optional cloud backup

### 8.3 CI/CD (Phase 2)
- **GitHub Actions:** Automated testing and deployment
- **Deployment Script:** Bash script for VPS updates
- **Rollback Strategy:** Git-based version control

---

## 9. Cost Estimation (Monthly)

| Component | Provider | Cost |
|-----------|----------|------|
| **VPS** | DigitalOcean/Hetzner | $20-40 |
| **Claude API** | Anthropic (~60 calls/day) | $15-25 |
| **Video API** | Luma (~30 videos/month) | $150-250 |
| **Domain** | Namecheap | $10-15 |
| **SSL** | Let's Encrypt | $0 (Free) |
| **Redis (Optional)** | Self-hosted | $0 |
| **Monitoring (Optional)** | Uptime Robot | $0-10 |
| **Total** | | **$195-340** |

---

## 10. Technology Decision Records

### TDR-001: n8n vs Airflow
**Decision:** Use n8n  
**Rationale:** Lower barrier to entry, visual debugging, self-hosted control  
**Trade-offs:** Less programmatic control than Airflow  

### TDR-002: PostgreSQL vs MongoDB
**Decision:** Use PostgreSQL  
**Rationale:** Structured data, ACID compliance, better tooling for backups  
**Trade-offs:** Less flexible schema than NoSQL  

### TDR-003: TypeScript vs JavaScript
**Decision:** Use TypeScript for custom services  
**Rationale:** Type safety reduces runtime errors, better IDE support  
**Trade-offs:** Additional build step required  

### TDR-004: Luma vs Runway for AI Video
**Decision:** Use Luma as primary, Pika as fallback  
**Rationale:** Better API availability, good quality/cost ratio  
**Trade-offs:** API dependency on third-party service  

### TDR-005: Self-hosted vs Cloud Services
**Decision:** Self-host on VPS  
**Rationale:** Cost control, data ownership, learning opportunity  
**Trade-offs:** More maintenance responsibility  

---

## 11. Upgrade Path & Scalability

### Phase 1 (Current)
```
Single VPS → n8n → PostgreSQL → FFmpeg
```

### Phase 2 (3-6 months)
```
Single VPS + Redis Queue → Worker Pool → Shared Database
```

### Phase 3 (6-12 months)
```
Load Balancer → Multiple VPS Instances → PostgreSQL Primary/Replica
```

### Phase 4 (12+ months)
```
Kubernetes → Microservices → Cloud-native Storage
```

---

## 12. Tech Stack Validation Checklist

- ✅ All technologies are production-ready and stable
- ✅ Clear upgrade path defined for scaling
- ✅ Open-source options prioritized where possible
- ✅ Total cost fits within budget ($200-350/month)
- ✅ Technologies align with team expertise
- ✅ Security considerations addressed at each layer
- ✅ Monitoring and observability built-in
- ✅ Backup and disaster recovery strategies defined

---

**Approved by:** [Project Owner]  
**Date:** 2026-01-04  
**Next Steps:** Create technical documentation and begin Phase 0 implementation
