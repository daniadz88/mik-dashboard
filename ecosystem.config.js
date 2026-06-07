module.exports = {
  apps: [{
    name: 'mik-dashboard',
    script: 'backend/server.js',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}