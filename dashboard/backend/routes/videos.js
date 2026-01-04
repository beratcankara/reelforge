/**
 * Video Streaming Routes
 *
 * Endpoints:
 * - GET /api/videos/:id        - Stream video for preview
 * - GET /api/videos/:id/thumbnail - Get video thumbnail
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const logger = require('../utils/logger');

// ============================================================
// GET /api/videos/:id - Stream video for preview
// ============================================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get video path from approval queue
    const query = `
      SELECT video_path, caption, hashtags, status
      FROM approval_queue
      WHERE id = $1
    `;

    const result = await db.queryOne(query, [id]);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    const videoPath = result.video_path;

    // Check if video exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: 'Video file not found on server'
      });
    }

    // Get video stats
    const stats = fs.statSync(videoPath);
    const fileSize = stats.size;
    const range = req.headers.range;

    // Set headers for video streaming
    const headers = {
      'Content-Type': 'video/mp4',
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes'
    };

    // Handle range requests for video seeking
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      headers['Content-Length'] = chunkSize;
      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;

      res.writeHead(206, headers);

      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error('Video stream error:', err);
        res.end();
      });

    } else {
      res.writeHead(200, headers);

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error('Video stream error:', err);
        res.end();
      });
    }

  } catch (error) {
    logger.error('Error streaming video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream video'
    });
  }
});

// ============================================================
// GET /api/videos/:id/thumbnail - Get video thumbnail
// ============================================================

router.get('/:id/thumbnail', async (req, res) => {
  try {
    const { id } = req.params;

    // For now, return a placeholder or first frame
    // In production, you would use FFmpeg to extract a thumbnail

    const query = `
      SELECT video_path
      FROM approval_queue
      WHERE id = $1
    `;

    const result = await db.queryOne(query, [id]);

    if (!result || !result.video_path) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // Check if thumbnail exists (you'd generate these beforehand)
    const thumbnailPath = result.video_path.replace('.mp4', '_thumb.jpg');

    if (fs.existsSync(thumbnailPath)) {
      res.sendFile(thumbnailPath);
    } else {
      // Return a simple SVG placeholder
      res.set('Content-Type', 'image/svg+xml');
      res.send(`
        <svg width="320" height="568" xmlns="http://www.w3.org/2000/svg">
          <rect width="320" height="568" fill="#1a1a2e"/>
          <text x="50%" y="50%" fill="#ffffff" font-size="24" text-anchor="middle" dominant-baseline="middle">
            Video Preview
          </text>
        </svg>
      `);
    }

  } catch (error) {
    logger.error('Error fetching thumbnail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch thumbnail'
    });
  }
});

module.exports = router;
