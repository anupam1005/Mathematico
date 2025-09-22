// Vercel serverless function that imports from Backend
const path = require('path');

// Add Backend directory to module path
const backendPath = path.join(__dirname, '../Backend');
require('module').globalPaths.push(backendPath);

// Import the server from Backend
const app = require('../Backend/server.js');

module.exports = app;
