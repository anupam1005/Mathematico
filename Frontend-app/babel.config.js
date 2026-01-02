module.exports = function(api) {
  api.cache(true);
<<<<<<< HEAD
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }]
    ]
  };
};
=======
  
  const presets = ['babel-preset-expo'];
  const plugins = [
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }]
  ];

  return {
    presets,
    plugins
  };
};
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
