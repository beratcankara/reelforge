# PRD: Automated Reels Generator - Management Dashboard

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-01-04  
**Project:** Automated Split-Screen Instagram Reels Generator

---

## 1. Executive Summary

Build a full-featured web dashboard for managing the automated Instagram Reels generation system. The dashboard provides a single-user interface for approving videos, managing Instagram accounts, monitoring workflows, tracking analytics, and configuring system settings.

**Key Features:**
- Video approval workflow with caption/hashtag editing
- Instagram account management
- Real-time workflow monitoring and logs
- Analytics dashboard (engagement, costs, success rates)
- Manual workflow triggering
- System configuration and settings
- Discord + in-app notifications

**Tech Stack:**
- **Runtime:** Bun (not npm)
- **Backend:** Hono framework
- **Frontend:** React + Vite
- **UI:** shadcn/ui components
- **State:** Zustand
- **Database:** Drizzle ORM (PostgreSQL)
- **Auth:** OAuth (Google)
- **Deployment:** Coolify on same VPS
- **Domain:** dashboard.sitedomain.com

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
│                  https://dashboard.sitedomain.com                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY (SSL)                         │
│                     dashboard.sitedomain.com → :3000                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                ┌──────────────┴─────────────┐
                │                            │
                ▼                            ▼
┌────────────────────────┐      ┌────────────────────────┐
│  FRONTEND (React)      │      │  BACKEND (Hono)        │
│  • Vite build          │◄─────┤  • REST API            │
│  • shadcn/ui           │      │  • WebSocket (logs)    │
│  • Zustand state       │      │  • Google OAuth        │
│  Port: 3000            │      │  • File streaming      │
└────────────────────────┘      └───────────┬────────────┘
                                            │
                        ┌───────────────────┼────────────────┐
                        │                   │                │
                        ▼                   ▼                ▼
                ┌──────────────┐   ┌──────────────┐  ┌──────────┐
                │ PostgreSQL   │   │  n8n API     │  │  Discord │
                │ (Drizzle)    │   │  (Trigger)   │  │ Webhook  │
                └──────────────┘   └──────────────┘  └──────────┘
