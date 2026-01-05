import { pgTable, text, timestamp, boolean, jsonb, integer, serial, varchar } from 'drizzle-orm/pg-core';

// Users table (dashboard users - single admin user with Google OAuth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  picture: text('picture'),
  googleId: text('google_id').unique(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Instagram accounts (synced from main system)
export const instagramAccounts = pgTable('instagram_accounts', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  accountId: text('account_id').notNull().unique(),
  accessToken: text('access_token').notNull(),
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata').$type<{
    followersCount?: number;
    profilePictureUrl?: string;
    biography?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Generated reels approval queue
export const approvals = pgTable('approvals', {
  id: text('id').primaryKey(),
  reelId: text('reel_id').notNull().unique(), // References main system
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption').notNull(),
  hashtags: text('hashtags').array(),
  musicTrack: text('music_track'),
  scheduledFor: timestamp('scheduled_for'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  priority: integer('priority').default(0),
  metadata: jsonb('metadata').$type<{
    duration?: number;
    resolution?: string;
    fileSize?: number;
    generatedBy?: string;
  }>(),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// System logs
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  level: text('level').notNull(), // info, warning, error
  source: text('source').notNull(), // workflow, api, auth, etc.
  message: text('message').notNull(),
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Notifications for the dashboard user
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // approval_needed, post_success, post_failed, system_alert
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Dashboard settings
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  category: text('category').notNull(), // workflow, posting, notifications, etc.
  updatedBy: text('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analytics snapshots (cached from main system)
export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => instagramAccounts.id),
  period: text('period').notNull(), // daily, weekly, monthly
  metrics: jsonb('metrics').$type<{
    reach?: number;
    impressions?: number;
    engagement?: number;
    followers?: number;
    postsCount?: number;
  }>().notNull(),
  snapshotDate: timestamp('snapshot_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Workflow status (synced from n8n)
export const workflowStatus = pgTable('workflow_status', {
  id: serial('id').primaryKey(),
  workflowId: text('workflow_id').notNull().unique(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true),
  lastRunAt: timestamp('last_run_at'),
  lastRunStatus: text('last_run_status'), // success, error, waiting
  executions: jsonb('executions').$type<{
    total?: number;
    successful?: number;
    failed?: number;
  }>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
