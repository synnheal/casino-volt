module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server/index.mjs',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 8007
      }
    },
    {
      name: 'frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 8006 -H 0.0.0.0',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8006
      }
    }
  ]
};