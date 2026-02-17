/**
 * PM2 Configuration for ARQ Backend
 * 
 * Production deployment strategy:
 * - Name: arq-backend (single process name)
 * - Method: pm2 restart arq-backend || pm2 start ecosystem.config.js
 * - First deploy creates process; subsequent deploys restart by name
 * - Health check: GET /health on port 8000
 * - wait_ready: false (external curl health check in CI handles readiness)
 */
module.exports = {
  apps: [
    {
      name: 'arq-backend',
      script: 'dist/main.js',
      exec_mode: 'fork',  // Используем fork mode вместо cluster
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Настройки для предотвращения проблем с портами
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: false,
      // Restart delay для стабильности
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
