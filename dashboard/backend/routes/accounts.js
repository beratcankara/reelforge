/**
 * Instagram Accounts API Routes
 *
 * Endpoints:
 * - GET    /api/accounts           - Get all accounts
 * - GET    /api/accounts/:id       - Get single account
 * - POST   /api/accounts           - Add new account
 * - PUT    /api/accounts/:id       - Update account
 * - DELETE /api/accounts/:id       - Delete account
 * - POST   /api/accounts/:id/toggle - Toggle active status
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// ============================================================
// GET /api/accounts - Get all Instagram accounts
// ============================================================

router.get('/', async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = `
      SELECT
        id,
        username,
        content_theme,
        posting_timezone,
        optimal_posting_time,
        is_active,
        created_at
      FROM instagram_accounts
    `;

    const params = [];

    if (status === 'active') {
      query += ' WHERE is_active = true';
    } else if (status === 'inactive') {
      query += ' WHERE is_active = false';
    }

    query += ' ORDER BY username ASC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts'
    });
  }
});

// ============================================================
// GET /api/accounts/:id - Get single account details
// ============================================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        id,
        username,
        content_theme,
        posting_timezone,
        optimal_posting_time,
        is_active,
        created_at
      FROM instagram_accounts
      WHERE id = $1
    `;

    const result = await db.queryOne(query, [id]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error fetching account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

// ============================================================
// POST /api/accounts - Add new Instagram account
// ============================================================

router.post('/', async (req, res) => {
  try {
    const {
      username,
      access_token,
      content_theme,
      posting_timezone = 'America/New_York',
      optimal_posting_time = '09:00'
    } = req.body;

    // Validation
    if (!username || !access_token) {
      return res.status(400).json({
        success: false,
        error: 'username and access_token are required'
      });
    }

    const validThemes = ['humor', 'storytelling', 'motivation', 'entertainment'];
    if (!validThemes.includes(content_theme)) {
      return res.status(400).json({
        success: false,
        error: `Invalid content_theme. Must be one of: ${validThemes.join(', ')}`
      });
    }

    // Generate unique ID
    const accountId = `ig_${Date.now()}`;

    const query = `
      INSERT INTO instagram_accounts (id, username, access_token, content_theme, posting_timezone, optimal_posting_time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, content_theme, posting_timezone, optimal_posting_time, is_active, created_at
    `;

    const result = await db.query(query, [
      accountId,
      username,
      access_token, // In production, encrypt this!
      content_theme,
      posting_timezone,
      optimal_posting_time
    ]);

    logger.info(`New Instagram account added: ${username}`);

    res.status(201).json({
      success: true,
      message: 'Account added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error adding account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add account'
    });
  }
});

// ============================================================
// PUT /api/accounts/:id - Update account settings
// ============================================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      content_theme,
      posting_timezone,
      optimal_posting_time,
      is_active
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (content_theme !== undefined) {
      updates.push(`content_theme = $${paramCount++}`);
      values.push(content_theme);
    }

    if (posting_timezone !== undefined) {
      updates.push(`posting_timezone = $${paramCount++}`);
      values.push(posting_timezone);
    }

    if (optimal_posting_time !== undefined) {
      updates.push(`optimal_posting_time = $${paramCount++}`);
      values.push(optimal_posting_time);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(id);

    const query = `
      UPDATE instagram_accounts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    logger.info(`Account ${id} updated`);

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error updating account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update account'
    });
  }
});

// ============================================================
// DELETE /api/accounts/:id - Delete account
// ============================================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM instagram_accounts
      WHERE id = $1
      RETURNING username
    `;

    const result = await db.query(query, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    logger.info(`Account ${id} (${result.rows[0].username}) deleted`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

// ============================================================
// POST /api/accounts/:id/toggle - Toggle active status
// ============================================================

router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE instagram_accounts
      SET is_active = NOT is_active
      WHERE id = $1
      RETURNING id, username, is_active
    `;

    const result = await db.query(query, [id]);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    logger.info(`Account ${id} toggled to ${result.rows[0].is_active ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: `Account ${result.rows[0].is_active ? 'activated' : 'deactivated'}`,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error toggling account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle account'
    });
  }
});

module.exports = router;
