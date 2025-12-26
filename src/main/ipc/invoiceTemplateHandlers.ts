import { ipcMain } from 'electron';
import { InvoiceTemplateService } from '../services/invoiceTemplateService';

export function setupInvoiceTemplateHandlers(): void {
  ipcMain.handle('template:getAll', async () => {
    return InvoiceTemplateService.getAvailableTemplates();
  });

  ipcMain.handle('template:generateHTML', async (event, invoice, templateId) => {
    return InvoiceTemplateService.generateInvoiceHTML(invoice, templateId);
  });
}
