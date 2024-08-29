module.exports = {
  apps: [{
    name: "ai-tools-server",
    script: "./server/server.js",
    env: {
      NODE_ENV: "production",
    }
  }, {
    name: "blog-system-server",
    script: "./blog-system/server.js",
    env: {
      NODE_ENV: "production",
    }
  }]
}