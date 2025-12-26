import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { KarigarService } from '../services/karigarService';

/**
 * Setup Karigar IPC Handlers
 */
export function setupKarigarHandlers(): void {
  /**
   * Create new karigar
   */
  ipcMain.handle(
    'karigar:create',
    async (_event: IpcMainInvokeEvent, data: any, createdBy: number) => {
      try {
        return await KarigarService.createKarigar(data, createdBy);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'An error occurred while creating karigar',
        };
      }
    }
  );

  /**
   * Get all karigars with filters
   */
  ipcMain.handle(
    'karigar:getAll',
    async (
      _event: IpcMainInvokeEvent,
      filters?: any,
      pagination?: { page: number; limit: number }
    ) => {
      try {
        return await KarigarService.getAllKarigars(filters, pagination);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching karigars',
        };
      }
    }
  );

  /**
   * Get karigar by ID
   */
  ipcMain.handle('karigar:getById', async (_event: IpcMainInvokeEvent, id: number) => {
    try {
      return await KarigarService.getKarigarById(id);
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while fetching karigar',
      };
    }
  });

  /**
   * Update karigar
   */
  ipcMain.handle(
    'karigar:update',
    async (_event: IpcMainInvokeEvent, id: number, data: any, updatedBy: number) => {
      try {
        return await KarigarService.updateKarigar(id, data, updatedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while updating karigar',
        };
      }
    }
  );

  /**
   * Delete karigar
   */
  ipcMain.handle(
    'karigar:delete',
    async (_event: IpcMainInvokeEvent, id: number, deletedBy: number) => {
      try {
        return await KarigarService.deleteKarigar(id, deletedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while deleting karigar',
        };
      }
    }
  );

  /**
   * Create karigar order
   */
  ipcMain.handle(
    'karigar:createOrder',
    async (_event: IpcMainInvokeEvent, data: any, createdBy: number) => {
      try {
        return await KarigarService.createOrder(data, createdBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while creating order',
        };
      }
    }
  );

  /**
   * Get all orders with filters
   */
  ipcMain.handle(
    'karigar:getAllOrders',
    async (
      _event: IpcMainInvokeEvent,
      filters?: any,
      pagination?: { page: number; limit: number }
    ) => {
      try {
        return await KarigarService.getAllOrders(filters, pagination);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching orders',
        };
      }
    }
  );

  /**
   * Get order by ID
   */
  ipcMain.handle('karigar:getOrderById', async (_event: IpcMainInvokeEvent, id: number) => {
    try {
      return await KarigarService.getOrderById(id);
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while fetching order',
        };
    }
  });

  /**
   * Receive metal from karigar
   */
  ipcMain.handle(
    'karigar:receiveMetal',
    async (_event: IpcMainInvokeEvent, orderId: number, data: any, receivedBy: number) => {
      try {
        return await KarigarService.receiveMetal(orderId, data, receivedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while receiving metal',
        };
      }
    }
  );

  /**
   * Update order status
   */
  ipcMain.handle(
    'karigar:updateOrderStatus',
    async (
      _event: IpcMainInvokeEvent,
      id: number,
      status: string,
      updatedBy: number,
      cancellationReason?: string
    ) => {
      try {
        return await KarigarService.updateOrderStatus(id, status as any, updatedBy, cancellationReason);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while updating order status',
        };
      }
    }
  );

  /**
   * Get karigar statistics
   */
  ipcMain.handle(
    'karigar:getStats',
    async (_event: IpcMainInvokeEvent, karigarId?: number) => {
      try {
        return await KarigarService.getKarigarStats(karigarId);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching statistics',
        };
      }
    }
  );
}

export default setupKarigarHandlers;
