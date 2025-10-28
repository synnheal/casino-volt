module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server/index.mjs',  // ⬅️ Change .js en .mjs
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 8007
      }
    },
    {
      name: 'frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 8006 -H 0.0.0.0',
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