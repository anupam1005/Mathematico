const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ✅ DO NOT override watchFolders unless needed
// Expo already handles it correctly

module.exports = config;