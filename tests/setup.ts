/**
 * Jest Test Setup
 * Runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'sqlite';
process.env.DB_STORAGE = ':memory:';

// Suppress console output during tests (unless debugging)
const noop = () => {};
global.console = {
  ...console,
  log: noop,
  info: noop,
  warn: noop,
  debug: noop,
  // Keep error for debugging
  error: console.error,
};
