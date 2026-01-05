import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './src/routes/auth';
import approvalsRoutes from './src/routes/approvals';
import accountsRoutes from './src/routes/accounts';
import analyticsRoutes from './src/routes/analytics';
import workflowsRoutes from './src/routes/workflows';
import settingsRoutes from './src/routes/settings';
import logsRoutes from './src/routes/logs';
import notificationsRoutes from './src/routes/notifications';

dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/approvals', approvalsRoutes);
app.route('/api/accounts', accountsRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/workflows', workflowsRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/logs', logsRoutes);
app.route('/api/notifications', notificationsRoutes);

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});