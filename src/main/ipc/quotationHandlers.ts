import { ipcMain } from 'electron';
import { QuotationService } from '../services/quotationService';

export function setupQuotationHandlers(): void {
  ipcMain.handle('quotation:create', async (event, data, userId) => {
    return await QuotationService.createQuotation(data, userId);
  });

  ipcMain.handle('quotation:getAll', async (event, filters, pagination) => {
    return await QuotationService.getAllQuotations(filters, pagination);
  });

  ipcMain.handle('quotation:getById', async (event, id) => {
    return await QuotationService.getQuotationById(id);
  });

  ipcMain.handle('quotation:update', async (event, id, data, userId) => {
    return await QuotationService.updateQuotation(id, data, userId);
  });

  ipcMain.handle('quotation:convertToInvoice', async (event, quotationId, userId) => {
    return await QuotationService.convertToInvoice(quotationId, userId);
  });

  ipcMain.handle('quotation:updateStatus', async (event, id, status, userId) => {
    return await QuotationService.updateStatus(id, status, userId);
  });

  ipcMain.handle('quotation:getStats', async () => {
    return await QuotationService.getQuotationStats();
  });
}
