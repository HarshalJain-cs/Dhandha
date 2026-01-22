import { ipcMain, dialog } from 'electron';
import type { SaveDialogReturnValue } from 'electron';
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
      const dialogResult = await dialog.showSaveDialog({
        title: 'Export Invoices',
        defaultPath: `invoices_${new Date().getTime()}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      }) as unknown as SaveDialogReturnValue;

      const { filePath } = dialogResult;

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Products exported successfully', filePath };
      }
    }
    return result;
  });

  ipcMain.handle('export:customers', async (event, filters, format) => {
    const exportResult = await ImportExportService.exportCustomers(filters, format);
    if (exportResult.success) {
      const dialogResult = await dialog.showSaveDialog({
        title: 'Export Customers',
        defaultPath: `customers_${new Date().getTime()}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      }) as unknown as SaveDialogReturnValue;

      const { filePath } = dialogResult;

      if (filePath) {
        fs.writeFileSync(filePath, exportResult.data);
        return { success: true, message: 'Customers exported successfully', filePath };
      }
    }
    return exportResult;
  });

  ipcMain.handle('export:invoices', async (event, filters, format) => {
    const exportResult = await ImportExportService.exportInvoices(filters, format);
    if (exportResult.success) {
      const dialogResult = await dialog.showSaveDialog({
        title: 'Export Invoices',
        defaultPath: `invoices_${new Date().getTime()}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      }) as unknown as SaveDialogReturnValue;

      const { filePath } = dialogResult;

      if (filePath) {
        fs.writeFileSync(filePath, exportResult.data);
        return { success: true, message: 'Invoices exported successfully', filePath };
      }
    }
    return exportResult;
  });

  ipcMain.handle('export:loans', async (event, filters, format) => {
    const exportResult = await ImportExportService.exportGoldLoans(filters, format);
    if (exportResult.success) {
      const dialogResult = await dialog.showSaveDialog({
        title: 'Export Gold Loans',
        defaultPath: `loans_${new Date().getTime()}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      }) as unknown as SaveDialogReturnValue;

      const { filePath } = dialogResult;

      if (filePath) {
        fs.writeFileSync(filePath, exportResult.data);
        return { success: true, message: 'Gold loans exported successfully', filePath };
      }
    }
    return exportResult;
  });

  ipcMain.handle('export:generateTemplate', async (event, type) => {
    const result = ImportExportService.generateTemplate(type);
    if (result.success) {
      const dialogResult = await dialog.showSaveDialog({
        title: 'Export Karigars',
        defaultPath: `karigars_${new Date().getTime()}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      }) as unknown as SaveDialogReturnValue;

      const { filePath } = dialogResult;

      if (filePath) {
        fs.writeFileSync(filePath, result.data);
        return { success: true, message: 'Template generated successfully', filePath };
      }
    }
    return result;
  });
}
