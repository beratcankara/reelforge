/**
 * PostgreSQL Database Connection & Pool Configuration
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'n8n_reels',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
}

/**
 * Get a single row from query result
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
async function queryOne(text, params) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
}

/**
 * Connect to database
 */
async function connect() {
  try {
    await pool.connect();
    logger.info('Database pool connected');
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
async function disconnect() {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', error);
  }
}

module.exports = {
  pool,
  query,
  queryOne,
  testConnection,
  connect,
  disconnect
};
