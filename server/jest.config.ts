import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@server/database$': '<rootDir>/packages/database/src',
    '^@server/database/(.*)$': '<rootDir>/packages/database/src/$1',
    '^@server/common$': '<rootDir>/packages/common/src',
    '^@server/common/(.*)$': '<rootDir>/packages/common/src/$1',
    '^@server/config$': '<rootDir>/packages/config/src',
    '^@server/events$': '<rootDir>/packages/events/src',
    '^@server/events/(.*)$': '<rootDir>/packages/events/src/$1',
    '^@server/queue$': '<rootDir>/packages/queue/src',
    '^@server/queue/(.*)$': '<rootDir>/packages/queue/src/$1',
    '^@server/cache$': '<rootDir>/packages/cache/src',
    '^@server/cache/(.*)$': '<rootDir>/packages/cache/src/$1',
  },
  collectCoverageFrom: [
    'apps/**/*.ts',
    'packages/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/dto/**',
    '!**/*.module.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  verbose: true,
  clearMocks: true,
  resetMocks: false,
};

export default config;
