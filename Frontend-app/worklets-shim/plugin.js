// Minimal no-op Babel plugin to satisfy `react-native-reanimated/plugin`
// when it tries to require `react-native-worklets/plugin`.
//
// This does not transform code; it simply leaves the AST unchanged.

module.exports = function workletsShimPlugin() {
  return {
    name: 'react-native-worklets-shim',
    visitor: {},
  };
};

