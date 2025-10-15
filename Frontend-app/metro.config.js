const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve duplicate dependencies
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude duplicate packages
config.resolver.blockList = [
  new RegExp('.*/node_modules/.*/node_modules/react-native/.*'),
];

module.exports = config;