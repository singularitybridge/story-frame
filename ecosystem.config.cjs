module.exports = {
  apps: [{
    name: 'veo-studio',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
