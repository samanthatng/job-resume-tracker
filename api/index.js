// Vercel serverless entry point. Wraps the same Express app used for local
// dev so behaviour is identical in both environments.
const serverless = require('serverless-http');
const app = require('../server/app');

module.exports = serverless(app);