```

### 2.1 Component Breakdown

```
dashboard/
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── components/       # shadcn/ui components
│   │   ├── pages/            # Route pages
│   │   ├── stores/           # Zustand state stores
│   │   ├── lib/              # Utilities, API client
│   │   └── hooks/            # Custom React hooks
│   ├── package.json          # Bun dependencies
│   └── vite.config.ts
│
├── backend/                   # Hono API server
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, logging, CORS
│   │   ├── db/               # Drizzle schema & migrations
│   │   ├── websocket/        # WebSocket handlers
│   │   └── index.ts          # Entry point
│   ├── package.json          # Bun dependencies
│   └── drizzle.config.ts
│
├── shared/                    # Shared types/utils
│   └── types.ts              # TypeScript interfaces
│
└── docker-compose.yml         # Coolify deployment
```

---

## 3. User Stories & Features

### 3.1 Authentication & Access

**US-001: Single-User Google OAuth Login**
- **As a** dashboard user
- **I want to** log in using my Google account
- **So that** I can securely access the dashboard

**Acceptance Criteria:**
- ✅ Google OAuth 2.0 integration
- ✅ Only whitelisted email can access (configurable)
- ✅ Session management with secure cookies
- ✅ Auto-redirect to login if unauthenticated
- ✅ Logout functionality
- ✅ Session expires after 7 days

---

### 3.2 Approval Workflow

**US-002: View Pending Approvals**
- **As a** content reviewer
- **I want to** see all pending video approvals
- **So that** I can review and approve content

**Acceptance Criteria:**
- ✅ List view with video thumbnails
- ✅ Display: video preview, caption, hashtags, account, timestamp
- ✅ Sort by: date (newest first), account
- ✅ Filter by: account, status
- ✅ Pagination (20 items per page)
- ✅ Real-time updates when new items added

---

**US-003: Video Preview Player**
- **As a** content reviewer
- **I want to** watch the full video before approving
- **So that** I can verify quality and content

**Acceptance Criteria:**
- ✅ HTML5 video player with controls
- ✅ Play/pause, seek, volume control
- ✅ Fullscreen mode
- ✅ Video loads from backend (streamed from file system)
- ✅ Loading indicator while video buffers

---

**US-004: Edit Caption & Hashtags**
- **As a** content reviewer
- **I want to** edit the caption and hashtags before approving
- **So that** I can fix errors or improve engagement

**Acceptance Criteria:**
- ✅ Inline editing for caption (max 125 characters)
- ✅ Inline editing for hashtags (comma-separated or tag list)
- ✅ Character count indicator
- ✅ Save changes to database before approval
- ✅ Validation: caption not empty, hashtags start with #

---

**US-005: Approve/Reject Single Video**
- **As a** content reviewer
- **I want to** approve or reject a video
- **So that** approved videos are posted to Instagram

**Acceptance Criteria:**
- ✅ "Approve" button triggers immediate posting workflow
- ✅ "Reject" button marks as rejected with optional reason
- ✅ Confirmation modal before approval
- ✅ Loading state during posting process
- ✅ Success notification with permalink
- ✅ Error notification if posting fails
- ✅ Video removed from queue after action

---

**US-006: Batch Approval**
- **As a** content reviewer
- **I want to** approve multiple videos at once
- **So that** I can process approvals faster

**Acceptance Criteria:**
- ✅ Checkbox selection for multiple items
- ✅ "Select All" checkbox
- ✅ "Approve Selected" button (max 10 at once)
- ✅ Progress indicator showing N/M approved
- ✅ Individual error handling (continue on failure)
- ✅ Summary notification at completion

---

### 3.3 Account Management

**US-007: View Instagram Accounts**
- **As a** system administrator
- **I want to** see all configured Instagram accounts
- **So that** I can manage account settings

**Acceptance Criteria:**
- ✅ Table view with columns: username, theme, status, last post, actions
- ✅ Visual indicator: active (green), inactive (gray)
- ✅ Token expiration warning (< 7 days)
- ✅ Sort by: username, theme, last post date

---

**US-008: Add Instagram Account**
- **As a** system administrator
- **I want to** add a new Instagram account
- **So that** the system can post to additional accounts

**Acceptance Criteria:**
- ✅ Modal form with fields:
  - Instagram username
  - Instagram User ID
  - Access token (encrypted before storage)
  - Content theme (dropdown: humor, storytelling, motivation, etc.)
  - Posting timezone (dropdown)
  - Optimal posting time (time picker)
- ✅ Form validation: all fields required
- ✅ Test connection before saving
- ✅ Success notification on save
- ✅ Auto-refresh account list

---

**US-009: Edit Account Configuration**
- **As a** system administrator
- **I want to** edit account settings
- **So that** I can update themes or posting times

**Acceptance Criteria:**
- ✅ Edit modal with pre-filled values
- ✅ Cannot edit: username, Instagram User ID (readonly)
- ✅ Can edit: theme, timezone, posting time, active status
- ✅ Save updates to database
- ✅ Success notification

---

**US-010: Toggle Account Active/Inactive**
- **As a** system administrator
- **I want to** enable or disable accounts
- **So that** I can pause posting to specific accounts

**Acceptance Criteria:**
- ✅ Toggle switch in account list
- ✅ Confirmation modal before deactivation
- ✅ Updates `is_active` flag in database
- ✅ Visual feedback (color change)

---

**US-011: Delete Account**
- **As a** system administrator
- **I want to** delete an account
- **So that** I can remove unused accounts

**Acceptance Criteria:**
- ✅ Delete button with confirmation modal
- ✅ Warning: "This will delete all associated data"
- ✅ Cascade delete related records (generated_reels, approval_queue)
- ✅ Success notification

---

### 3.4 Analytics Dashboard

**US-012: Overview Statistics**
- **As a** system administrator
- **I want to** see key metrics at a glance
- **So that** I can monitor system health

**Acceptance Criteria:**
- ✅ Card widgets displaying:
  - Total videos posted (all-time)
  - Videos pending approval (current)
  - Success rate (last 30 days)
  - Total API cost (this month)
- ✅ Real-time updates (poll every 30s)
- ✅ Visual indicators (up/down arrows for trends)

---

**US-013: Success Rate Chart**
- **As a** system administrator
- **I want to** see workflow success rates over time
- **So that** I can identify reliability issues

**Acceptance Criteria:**
- ✅ Line chart: Date vs Success Rate (%)
- ✅ Time range selector: 7 days, 30 days, 90 days
- ✅ Hover tooltip showing exact percentage
- ✅ Color coding: >95% green, 80-95% yellow, <80% red

---

**US-014: API Cost Breakdown**
- **As a** system administrator
- **I want to** see cost breakdown by API provider
- **So that** I can track expenses

**Acceptance Criteria:**
- ✅ Pie chart: Cost by provider (Claude, Luma, Pika, Instagram)
- ✅ Total cost this month (USD)
- ✅ Cost trend: Last 7 days (bar chart)
- ✅ Budget indicator: Current vs monthly budget

---

**US-015: Engagement Metrics** (Future: Instagram Insights API)
- **As a** system administrator
- **I want to** see engagement metrics per account
- **So that** I can optimize content strategy

**Acceptance Criteria:**
- ✅ Table per account: Avg views, likes, comments, shares
- ✅ Engagement rate calculation
- ✅ Top performing videos (last 30 days)
- ✅ Note: Requires Instagram Insights API integration (Phase 2)

---

### 3.5 Video History

**US-016: View All Generated Videos**
- **As a** system administrator
- **I want to** see a history of all generated videos
- **So that** I can review past content

**Acceptance Criteria:**
- ✅ Table view with columns: date, account, caption, status, permalink
- ✅ Status badges: Pending, Approved, Posted, Rejected, Failed
- ✅ Filter by: account, status, date range
- ✅ Search by: caption text
- ✅ Pagination (50 items per page)

---

**US-017: View Video Details**
- **As a** system administrator
- **I want to** click on a video to see full details
- **So that** I can review metadata and performance

**Acceptance Criteria:**
- ✅ Modal with:
  - Video player
  - Prompt used (story concept)
  - Caption & hashtags
  - Instagram permalink (if posted)
  - Timestamps (created, posted)
  - API provider used
  - Cost breakdown
- ✅ Link to Instagram post (opens in new tab)

---

**US-018: Repost Failed Videos**
- **As a** system administrator
- **I want to** retry posting failed videos
- **So that** I don't lose content

**Acceptance Criteria:**
- ✅ "Retry Post" button for failed videos
- ✅ Re-triggers Instagram posting workflow
- ✅ Updates status to "pending" → "posted"
- ✅ Error notification if retry fails

---

### 3.6 Manual Workflow Trigger

**US-019: Trigger Generation for Specific Account**
- **As a** system administrator
- **I want to** manually trigger video generation for an account
- **So that** I can create content on-demand

**Acceptance Criteria:**
- ✅ "Generate Now" button in account list
- ✅ Confirmation modal: "Generate video for @username?"
- ✅ Triggers n8n workflow via webhook/API
- ✅ Loading state during generation
- ✅ Success notification when video added to approval queue
- ✅ Real-time progress indicator (optional)

---

**US-020: Trigger Batch Generation**
- **As a** system administrator
- **I want to** trigger generation for all active accounts
- **So that** I can run the daily workflow manually

**Acceptance Criteria:**
- ✅ "Generate All" button in dashboard header
- ✅ Confirmation modal: "Generate videos for N active accounts?"
- ✅ Triggers master n8n workflow
- ✅ Progress indicator: N/M accounts processed
- ✅ Summary notification at completion

---

### 3.7 Real-time Logs

**US-021: View Workflow Execution Logs**
- **As a** system administrator
- **I want to** see real-time workflow logs
- **So that** I can debug issues

**Acceptance Criteria:**
- ✅ Log viewer component (terminal-style)
- ✅ WebSocket connection for live updates
- ✅ Log levels: ERROR (red), WARN (yellow), INFO (white), DEBUG (gray)
- ✅ Auto-scroll to bottom (with pause option)
- ✅ Filter by: log level, workflow name
- ✅ Search logs by keyword
- ✅ Download logs as .txt file

---

**US-022: View Error Logs**
- **As a** system administrator
- **I want to** see a list of recent errors
- **So that** I can identify and fix issues

**Acceptance Criteria:**
- ✅ Table view: timestamp, error type, message, severity
- ✅ Color coding by severity: Critical (red), High (orange), Medium (yellow)
- ✅ Expandable rows showing stack trace
- ✅ "Mark as Resolved" button
- ✅ Filter by: resolved/unresolved, severity, error type

---

### 3.8 Settings & Configuration

**US-023: View System Configuration**
- **As a** system administrator
- **I want to** see current system settings
- **So that** I can verify configuration

**Acceptance Criteria:**
- ✅ Read-only display of:
  - Database connection status
  - n8n connection status
  - API providers configured (Claude, Luma, Pika)
  - Discord webhook URL (masked)
  - Workflow schedule (cron expression)

---

**US-024: Edit Environment Variables** (Sensitive)
- **As a** system administrator
- **I want to** update API keys and settings
- **So that** I can rotate credentials

**Acceptance Criteria:**
- ✅ Form with fields:
  - Claude API Key (masked)
  - Luma API Key (masked)
  - Pika API Key (masked)
  - Discord Webhook URL (masked)
- ✅ "Show/Hide" toggle for each secret
- ✅ Validation: required fields not empty
- ✅ Confirmation modal before saving
- ✅ Restart notification: "Changes require service restart"
- ✅ **Security:** Only accessible after re-authentication

---

**US-025: Configure Workflow Schedule**
- **As a** system administrator
- **I want to** change the daily trigger time
- **So that** I can optimize posting times

**Acceptance Criteria:**
- ✅ Time picker for daily trigger
- ✅ Preview: "Next execution: YYYY-MM-DD HH:MM"
- ✅ Updates n8n cron trigger via API
- ✅ Success notification

---

### 3.9 Notifications

**US-026: In-App Notifications**
- **As a** dashboard user
- **I want to** see notifications within the dashboard
- **So that** I'm informed of important events

**Acceptance Criteria:**
- ✅ Notification bell icon in header with badge count
- ✅ Dropdown showing recent notifications (last 10)
- ✅ Notification types:
  - New video pending approval
  - Video posted successfully
  - Posting failed
  - Workflow execution completed
  - Error occurred
- ✅ Click to navigate to relevant page
- ✅ "Mark all as read" button
- ✅ Persist unread status in database

---

**US-027: Discord Webhook Integration**
- **As a** system administrator
- **I want to** receive Discord notifications
- **So that** I'm alerted on mobile/desktop

**Acceptance Criteria:**
- ✅ Send Discord message for:
  - New video pending approval (with thumbnail)
  - Video posted successfully (with permalink)
  - Critical errors
- ✅ Embed format with color coding (green=success, red=error)
- ✅ Toggle on/off in settings

---

## 4. Technical Specifications

### 4.1 Backend API (Hono)

**Base URL:** `https://dashboard.sitedomain.com/api`

