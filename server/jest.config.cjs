/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Discover tests colocated in __tests__ plus *.test.js / *.spec.js anywhere
  // under src (node_modules is ignored by default).
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
};
