const { createCjsPreset } = require('jest-preset-angular/presets');

module.exports = {
  ...createCjsPreset(),
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  roots: ['<rootDir>/projects'],
  moduleNameMapper: {
    '^@cupola/core$': '<rootDir>/projects/core/src/public-api.ts',
    '^@cupola/components$': '<rootDir>/projects/components/src/public-api.ts',
    '^@cupola/api$': '<rootDir>/projects/api/src/public-api.ts',
  },
};
