import { ipcMain } from 'electron';
import { PurchaseOrderService } from '../services/purchaseOrderService';

export function setupPurchaseOrderHandlers(): void {
  ipcMain.handle('purchaseOrder:create', async (event, data, userId) => {
    return await PurchaseOrderService.createPurchaseOrder(data, userId);
  });

  ipcMain.handle('purchaseOrder:getAll', async (event, filters, pagination) => {
    return await PurchaseOrderService.getAllPurchaseOrders(filters, pagination);
  });

  ipcMain.handle('purchaseOrder:getById', async (event, id) => {
    return await PurchaseOrderService.getPurchaseOrderById(id);
  });

  // Note: Update handler commented out as service method doesn't exist yet
  // ipcMain.handle('purchaseOrder:update', async (event, id, data, userId) => {
  //   return await PurchaseOrderService.updatePurchaseOrder(id, data, userId);
  // });

  ipcMain.handle('purchaseOrder:receive', async (event, id, receivedQty, userId) => {
    return await PurchaseOrderService.receivePurchaseOrder(id, receivedQty, userId);
  });

  ipcMain.handle('purchaseOrder:cancel', async (event, id, reason, userId) => {
    return await PurchaseOrderService.cancelPurchaseOrder(id, reason, userId);
  });

  ipcMain.handle('purchaseOrder:getStats', async () => {
    return await PurchaseOrderService.getPurchaseOrderStats();
  });
}
