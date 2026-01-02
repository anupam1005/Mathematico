const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

<<<<<<< HEAD
=======
// Resolve duplicate dependencies
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude duplicate packages
config.resolver.blockList = [
  new RegExp('.*/node_modules/.*/node_modules/react-native/.*'),
];

>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
module.exports = config;