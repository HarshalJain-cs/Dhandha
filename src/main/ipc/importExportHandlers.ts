import { ipcMain, dialog } from 'electron';
import { ImportExportService } from '../services/importExportService';
import fs from 'fs';
import path from 'path';

export function setupImportExportHandlers(): void {
  ipcMain.handle('import:products', async (event, filePath, userId) => {
    return await ImportExportService.importProducts(filePath, userId);
  });

  ipcMain.handle('import:customers', async (event, filePath, userId) => {
    return await ImportExportService.importCustomers(filePath, userId);
  });

  ipcMain.handle('export:products', async (event, filters, format) => {
    const result = await ImportExportService.exportProducts(filters, format);
    if (result.success) {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Products',
        defaultPath: `products_${new Date().getTime()}.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Products exported successfully', filePath };
      }
    }
    return result;
  });

  ipcMain.handle('export:customers', async (event, filters, format) => {
    const result = await ImportExportService.exportCustomers(filters, format);
    if (result.success) {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Customers',
        defaultPath: `customers_${new Date().getTime()}.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Customers exported successfully', filePath };
      }
    }
    return result;
  });

  ipcMain.handle('export:invoices', async (event, filters, format) => {
    const result = await ImportExportService.exportInvoices(filters, format);
    if (result.success) {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Invoices',
        defaultPath: `invoices_${new Date().getTime()}.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Invoices exported successfully', filePath };
      }
    }
    return result;
  });

  ipcMain.handle('export:loans', async (event, filters, format) => {
    const result = await ImportExportService.exportGoldLoans(filters, format);
    if (result.success) {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Export Gold Loans',
        defaultPath: `gold_loans_${new Date().getTime()}.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Gold loans exported successfully', filePath };
      }
    }
    return result;
  });

  ipcMain.handle('export:generateTemplate', async (event, type) => {
    const result = ImportExportService.generateTemplate(type);
    if (result.success) {
      const { filePath } = await dialog.showSaveDialog({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Import Template`,
        defaultPath: `${type}_template.xlsx`,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      });

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Template generated successfully', filePath };
      }
    }
    return result;
  });
}
