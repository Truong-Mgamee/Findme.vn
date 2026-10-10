/** Jest + RNTL for the shared components. Workspace engines are TS ESM with `.js` specifiers → mapped back to sources. */
module.exports = {
  preset: 'react-native',
  rootDir: __dirname,
  testMatch: ['<rootDir>/test/**/*.test.tsx', '<rootDir>/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { configFile: `${__dirname}/babel.config.cjs` }] },
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-svg)/)'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
