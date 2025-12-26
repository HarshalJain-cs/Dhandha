import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { CustomerService } from '../services/customerService';

/**
 * Setup Customer IPC Handlers
 */
export function setupCustomerHandlers(): void {
  /**
   * Generate customer code
   */
  ipcMain.handle('customer:generateCode', async (_event: IpcMainInvokeEvent) => {
    try {
      return await CustomerService.generateCustomerCode();
    } catch (error: any) {
      console.error('IPC customer:generateCode error:', error);
      return {
        success: false,
        message: 'An error occurred while generating customer code',
      };
    }
  });

  /**
   * Create customer
   */
  ipcMain.handle('customer:create', async (_event: IpcMainInvokeEvent, customerData: any) => {
    try {
      return await CustomerService.create(customerData);
    } catch (error: any) {
      console.error('IPC customer:create error:', error);
      return {
        success: false,
        message: 'An error occurred while creating customer',
      };
    }
  });

  /**
   * Get all customers
   */
  ipcMain.handle(
    'customer:getAll',
    async (_event: IpcMainInvokeEvent, filters?: any, pagination?: any) => {
      try {
        return await CustomerService.getAll(filters, pagination);
      } catch (error: any) {
        console.error('IPC customer:getAll error:', error);
        return {
          success: false,
          message: 'An error occurred while retrieving customers',
        };
      }
    }
  );

  /**
   * Get customer by ID
   */
  ipcMain.handle('customer:getById', async (_event: IpcMainInvokeEvent, id: number) => {
    try {
      return await CustomerService.getById(id);
    } catch (error: any) {
      console.error('IPC customer:getById error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving customer',
      };
    }
  });

  /**
   * Update customer
   */
  ipcMain.handle(
    'customer:update',
    async (_event: IpcMainInvokeEvent, id: number, data: any, updated_by: number) => {
      try {
        return await CustomerService.update(id, data, updated_by);
      } catch (error: any) {
        console.error('IPC customer:update error:', error);
        return {
          success: false,
          message: 'An error occurred while updating customer',
        };
      }
    }
  );

  /**
   * Delete customer
   */
  ipcMain.handle(
    'customer:delete',
    async (_event: IpcMainInvokeEvent, id: number, deleted_by: number) => {
      try {
        return await CustomerService.delete(id, deleted_by);
      } catch (error: any) {
        console.error('IPC customer:delete error:', error);
        return {
          success: false,
          message: 'An error occurred while deleting customer',
        };
      }
    }
  );

  /**
   * Search customer by mobile
   */
  ipcMain.handle('customer:searchByMobile', async (_event: IpcMainInvokeEvent, mobile: string) => {
    try {
      return await CustomerService.searchByMobile(mobile);
    } catch (error: any) {
      console.error('IPC customer:searchByMobile error:', error);
      return {
        success: false,
        message: 'An error occurred while searching customer',
      };
    }
  });

  /**
   * Search customer by email
   */
  ipcMain.handle('customer:searchByEmail', async (_event: IpcMainInvokeEvent, email: string) => {
    try {
      return await CustomerService.searchByEmail(email);
    } catch (error: any) {
      console.error('IPC customer:searchByEmail error:', error);
      return {
        success: false,
        message: 'An error occurred while searching customer',
      };
    }
  });

  /**
   * Get customers by type
   */
  ipcMain.handle('customer:getByType', async (_event: IpcMainInvokeEvent, customerType: string) => {
    try {
      return await CustomerService.getByType(customerType as 'retail' | 'wholesale' | 'vip');
    } catch (error: any) {
      console.error('IPC customer:getByType error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving customers',
      };
    }
  });

  /**
   * Update outstanding balance
   */
  ipcMain.handle(
    'customer:updateBalance',
    async (_event: IpcMainInvokeEvent, id: number, amount: number, operation: string) => {
      try {
        return await CustomerService.updateOutstandingBalance(
          id,
          amount,
          operation as 'add' | 'subtract' | 'set'
        );
      } catch (error: any) {
        console.error('IPC customer:updateBalance error:', error);
        return {
          success: false,
          message: 'An error occurred while updating balance',
        };
      }
    }
  );

  /**
   * Add loyalty points
   */
  ipcMain.handle(
    'customer:addPoints',
    async (_event: IpcMainInvokeEvent, id: number, points: number) => {
      try {
        return await CustomerService.addLoyaltyPoints(id, points);
      } catch (error: any) {
        console.error('IPC customer:addPoints error:', error);
        return {
          success: false,
          message: 'An error occurred while adding loyalty points',
        };
      }
    }
  );

  /**
   * Redeem loyalty points
   */
  ipcMain.handle(
    'customer:redeemPoints',
    async (_event: IpcMainInvokeEvent, id: number, points: number) => {
      try {
        return await CustomerService.redeemLoyaltyPoints(id, points);
      } catch (error: any) {
        console.error('IPC customer:redeemPoints error:', error);
        return {
          success: false,
          message: 'An error occurred while redeeming loyalty points',
        };
      }
    }
  );

  console.log('Customer IPC handlers registered');
}
