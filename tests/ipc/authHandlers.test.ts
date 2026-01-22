import { ipcMain } from 'electron';
import { setupAuthHandlers } from '../../src/main/ipc/authHandlers';

describe('Auth IPC Handlers', () => {
  beforeEach(() => {
    // Clear all handlers before each test
    ipcMain.removeAllListeners();
  });

  afterEach(() => {
    // Clean up after each test
    ipcMain.removeAllListeners();
  });

  describe('Handler Registration', () => {
    test('should register auth handlers without errors', () => {
      expect(() => {
        setupAuthHandlers();
      }).not.toThrow();
    });

    test('should have login handler registered', () => {
      setupAuthHandlers();
      const handlers = ipcMain.eventNames();
      expect(handlers.some(h => h.toString().includes('auth:login'))).toBe(true);
    });

    test('should have user management handlers registered', () => {
      setupAuthHandlers();
      const handlers = ipcMain.eventNames();

      const authHandlers = handlers.filter(h =>
        h.toString().includes('auth:')
      );

      expect(authHandlers.length).toBeGreaterThan(5); // Should have multiple auth handlers
    });
  });
});