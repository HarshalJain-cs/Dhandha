import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { InvoiceService } from '../services/invoiceService';
import { CreateInvoiceData, InvoiceItemData, Payment, OldGoldTransaction } from '../../shared/types';
import log from 'electron-log';

/**
 * Setup Invoice IPC Handlers
 */
export function setupInvoiceHandlers(): void {
  /**
   * Create new invoice
   */
   ipcMain.handle(
     'invoice:create',
     async (
       _event: IpcMainInvokeEvent,
       customerId: number,
       items: InvoiceItemData[],
       oldGoldData: any | null,
       payments: any[],
       invoiceData: any,
        createdBy: number
     ): Promise<any> => {
       try {
         return await InvoiceService.create(
           customerId,
           items,
           oldGoldData,
           payments,
           invoiceData,
           createdBy
         );
       } catch (error: any) {
         return {
          success: false,
          message: error.message || 'An error occurred while creating invoice',
        };
      }
    }
  );

  /**
   * Get all invoices with filters
   */
  ipcMain.handle(
    'invoice:getAll',
    async (
      _event: IpcMainInvokeEvent,
      filters?: any,
      pagination?: { page: number; limit: number }
    ) => {
      try {
        return await InvoiceService.getAll(filters, pagination);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching invoices',
        };
      }
    }
  );

  /**
   * Get invoice by ID
   */
  ipcMain.handle('invoice:getById', async (_event: IpcMainInvokeEvent, id: number) => {
    try {
      return await InvoiceService.getById(id);
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while fetching invoice',
      };
    }
  });

  /**
   * Add payment to invoice
   */
  ipcMain.handle(
    'invoice:addPayment',
    async (
      _event: IpcMainInvokeEvent,
      invoiceId: number,
      paymentData: any,
      createdBy: number
    ) => {
      try {
        return await InvoiceService.addPayment(invoiceId, paymentData, createdBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while adding payment',
        };
      }
    }
  );

  /**
   * Cancel invoice
   */
  ipcMain.handle(
    'invoice:cancel',
    async (_event: IpcMainInvokeEvent, id: number, reason: string, cancelledBy: number) => {
      try {
        return await InvoiceService.cancel(id, reason, cancelledBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while cancelling invoice',
        };
      }
    }
  );

  /**
   * Get invoice summary
   */
  ipcMain.handle('invoice:getSummary', async (_event: IpcMainInvokeEvent, filters?: any) => {
    try {
      return await InvoiceService.getSummary(filters);
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while getting invoice summary',
        };
    }
  });
}

export default setupInvoiceHandlers;