#### 4.1.1 Authentication Endpoints

```typescript
POST   /api/auth/google          # Initiate Google OAuth
GET    /api/auth/google/callback # OAuth callback
POST   /api/auth/logout          # Logout
GET    /api/auth/session         # Check session status
```

#### 4.1.2 Approval Queue Endpoints

```typescript
GET    /api/approvals              # List pending approvals
GET    /api/approvals/:id          # Get single approval
PUT    /api/approvals/:id          # Update caption/hashtags
POST   /api/approvals/:id/approve  # Approve & post immediately
POST   /api/approvals/:id/reject   # Reject with reason
POST   /api/approvals/batch-approve # Approve multiple
```

#### 4.1.3 Account Management Endpoints

```typescript
GET    /api/accounts               # List all accounts
GET    /api/accounts/:id           # Get account details
POST   /api/accounts               # Create account
PUT    /api/accounts/:id           # Update account
DELETE /api/accounts/:id           # Delete account
PATCH  /api/accounts/:id/toggle    # Toggle active status
```

#### 4.1.4 Analytics Endpoints

```typescript
GET    /api/analytics/overview     # Dashboard stats
GET    /api/analytics/success-rate # Success rate chart data
GET    /api/analytics/costs        # Cost breakdown
GET    /api/analytics/engagement   # Engagement metrics (future)
```

