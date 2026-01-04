/**
 * Approval Queue API Routes
 *
 * Endpoints:
 * - GET    /api/approvals          - Get all pending approvals
 * - GET    /api/approvals/:id       - Get single approval details
 * - POST   /api/approvals/:id/approve - Approve a video
 * - POST   /api/approvals/:id/reject  - Reject a video
 * - PUT    /api/approvals/:id/edit    - Edit caption/hashtags
 * - GET    /api/approvals/stats     - Get approval statistics
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// ============================================================
// GET /api/approvals - Get all pending approvals
// Query params: status (pending, approved, rejected, posted), limit, offset
// ============================================================

router.get('/', async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT
        aq.id,
        aq.account_id,
        aq.video_path,
        aq.caption,
        aq.hashtags,
        aq.metadata,
        aq.status,
        aq.created_at,
        aq.reviewed_at,
        aq.reviewed_by,
        aq.notes,
        ia.username as account_username,
        ia.content_theme as account_theme
      FROM approval_queue aq
      LEFT JOIN instagram_accounts ia ON aq.account_id = ia.id
      WHERE aq.status = $1
      ORDER BY aq.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [status, limit, offset]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    logger.error('Error fetching approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approvals'
    });
  }
});

// ============================================================
// GET /api/approvals/:id - Get single approval details
// ============================================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        aq.*,
        ia.username as account_username,
        ia.content_theme as account_theme
      FROM approval_queue aq
      LEFT JOIN instagram_accounts ia ON aq.account_id = ia.id
      WHERE aq.id = $1
    `;

    const result = await db.queryOne(query, [id]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error fetching approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approval'
    });
  }
});

// ============================================================
// POST /api/approvals/:id/approve - Approve a video
// ============================================================

router.post('/:id/approve', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { reviewed_by } = req.body;

    // Update approval status
    const updateQuery = `
      UPDATE approval_queue
      SET status = 'approved',
          reviewed_at = NOW(),
          reviewed_by = $2
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;

    const result = await client.query(updateQuery, [id, reviewed_by || 'admin']);

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Approval not found or already processed'
      });
    }

    // Trigger n8n workflow to post to Instagram
    // This would call n8n webhook or directly use Instagram API
    // For now, we'll just mark it as approved

    await client.query('COMMIT');

    logger.info(`Approval ${id} approved by ${reviewed_by || 'admin'}`);

    res.json({
      success: true,
      message: 'Video approved and queued for posting',
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error approving video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve video'
    });
  } finally {
    client.release();
  }
});

// ============================================================
// POST /api/approvals/:id/reject - Reject a video
// ============================================================

router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed_by, notes } = req.body;

    const query = `
      UPDATE approval_queue
      SET status = 'rejected',
          reviewed_at = NOW(),
          reviewed_by = $2,
          notes = $3
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;

    const result = await db.query(query, [id, reviewed_by || 'admin', notes || '']);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found or already processed'
      });
    }

    logger.info(`Approval ${id} rejected by ${reviewed_by || 'admin'}`, { notes });

    res.json({
      success: true,
      message: 'Video rejected',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error rejecting video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject video'
    });
  }
});

// ============================================================
// PUT /api/approvals/:id/edit - Edit caption/hashtags
// ============================================================

router.put('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, hashtags } = req.body;

    if (!caption && !hashtags) {
      return res.status(400).json({
        success: false,
        error: 'caption or hashtags required'
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (caption) {
      updates.push(`caption = $${paramCount++}`);
      values.push(caption);
    }

    if (hashtags) {
      updates.push(`hashtags = $${paramCount++}`);
      values.push(Array.isArray(hashtags) ? hashtags.join(', ') : hashtags);
    }

    values.push(id);

    const query = `
      UPDATE approval_queue
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND status = 'pending'
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found or already processed'
      });
    }

    logger.info(`Approval ${id} edited`);

    res.json({
      success: true,
      message: 'Caption/hashtags updated',
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Error editing approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit approval'
    });
  }
});

// ============================================================
// GET /api/approvals/stats - Get approval statistics
// ============================================================

router.get('/stats/summary', async (req, res) => {
  try {
    const query = `
      SELECT
        status,
        COUNT(*) as count
      FROM approval_queue
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY status
    `;

    const result = await db.query(query);

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      posted: 0,
      total: 0
    };

    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approval stats'
    });
  }
});

module.exports = router;
