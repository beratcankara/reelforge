/**
 * ReelForge Dashboard - Express Backend Server
 *
 * API Endpoints:
 * - Authentication: POST /api/auth/login, POST /api/auth/logout
 * - Approvals: GET /api/approvals, POST /api/approvals/:id/approve, POST /api/approvals/:id/reject
 * - Accounts: GET /api/accounts, POST /api/accounts, PUT /api/accounts/:id, DELETE /api/accounts/:id
 * - Stats: GET /api/stats, GET /api/stats/activity
 * - Videos: GET /api/videos/:id (stream video for preview)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const approvalRoutes = require('./routes/approvals');
const accountRoutes = require('./routes/accounts');
const statsRoutes = require('./routes/stats');
const videoRoutes = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'reelforge-dashboard-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================================
// STATIC FILES (React Build)
// ============================================================

app.use(express.static(path.join(__dirname, '../frontend/build')));

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/videos', videoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// ============================================================
// SPA FALLBACK - Serve React App for all non-API routes
// ============================================================

app.get('*', (req, res) => {
  // Don't handle API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================================
// DATABASE CONNECTION
// ============================================================

db.connect()
  .then(() => {
    logger.info('Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Dashboard server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  db.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  db.disconnect();
  process.exit(0);
});

module.exports = app;
