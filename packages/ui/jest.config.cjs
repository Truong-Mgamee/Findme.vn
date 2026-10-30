/** Jest + RNTL for the shared components. Workspace engines are TS ESM with `.js` specifiers → mapped back to sources. */
module.exports = {
  preset: '@react-native/jest-preset',
  rootDir: __dirname,
  testMatch: ['<rootDir>/test/**/*.test.tsx', '<rootDir>/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { configFile: `${__dirname}/babel.config.cjs` }] },
  // pnpm layout: node_modules/.pnpm/<pkg>@v/node_modules/<pkg> — skip the `.pnpm` hop, then whitelist RN packages
  transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|((jest-)?react-native|@react-native(-community)?|react-native-svg|test-renderer)/)'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
