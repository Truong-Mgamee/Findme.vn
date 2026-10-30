module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // workspace packages import JSON with `with { type: 'json' }`
    plugins: ['@babel/plugin-syntax-import-attributes'],
  };
};
