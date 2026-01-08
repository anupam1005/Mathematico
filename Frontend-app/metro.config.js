const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro uses the correct project root in monorepo setup
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config;