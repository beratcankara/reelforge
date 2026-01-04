/**
 * Statistics API Routes
 *
 * Endpoints:
 * - GET /api/stats/overview      - General statistics
 * - GET /api/stats/activity       - Recent activity log
 * - GET /api/stats/performance    - Performance metrics
 * - GET /api/stats/costs          - API cost breakdown
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// ============================================================
// GET /api/stats/overview - General dashboard statistics
// ============================================================

router.get('/overview', async (req, res) => {
  try {
    // Get total videos posted
    const videosQuery = `
      SELECT
        COUNT(*) as total_videos,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
      FROM generated_reels
    `;

    // Get accounts count
    const accountsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_active THEN 1 END) as active
      FROM instagram_accounts
    `;

    // Get approval queue stats
    const approvalsQuery = `
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM approval_queue
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;

    const [videos, accounts, approvals] = await Promise.all([
      db.queryOne(videosQuery),
      db.queryOne(accountsQuery),
      db.queryOne(approvalsQuery)
    ]);

    // Calculate success rate
    const successRate = videos.total_videos > 0
      ? ((videos.successful / videos.total_videos) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        videos: {
          total: parseInt(videos.total_videos) || 0,
          successful: parseInt(videos.successful) || 0,
          failed: parseInt(videos.failed) || 0,
          last30Days: parseInt(videos.last_30_days) || 0,
          successRate: parseFloat(successRate)
        },
        accounts: {
          total: parseInt(accounts.total) || 0,
          active: parseInt(accounts.active) || 0
        },
        approvals: {
          pending: parseInt(approvals.pending) || 0,
          approved: parseInt(approvals.approved) || 0,
          rejected: parseInt(approvals.rejected) || 0
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview stats'
    });
  }
});

// ============================================================
// GET /api/stats/activity - Recent activity log
// ============================================================

router.get('/activity', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const query = `
      SELECT
        gr.id,
        gr.status,
        gr.posted_at,
        gr.created_at,
        gr.error_message,
        ia.username as account_username
      FROM generated_reels gr
      LEFT JOIN instagram_accounts ia ON gr.account_id = ia.id
      ORDER BY gr.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    // Format activity items
    const activities = result.rows.map(row => {
      let message = '';
      let type = 'info';

      switch (row.status) {
        case 'success':
          message = `Video posted to @${row.account_username}`;
          type = 'success';
          break;
        case 'failed':
          message = `Failed to post to @${row.account_username}: ${row.error_message || 'Unknown error'}`;
          type = 'error';
          break;
        default:
          message = `Video generated for @${row.account_username}`;
      }

      return {
        id: row.id,
        message,
        type,
        timestamp: row.posted_at || row.created_at,
        account: row.account_username
      };
    });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    logger.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
});

// ============================================================
// GET /api/stats/performance - Performance metrics
// ============================================================

router.get('/performance', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        AVG(CASE WHEN status = 'success'
          THEN EXTRACT(EPOCH FROM (posted_at - created_at))
        END) as avg_generation_time_seconds
      FROM generated_reels
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const result = await db.query(query);

    const performance = result.rows.map(row => ({
      date: row.date,
      total: parseInt(row.total),
      successful: parseInt(row.successful || 0),
      avgGenerationTime: row.avg_generation_time_seconds
        ? parseFloat(row.avg_generation_time_seconds).toFixed(0)
        : null
    }));

    // Calculate overall averages
    const overallQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        AVG(CASE WHEN status = 'success'
          THEN EXTRACT(EPOCH FROM (posted_at - created_at))
        END) as avg_time
      FROM generated_reels
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;

    const overall = await db.queryOne(overallQuery);

    res.json({
      success: true,
      data: {
        daily: performance,
        overall: {
          total: parseInt(overall.total) || 0,
          successful: parseInt(overall.successful) || 0,
          avgGenerationTime: overall.avg_time
            ? parseFloat(overall.avg_time).toFixed(0)
            : null,
          successRate: overall.total > 0
            ? ((overall.successful / overall.total) * 100).toFixed(1)
            : 0
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance stats'
    });
  }
});

// ============================================================
// GET /api/stats/costs - API cost breakdown
// ============================================================

router.get('/costs', async (req, res) => {
  try {
    const { month } = req.query; // Format: 2024-01

    let dateFilter = '';
    if (month) {
      dateFilter = `AND DATE_TRUNC('month', created_at) = '${month}-01'`;
    }

    const query = `
      SELECT
        video_api_provider,
        COUNT(*) as calls,
        COALESCE(SUM(
          CASE
            WHEN video_api_provider = 'luma' THEN 0.15
            WHEN video_api_provider = 'pika' THEN 0.10
            ELSE 0.05
          END
        ), 0) as estimated_cost
      FROM generated_reels
      WHERE status = 'success' ${dateFilter}
      GROUP BY video_api_provider
    `;

    const result = await db.query(query);

    let totalCost = 0;
    const breakdown = result.rows.map(row => {
      const cost = parseFloat(row.estimated_cost);
      totalCost += cost;
      return {
        provider: row.video_api_provider || 'unknown',
        calls: parseInt(row.calls),
        cost: cost.toFixed(2)
      };
    });

    res.json({
      success: true,
      data: {
        total: totalCost.toFixed(2),
        breakdown,
        currency: 'USD'
      }
    });

  } catch (error) {
    logger.error('Error fetching cost stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cost stats'
    });
  }
});

module.exports = router;
