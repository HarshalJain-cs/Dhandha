import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { DashboardService } from '../services/dashboardService';

/**
 * Setup Dashboard IPC Handlers
 * Provides dashboard statistics and analytics endpoints
 */
export const setupDashboardHandlers = (): void => {
  /**
   * Get sales trends over time
   */
  ipcMain.handle(
    'dashboard:getSalesTrends',
    async (
      _event: IpcMainInvokeEvent,
      startDate: string,
      endDate: string,
      groupBy: 'day' | 'week' | 'month'
    ) => {
      try {
        return await DashboardService.getSalesTrends(startDate, endDate, groupBy);
      } catch (error: any) {
        console.error('IPC dashboard:getSalesTrends error:', error);
        return {
          success: false,
          message: 'An error occurred while fetching sales trends',
        };
      }
    }
  );

  /**
   * Get product distribution by category
   */
  ipcMain.handle('dashboard:getProductDistribution', async () => {
    try {
      return await DashboardService.getProductDistribution();
    } catch (error: any) {
      console.error('IPC dashboard:getProductDistribution error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching product distribution',
      };
    }
  });

  /**
   * Get top selling products
   */
  ipcMain.handle(
    'dashboard:getTopProducts',
    async (
      _event: IpcMainInvokeEvent,
      limit: number,
      startDate?: string,
      endDate?: string
    ) => {
      try {
        return await DashboardService.getTopProducts(limit, startDate, endDate);
      } catch (error: any) {
        console.error('IPC dashboard:getTopProducts error:', error);
        return {
          success: false,
          message: 'An error occurred while fetching top products',
        };
      }
    }
  );

  /**
   * Get payment summary by payment mode
   */
  ipcMain.handle(
    'dashboard:getPaymentSummary',
    async (_event: IpcMainInvokeEvent, startDate?: string, endDate?: string) => {
      try {
        return await DashboardService.getPaymentSummary(startDate, endDate);
      } catch (error: any) {
        console.error('IPC dashboard:getPaymentSummary error:', error);
        return {
          success: false,
          message: 'An error occurred while fetching payment summary',
        };
      }
    }
  );

  /**
   * Get revenue statistics
   */
  ipcMain.handle(
    'dashboard:getRevenueStats',
    async (_event: IpcMainInvokeEvent, startDate?: string, endDate?: string) => {
      try {
        return await DashboardService.getRevenueStats(startDate, endDate);
      } catch (error: any) {
        console.error('IPC dashboard:getRevenueStats error:', error);
        return {
          success: false,
          message: 'An error occurred while fetching revenue statistics',
        };
      }
    }
  );

  /**
   * Get customer statistics
   */
  ipcMain.handle('dashboard:getCustomerStats', async () => {
    try {
      return await DashboardService.getCustomerStats();
    } catch (error: any) {
      console.error('IPC dashboard:getCustomerStats error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching customer statistics',
      };
    }
  });

  console.log('✓ Dashboard IPC handlers registered');
};

export default setupDashboardHandlers;