#### 4.1.5 Video History Endpoints

```typescript
GET    /api/videos                 # List all generated videos
GET    /api/videos/:id             # Get video details
POST   /api/videos/:id/retry       # Retry failed post
```

#### 4.1.6 Workflow Trigger Endpoints

```typescript
POST   /api/workflows/trigger/:accountId  # Trigger for account
POST   /api/workflows/trigger-all         # Trigger for all accounts
GET    /api/workflows/status/:executionId # Get execution status
```

#### 4.1.7 Logs Endpoints

```typescript
GET    /api/logs                   # Get logs (paginated)
WS     /api/logs/stream            # WebSocket for live logs
GET    /api/errors                 # Get error logs
PATCH  /api/errors/:id/resolve     # Mark error as resolved
```

#### 4.1.8 Settings Endpoints

```typescript
GET    /api/settings/system        # Get system config
PUT    /api/settings/env           # Update environment variables
PUT    /api/settings/schedule      # Update workflow schedule
GET    /api/settings/health        # Health check
```

#### 4.1.9 File Streaming Endpoints

```typescript
GET    /api/videos/:id/stream      # Stream video file
GET    /api/videos/:id/thumbnail   # Get video thumbnail
```

#### 4.1.10 Notification Endpoints

```typescript
GET    /api/notifications          # Get user notifications
PATCH  /api/notifications/:id/read # Mark as read
POST   /api/notifications/read-all # Mark all as read
```

---

### 4.2 Database Schema (Drizzle ORM)

**New Tables for Dashboard:**

```typescript
// dashboard_users
export const dashboardUsers = pgTable('dashboard_users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// notifications
export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 50 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).references(() => dashboardUsers.id),
  type: varchar('type', { length: 50 }).notNull(), // approval_pending, post_success, post_failed, error
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  metadata: json('metadata'), // { videoId, accountId, etc. }
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// sessions (for auth)
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).references(() => dashboardUsers.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Indexes:**
```typescript
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

---

### 4.3 Frontend Architecture

#### 4.3.1 Routing (React Router)

```typescript
/                          # Dashboard overview (analytics)
/approvals                 # Approval queue
/approvals/:id             # Approval detail (modal)
/accounts                  # Account management
/videos                    # Video history
/logs                      # Real-time logs
/errors                    # Error logs
/settings                  # System settings
/login                     # Login page
```

#### 4.3.2 Zustand Stores

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

// approvalStore.ts
interface ApprovalState {
  approvals: Approval[];
  selectedIds: string[];
  isLoading: boolean;
  fetchApprovals: () => Promise<void>;
  updateCaption: (id: string, caption: string, hashtags: string[]) => Promise<void>;
  approve: (id: string) => Promise<void>;
  batchApprove: (ids: string[]) => Promise<void>;
  reject: (id: string, reason?: string) => Promise<void>;
}

// accountStore.ts
interface AccountState {
  accounts: InstagramAccount[];
  fetchAccounts: () => Promise<void>;
  addAccount: (account: NewAccount) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

// analyticsStore.ts
interface AnalyticsState {
  overview: OverviewStats;
  successRateData: ChartData;
  costData: CostBreakdown;
  fetchOverview: () => Promise<void>;
  fetchSuccessRate: (range: TimeRange) => Promise<void>;
  fetchCosts: () => Promise<void>;
}

// notificationStore.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// logsStore.ts
interface LogsState {
  logs: LogEntry[];
  isConnected: boolean;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  clearLogs: () => void;
}
```

#### 4.3.3 shadcn/ui Components Used

```
✅ Button
✅ Card
✅ Table
✅ Dialog (Modal)
✅ Form
✅ Input
✅ Label
✅ Select
✅ Checkbox
✅ Switch
✅ Badge
✅ Alert
✅ Tabs
✅ Dropdown Menu
✅ Avatar
✅ Separator
✅ Textarea
✅ Toast (Notifications)
✅ Skeleton (Loading states)
✅ Sheet (Sidebar)
✅ Command (Search)
✅ Calendar
✅ Progress
✅ Tooltip
```

#### 4.3.4 Custom Components

```typescript
// VideoPlayer.tsx
interface VideoPlayerProps {
  videoId: string;
  onError?: (error: Error) => void;
}

// ApprovalCard.tsx
interface ApprovalCardProps {
  approval: Approval;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, updates: EditUpdates) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

// AccountCard.tsx
interface AccountCardProps {
  account: InstagramAccount;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onTrigger: (id: string) => void;
}

// StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; value: string };
  icon: React.ComponentType;
}

