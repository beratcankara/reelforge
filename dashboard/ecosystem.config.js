/**
 * PM2 Ecosystem Configuration for ReelForge Dashboard Backend
 */

module.exports = {
  apps: [{
    name: 'reelforge-api',
    script: './server.js',
    cwd: '/var/lib/reelforge/dashboard/backend',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: '/var/lib/reelforge/logs/pm2-error.log',
    out_file: '/var/lib/reelforge/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
  }]
};
