/**
 * Authentication Routes
 *
 * Endpoints:
 * - POST /api/auth/login      - Login user
 * - POST /api/auth/logout     - Logout user
 * - GET  /api/auth/me         - Get current user
 * - POST /api/auth/change-password - Change password
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// Simple in-memory user store (in production, use database)
const users = new Map();
const defaultAdmin = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin',
  hashedPassword: null
};

// Initialize default admin password
bcrypt.hash(defaultAdmin.password, 10).then(hash => {
  defaultAdmin.hashedPassword = hash;
  users.set(defaultAdmin.username, defaultAdmin);
});

// ============================================================
// POST /api/auth/login - Authenticate user
// ============================================================

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const user = users.get(username);

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isValid) {
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Set session
    req.session.userId = username;
    req.session.loginTime = new Date();

    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        username: user.username
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ============================================================
// POST /api/auth/logout - Logout user
// ============================================================

router.post('/logout', (req, res) => {
  const username = req.session.userId;

  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }

    logger.info(`User logged out: ${username}`);

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

// ============================================================
// GET /api/auth/me - Get current authenticated user
// ============================================================

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  res.json({
    success: true,
    data: {
      username: req.session.userId,
      loginTime: req.session.loginTime
    }
  });
});

// ============================================================
// POST /api/auth/change-password - Change user password
// ============================================================

router.post('/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!req.session.userId || req.session.userId !== username) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old and new passwords are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
    }

    const user = users.get(username);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isValid = await bcrypt.compare(oldPassword, user.hashedPassword);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid old password'
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = hashedPassword;
    users.set(username, user);

    logger.info(`Password changed for user: ${username}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// ============================================================
// Middleware: Require authentication
// ============================================================

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
}

module.exports = router;
module.exports.requireAuth = requireAuth;
