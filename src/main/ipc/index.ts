import { setupAuthHandlers } from './authHandlers';
import { setupSyncHandlers } from './syncHandlers';

/**
 * IPC Handlers Index
 * Registers all IPC handlers for main-renderer communication
 */

/**
 * Setup all IPC handlers
 */
export const setupAllHandlers = (): void => {
  console.log('⚙  Setting up IPC handlers...');

  // Setup authentication handlers
  setupAuthHandlers();

  // Setup sync handlers
  setupSyncHandlers();

  // Additional handlers will be added here as modules are developed
  // Example:
  // setupProductHandlers();
  // setupCustomerHandlers();
  // setupInvoiceHandlers();
  // setupReportHandlers();

  console.log('✓ All IPC handlers registered successfully');
};

export default setupAllHandlers;
