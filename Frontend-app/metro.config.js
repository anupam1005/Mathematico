const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve duplicate dependencies
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude duplicate packages
config.resolver.blockList = [
  new RegExp('.*/node_modules/.*/node_modules/react-native/.*'),
];

// Add resolver configuration to handle module resolution issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Ensure proper module resolution
config.resolver.alias = {
  'react-native': require.resolve('react-native'),
};

// Add PlatformConstants polyfill for development
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native/Libraries/Utilities/PlatformConstants': require.resolve('./src/utils/PlatformConstantsPolyfill.js'),
};

module.exports = config;