// LogViewer.tsx
interface LogViewerProps {
  logs: LogEntry[];
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

// SuccessRateChart.tsx
interface SuccessRateChartProps {
  data: ChartData;
  timeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

// CostBreakdownChart.tsx (Pie Chart)
// CostTrendChart.tsx (Bar Chart)
```

---

### 4.4 WebSocket Protocol

**Connection:** `wss://dashboard.sitedomain.com/api/logs/stream`

**Client → Server Messages:**
```json
{
  "type": "subscribe",
  "filters": {
    "level": ["ERROR", "WARN", "INFO"],
    "workflow": "daily-reels-generator"
  }
}

{
  "type": "unsubscribe"
}
```

**Server → Client Messages:**
```json
{
  "type": "log",
  "data": {
    "timestamp": "2026-01-04T22:30:00Z",
    "level": "INFO",
    "workflow": "generate-and-post-reel",
    "message": "Video generated successfully",
    "metadata": {
      "accountId": "acc_001",
      "videoId": "vid_123"
    }
  }
}

{
  "type": "notification",
  "data": {
    "id": "notif_123",
    "type": "approval_pending",
    "title": "New video pending approval",
    "message": "Video for @example.account is ready for review"
  }
}
```

---

### 4.5 Immediate Posting on Approval

When user clicks "Approve":

1. **Frontend** sends `POST /api/approvals/:id/approve`
2. **Backend** handler:
   ```typescript
   async function approveAndPost(approvalId: string) {
     // 1. Update approval status
     await db.update(approvalQueue)
       .set({ status: 'approved', reviewedAt: new Date() })
       .where(eq(approvalQueue.id, approvalId));
     
     // 2. Get video and account details
     const approval = await db.query.approvalQueue.findFirst({
       where: eq(approvalQueue.id, approvalId),
       with: { reel: true, account: true }
     });
     
     // 3. Trigger Instagram posting immediately
     const result = await instagramClient.createContainer({
       accountId: approval.account.instagramUserId,
       videoUrl: approval.reel.finalVideoPath, // or CDN URL
       caption: approval.caption,
       hashtags: approval.hashtags
     });
     
     // 4. Poll for upload completion
     let status = await instagramClient.checkUploadStatus(result.containerId);
     while (status.status !== 'FINISHED') {
       await sleep(5000);
       status = await instagramClient.checkUploadStatus(result.containerId);
     }
     
     // 5. Publish container
     const publishResult = await instagramClient.publishContainer({
       accountId: approval.account.instagramUserId,
       containerId: result.containerId
     });
     
     // 6. Update database
     await db.update(generatedReels)
       .set({
         status: 'posted',
         instagramMediaId: publishResult.mediaId,
         instagramPermalink: publishResult.permalink,
         postedAt: new Date()
       })
       .where(eq(generatedReels.id, approval.reelId));
     
     // 7. Send notifications
     await sendDiscordNotification({
       type: 'success',
       message: `Video posted to @${approval.account.username}`,
       permalink: publishResult.permalink
     });
     
     await createNotification({
       type: 'post_success',
       title: 'Video posted successfully',
       message: `Posted to @${approval.account.username}`,
       metadata: { reelId: approval.reelId, permalink: publishResult.permalink }
     });
     
     return { success: true, permalink: publishResult.permalink };
   }
   ```

3. **Frontend** receives response and shows toast notification

---

## 5. UI/UX Design

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [Logo] Dashboard    [Search]           [Bell] [Avatar] [Menu]  │
├─────────────────────────────────────────────────────────────────┤
│ SIDEBAR │               MAIN CONTENT                             │
│         │                                                        │
│ Home    │  ┌──────────────────────────────────────────────────┐ │
│ Approve │  │                                                  │ │
│ Accounts│  │          Page Content Here                       │ │
│ Videos  │  │                                                  │ │
│ Logs    │  │                                                  │ │
│ Settings│  │                                                  │ │
│         │  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Color Scheme (Dark Mode Priority)

```typescript
const theme = {
  primary: '#3b82f6',      // Blue
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Yellow
  error: '#ef4444',        // Red
  background: '#0f172a',   // Dark blue-gray
  surface: '#1e293b',      // Lighter dark
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
  }
};
```

### 5.3 Page Mockups

#### Dashboard Overview Page
```
┌────────────────────────────────────────────────────────────┐
│  Dashboard Overview                                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Posted   │  │ Pending  │  │ Success  │  │ Cost     │  │
│  │   247    │  │    3     │  │  97.2%   │  │  $284    │  │
│  │ ↑ +12    │  │ ↓ -2     │  │ ↑ +1.2%  │  │ ↓ -$16   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Success Rate (Last 30 Days)                         │  │
│  │                                                      │  │
│  │  100% ┤                     ╭─────────╮             │  │
│  │   95% ┤     ╭───────────────╯         ╰────         │  │
│  │   90% ┤─────╯                                       │  │
│  │       └─────┬─────┬─────┬─────┬─────┬─────┬────    │  │
│  │           Jan 1  Jan 10  Jan 20  Jan 30             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────┐  ┌──────────────────────────────┐ │
│  │ API Cost Breakdown │  │ Recent Activity              │ │
│  │                    │  │                              │ │
│  │   [Pie Chart]      │  │ • Video posted to @acc1     │ │
│  │                    │  │ • Approval pending @acc2    │ │
│  │   Claude: 45%      │  │ • Error: API timeout        │ │
│  │   Luma:   52%      │  │ • Workflow completed        │ │
│  │   Instagram: 3%    │  │                              │ │
│  └────────────────────┘  └──────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

#### Approval Queue Page
```
┌────────────────────────────────────────────────────────────┐
│  Approval Queue                          [Generate All]     │
├────────────────────────────────────────────────────────────┤
│  [☑ Select All]  [Approve Selected (3)]                    │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ ☑ [Video Thumbnail]  @example.account                  ││
│  │                                                         ││
│  │   POV: When you realize... ☕😤                        ││
│  │   #pov #coffee #relatable #fyp                         ││
│  │                                                         ││
│  │   [Edit] [Preview] [Approve] [Reject]    2 hours ago  ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ ☐ [Video Thumbnail]  @another.account                  ││
│  │   ...                                                   ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

#### Account Management Page
```
┌────────────────────────────────────────────────────────────┐
│  Instagram Accounts                     [+ Add Account]     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Username      Theme         Status    Last Post      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ @example.acc  Humor         🟢 Active  2 hours ago   │  │
│  │ [Edit] [Generate] [Toggle]                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ @story.acc    Storytelling  🟢 Active  1 day ago     │  │
│  │ [Edit] [Generate] [Toggle]                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ @motivate.acc Motivation    🔴 Inactive  5 days ago  │  │
│  │ [Edit] [Generate] [Toggle]  ⚠️ Token expires in 5d  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Security Requirements

### 6.1 Authentication
- ✅ Google OAuth 2.0 with PKCE flow
- ✅ Session-based auth with secure HTTP-only cookies
- ✅ Session expires after 7 days
- ✅ CSRF protection on all state-changing requests
- ✅ Email whitelist check (only allowed email can access)

### 6.2 Authorization
- ✅ All API endpoints require authentication
- ✅ Settings endpoints require re-authentication (session <30 min old)
- ✅ API keys masked in UI (show last 4 characters only)

### 6.3 Data Security
- ✅ Instagram access tokens encrypted at rest (AES-256-GCM)
- ✅ API keys stored in environment variables (not in database)
- ✅ HTTPS only (redirect HTTP → HTTPS)
- ✅ Secure headers (Helmet.js middleware)
- ✅ Rate limiting: 100 req/min per IP

### 6.4 Input Validation
- ✅ Sanitize all user inputs (prevent XSS)
- ✅ Validate file uploads (video streaming only, no uploads)
- ✅ SQL injection prevention (Drizzle ORM parameterized queries)

---

## 7. Performance Requirements

### 7.1 Response Times
| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Page load | <1s | 2s |
| API call (simple) | <200ms | 500ms |
| API call (complex) | <1s | 3s |
| Video streaming | <2s to start | 5s |
| WebSocket connection | <500ms | 1s |

### 7.2 Scalability
- Support up to **20 Instagram accounts**
- Handle **100+ videos** in history
- Real-time logs: **1000 log entries** buffered

### 7.3 Optimization
- ✅ Frontend: Code splitting, lazy loading
- ✅ Backend: Database query optimization with indexes
- ✅ Caching: Cache analytics data (5 min TTL)
- ✅ Video streaming: Range requests for seeking

---

## 8. Deployment & DevOps

### 8.1 Coolify Setup

**Project Structure in Coolify:**
```
Service Name: reels-dashboard
Git Repository: <your-repo>
Build Pack: Dockerfile
Environment: Production
```

**Dockerfile:**
```dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN cd frontend && bun run build

# Build backend
RUN cd backend && bun build ./src/index.ts --outdir ./dist --target bun

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/drizzle ./backend/drizzle

# Install production dependencies
WORKDIR /app/backend
RUN bun install --production

# Expose port
EXPOSE 3000

# Start server
CMD ["bun", "run", "dist/index.js"]
```

### 8.2 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/n8n_reels

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://dashboard.sitedomain.com/api/auth/google/callback
ALLOWED_EMAIL=your.email@gmail.com

# Session
SESSION_SECRET=random_secret_key_32_chars_min

# n8n Integration
N8N_WEBHOOK_URL=https://sitedomain.com/webhook/trigger-workflow
N8N_API_KEY=your_n8n_api_key

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://dashboard.sitedomain.com
```

### 8.3 Domain Configuration

**Coolify Domain Settings:**
- Domain: `dashboard.sitedomain.com`
- SSL: Auto-generate Let's Encrypt certificate
- Force HTTPS: Enabled

**Nginx Configuration (Coolify handles this):**
```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.sitedomain.com;
    
    ssl_certificate /etc/letsencrypt/live/dashboard.sitedomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.sitedomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /api/logs/stream {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests
- ✅ Hono route handlers
- ✅ Drizzle queries
- ✅ Zustand stores
- ✅ React components (React Testing Library)

### 9.2 Integration Tests
- ✅ API endpoints (E2E with test database)
- ✅ OAuth flow
- ✅ WebSocket connection

### 9.3 Manual Testing Checklist
- [ ] Login with Google OAuth
- [ ] View pending approvals
- [ ] Edit caption and hashtags
- [ ] Approve video and verify Instagram post
- [ ] Batch approve multiple videos
- [ ] Add new Instagram account
- [ ] Trigger manual generation
- [ ] View real-time logs
- [ ] Check analytics charts
- [ ] Receive Discord notification
- [ ] Update API key in settings

---

## 10. Development Phases

### Phase 1: Foundation (Week 1)
**Goal:** Project setup, authentication, basic layout

- [ ] Initialize Bun monorepo structure
- [ ] Set up Hono backend with Drizzle ORM
- [ ] Configure PostgreSQL connection
- [ ] Create database schema (Drizzle migrations)
- [ ] Implement Google OAuth authentication
- [ ] Set up React + Vite frontend
- [ ] Install and configure shadcn/ui
- [ ] Create basic layout (header, sidebar, routing)
- [ ] Set up Zustand stores
- [ ] Deploy to Coolify (CI/CD pipeline)

**Deliverable:** Working authentication and basic dashboard shell

---

### Phase 2: Approval Workflow (Week 2)
**Goal:** Core approval functionality

- [ ] Build approval queue API endpoints
- [ ] Create approval list page
- [ ] Implement video player component
- [ ] Build caption/hashtag editor
- [ ] Implement approve/reject actions
- [ ] Add batch approval functionality
- [ ] Integrate with Instagram API (posting)
- [ ] Implement immediate posting on approval
- [ ] Add success/error notifications

**Deliverable:** Fully functional approval workflow

---

### Phase 3: Account Management (Week 3)
**Goal:** Instagram account CRUD operations

- [ ] Build account management API endpoints
- [ ] Create accounts list page
- [ ] Build add account modal/form
- [ ] Implement edit account functionality
- [ ] Add toggle active/inactive
- [ ] Build manual trigger functionality
- [ ] Test Instagram API connection
- [ ] Add token expiration warnings

**Deliverable:** Complete account management system

---

### Phase 4: Analytics & Monitoring (Week 4)
**Goal:** Dashboard analytics and real-time logs

- [ ] Build analytics API endpoints
- [ ] Create overview statistics cards
- [ ] Implement success rate chart (Recharts/Chart.js)
- [ ] Build cost breakdown pie chart
- [ ] Create video history page
- [ ] Build real-time log viewer
- [ ] Implement WebSocket connection for live logs
- [ ] Create error logs page
- [ ] Add log filtering and search

**Deliverable:** Analytics dashboard and monitoring tools

---

### Phase 5: Settings & Polish (Week 5)
**Goal:** Configuration, notifications, final touches

- [ ] Build settings API endpoints
- [ ] Create system settings page
- [ ] Implement environment variable editor
- [ ] Add workflow schedule configuration
- [ ] Build notification system
- [ ] Implement Discord webhook integration
- [ ] Add in-app notification center
- [ ] Polish UI/UX (animations, loading states)
- [ ] Add dark mode toggle (if not default)
- [ ] Write user documentation
- [ ] Performance optimization
- [ ] Security audit

**Deliverable:** Production-ready dashboard

---

### Phase 6: Testing & Launch (Week 6)
**Goal:** Comprehensive testing and production deployment

- [ ] Write unit tests (80% coverage target)
- [ ] Write integration tests
- [ ] Manual QA testing
- [ ] Load testing (simulate 20 accounts)
- [ ] Security testing (OWASP top 10)
- [ ] Fix critical bugs
- [ ] Final deployment to production
- [ ] Monitor for 48 hours
- [ ] User acceptance testing

**Deliverable:** Live, stable production system

---

## 11. Success Criteria

### 11.1 Functional Requirements
- ✅ User can approve videos in <30 seconds
- ✅ Approved videos post to Instagram within 5 minutes
- ✅ Batch approval processes 10 videos in <2 minutes
- ✅ Account creation takes <1 minute
- ✅ Analytics update in real-time (max 30s delay)
- ✅ Logs stream with <1s latency

### 11.2 Performance Requirements
- ✅ Page load time <2 seconds
- ✅ API response time <500ms (95th percentile)
- ✅ Video playback starts <3 seconds
- ✅ No memory leaks after 24-hour operation
- ✅ Handles 20 concurrent accounts without degradation

### 11.3 Reliability Requirements
- ✅ 99.5% uptime
- ✅ Automatic reconnection on WebSocket disconnect
- ✅ Graceful error handling (no white screens)
- ✅ Data integrity (no orphaned records)

### 11.4 Security Requirements
- ✅ OAuth authentication working
- ✅ All API endpoints protected
- ✅ Secrets encrypted at rest
- ✅ No security vulnerabilities (npm audit / bun audit)

---

## 12. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Instagram API rate limiting during batch approval | High | Medium | Implement exponential backoff, limit batch size to 10 |
| WebSocket connection instability | Medium | Medium | Auto-reconnect logic, fallback to polling |
| OAuth flow breaking after Google API changes | High | Low | Monitor Google OAuth changelog, implement error logging |
| Database connection pool exhaustion | Medium | Low | Set max connections to 20, implement connection timeout |
| Video file streaming performance issues | Medium | Medium | Implement HTTP range requests, add CDN option |
| Coolify deployment failures | Medium | Low | Test deployment in staging, maintain rollback procedure |

---

## 13. Future Enhancements (Post-MVP)

### Phase 2 Features
- [ ] Instagram Insights integration (engagement metrics)
- [ ] A/B testing for captions
- [ ] Trending hashtag suggestions
- [ ] Multi-user support with roles (admin, reviewer)
- [ ] Audit log (track all user actions)
- [ ] Video editing (trim, add text overlay)
- [ ] Scheduled posting (approve now, post later)
- [ ] Export reports (PDF/CSV)

### Phase 3 Features
- [ ] Mobile app (React Native)
- [ ] AI-powered caption suggestions
- [ ] Content calendar view
- [ ] Cross-platform posting (TikTok, YouTube Shorts)
- [ ] Advanced analytics (follower growth, engagement trends)
- [ ] Automated content moderation (ML-based)

---

## 14. Documentation Requirements

### 14.1 User Documentation
- [ ] Getting Started Guide
- [ ] How to approve videos
- [ ] How to manage accounts
- [ ] How to trigger manual generation
- [ ] Troubleshooting common issues

### 14.2 Technical Documentation
- [ ] API Reference (OpenAPI/Swagger)
- [ ] Database Schema Documentation
- [ ] Deployment Guide
- [ ] Development Setup Guide
- [ ] Architecture Decision Records

### 14.3 Operational Documentation
- [ ] Monitoring and Alerting Guide
- [ ] Backup and Recovery Procedures
- [ ] Incident Response Playbook
- [ ] Security Policies

---

## 15. Acceptance Criteria

### 15.1 Stakeholder Acceptance
- [ ] Dashboard accessible at dashboard.sitedomain.com
- [ ] User can log in with Google account
- [ ] User can approve/reject videos
- [ ] User can manage Instagram accounts
- [ ] User can view analytics
- [ ] User can monitor real-time logs
- [ ] User can configure system settings

### 15.2 Technical Acceptance
- [ ] All automated tests passing
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Deployment automated via Coolify
- [ ] Monitoring and alerting configured

### 15.3 Business Acceptance
- [ ] Reduces manual work by >90%
- [ ] Approval workflow <30 seconds per video
- [ ] System operates reliably for 7 days without intervention
- [ ] Cost within budget (<$50/month for dashboard hosting)

---

## Appendix A: Technology Justification

### Why Bun?
- ✅ **Performance:** 4x faster than Node.js for package management
- ✅ **Developer Experience:** Native TypeScript support, no transpilation
- ✅ **Simplicity:** Single runtime for backend, scripts, testing
- ✅ **Compatibility:** Can run existing npm packages

### Why Hono?
- ✅ **Bun-native:** Optimized for Bun runtime
- ✅ **Performance:** Fastest Node.js web framework
- ✅ **Lightweight:** Minimal dependencies
- ✅ **TypeScript-first:** Excellent type safety
- ✅ **Middleware ecosystem:** Auth, CORS, logging built-in

### Why Drizzle ORM?
- ✅ **Type safety:** Full TypeScript support with inference
- ✅ **Performance:** Generates optimized SQL queries
- ✅ **Migrations:** Built-in migration system
- ✅ **Developer Experience:** Auto-complete, type checking
- ✅ **Bun compatible:** Works seamlessly with Bun

### Why shadcn/ui?
- ✅ **Customizable:** Copy-paste components, full control
- ✅ **Accessible:** ARIA compliant, keyboard navigation
- ✅ **Beautiful:** Pre-built dark mode, consistent design
- ✅ **TypeScript:** Fully typed components
- ✅ **No lock-in:** Not a dependency, just code you own

---

## Appendix B: API Response Examples

### GET /api/approvals
```json
{
  "data": [
    {
      "id": "appr_123",
      "reelId": "reel_456",
      "accountId": "acc_001",
      "accountUsername": "example.account",
      "videoPreviewUrl": "/api/videos/reel_456/stream",
      "caption": "POV: When you realize... ☕😤",
      "hashtags": ["#pov", "#coffee", "#relatable", "#fyp"],
      "status": "pending",
      "createdAt": "2026-01-04T20:30:00Z",
      "metadata": {
        "promptUsed": "A cozy coffee shop scene...",
        "videoProvider": "luma",
        "duration": 18
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "perPage": 20
  }
}
```

### POST /api/approvals/:id/approve
```json
{
  "success": true,
  "data": {
    "reelId": "reel_456",
    "instagramMediaId": "17895695668004551",
    "permalink": "https://www.instagram.com/reel/xxxxx/",
    "postedAt": "2026-01-04T22:35:00Z"
  },
  "message": "Video posted successfully"
}
```

### GET /api/analytics/overview
```json
{
  "totalPosted": 247,
  "pendingApproval": 3,
  "successRate": 97.2,
  "totalCostThisMonth": 284.50,
  "trends": {
    "posted": { "direction": "up", "value": 12 },
    "pending": { "direction": "down", "value": 2 },
    "successRate": { "direction": "up", "value": 1.2 },
    "cost": { "direction": "down", "value": 16 }
  }
}
```

---

**Document Status:** Ready for Review  
**Next Steps:** Review PRD, gather feedback, begin Phase 1 implementation  
**Estimated Timeline:** 6 weeks to production-ready dashboard  
**Budget:** VPS cost covered by existing infrastructure, <$50/month for dashboard hosting on Coolify
