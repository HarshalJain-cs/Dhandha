import { ipcMain } from 'electron';
import { SalesReturnService } from '../services/salesReturnService';

export function setupSalesReturnHandlers(): void {
  ipcMain.handle('salesReturn:create', async (event, returnData, userId) => {
    return await SalesReturnService.createReturn(returnData, userId);
  });

  ipcMain.handle('salesReturn:approve', async (event, returnId, approvedBy) => {
    return await SalesReturnService.approveReturn(returnId, approvedBy);
  });

  ipcMain.handle('salesReturn:complete', async (event, returnId, completedBy) => {
    return await SalesReturnService.completeReturn(returnId, completedBy);
  });

  ipcMain.handle('salesReturn:reject', async (event, returnId, rejectedBy, reason) => {
    return await SalesReturnService.rejectReturn(returnId, rejectedBy, reason);
  });

  ipcMain.handle('salesReturn:processExchange', async (event, returnId, newInvoiceData, userId) => {
    return await SalesReturnService.processExchange(returnId, newInvoiceData, userId);
  });

  ipcMain.handle('salesReturn:getAll', async (event, filters, pagination) => {
    return await SalesReturnService.getAllReturns(filters, pagination);
  });

  ipcMain.handle('salesReturn:getById', async (event, id) => {
    return await SalesReturnService.getReturnById(id);
  });

  ipcMain.handle('salesReturn:getStats', async () => {
    return await SalesReturnService.getReturnStats();
  });
}
