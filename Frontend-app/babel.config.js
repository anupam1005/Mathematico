module.exports = function(api) {
  api.cache(true);
  
  const presets = ['babel-preset-expo'];
  const plugins = [
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    'react-native-reanimated/plugin'
  ];

  return {
    presets,
    plugins
  };
};
