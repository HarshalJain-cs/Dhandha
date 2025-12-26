import { ipcMain } from 'electron';
import { VendorService } from '../services/vendorService';

export function setupVendorHandlers(): void {
  ipcMain.handle('vendor:create', async (event, data, userId) => {
    return await VendorService.createVendor(data, userId);
  });

  ipcMain.handle('vendor:getAll', async (event, filters, pagination) => {
    return await VendorService.getAllVendors(filters, pagination);
  });

  ipcMain.handle('vendor:getById', async (event, id) => {
    return await VendorService.getVendorById(id);
  });

  ipcMain.handle('vendor:update', async (event, id, data, userId) => {
    return await VendorService.updateVendor(id, data, userId);
  });

  ipcMain.handle('vendor:getBalance', async (event, id) => {
    return await VendorService.getVendorBalance(id);
  });
}
