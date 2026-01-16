import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { ProductService, ProductFilters } from '../services/productService';

/**
 * Product IPC Handlers
 * Handles IPC communication for product operations
 */

/**
 * Setup all product IPC handlers
 */
export const setupProductHandlers = (): void => {
  /**
   * Handle product creation
   */
  ipcMain.handle('product:create', async (
    _event: IpcMainInvokeEvent,
    productData: any
  ) => {
    try {
      return await ProductService.create(productData);
    } catch (error: any) {
      console.error('IPC product:create error:', error);
      return {
        success: false,
        message: 'An error occurred while creating product',
      };
    }
  });

  /**
   * Handle get all products with filters
   */
  ipcMain.handle('product:getAll', async (
    _event: IpcMainInvokeEvent,
    filters?: ProductFilters,
    pagination?: { page: number; limit: number }
  ) => {
    try {
      return await ProductService.getAll(filters, pagination);
    } catch (error: any) {
      console.error('IPC product:getAll error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving products',
      };
    }
  });

  /**
   * Handle get product by ID
   */
  ipcMain.handle('product:getById', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await ProductService.getById(id);
    } catch (error: any) {
      console.error('IPC product:getById error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving product',
      };
    }
  });

  /**
   * Handle product update
   */
  ipcMain.handle('product:update', async (
    _event: IpcMainInvokeEvent,
    id: number,
    updateData: any,
    updatedBy: number
  ) => {
    try {
      return await ProductService.update(id, updateData, updatedBy);
    } catch (error: any) {
      console.error('IPC product:update error:', error);
      return {
        success: false,
        message: 'An error occurred while updating product',
      };
    }
  });

  /**
   * Handle product deletion
   */
  ipcMain.handle('product:delete', async (
    _event: IpcMainInvokeEvent,
    id: number,
    deletedBy: number
  ) => {
    try {
      return await ProductService.delete(id, deletedBy);
    } catch (error: any) {
      console.error('IPC product:delete error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting product',
      };
    }
  });

  /**
   * Handle stock update
   */
  ipcMain.handle('product:updateStock', async (
    _event: IpcMainInvokeEvent,
    id: number,
    quantity: number,
    operation: 'add' | 'subtract' | 'set',
    updatedBy: number
  ) => {
    try {
      return await ProductService.updateStock(id, quantity, operation, updatedBy);
    } catch (error: any) {
      console.error('IPC product:updateStock error:', error);
      return {
        success: false,
        message: 'An error occurred while updating stock',
      };
    }
  });

  /**
   * Handle get low stock products
   */
  ipcMain.handle('product:getLowStock', async (_event: IpcMainInvokeEvent) => {
    try {
      return await ProductService.getLowStockProducts();
    } catch (error: any) {
      console.error('IPC product:getLowStock error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving low stock products',
      };
    }
  });

  /**
   * Handle get out of stock products
   */
  ipcMain.handle('product:getOutOfStock', async (_event: IpcMainInvokeEvent) => {
    try {
      return await ProductService.getOutOfStockProducts();
    } catch (error: any) {
      console.error('IPC product:getOutOfStock error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving out of stock products',
      };
    }
  });

  /**
   * Handle search by barcode
   */
  ipcMain.handle('product:searchByBarcode', async (
    _event: IpcMainInvokeEvent,
    barcode: string
  ) => {
    try {
      return await ProductService.searchByBarcode(barcode);
    } catch (error: any) {
      console.error('IPC product:searchByBarcode error:', error);
      return {
        success: false,
        message: 'An error occurred while searching product by barcode',
      };
    }
  });

  /**
   * Handle search by RFID
   */
  ipcMain.handle('product:searchByRFID', async (
    _event: IpcMainInvokeEvent,
    rfidTag: string
  ) => {
    try {
      return await ProductService.searchByRFID(rfidTag);
    } catch (error: any) {
      console.error('IPC product:searchByRFID error:', error);
      return {
        success: false,
        message: 'An error occurred while searching product by RFID',
      };
    }
  });

  /**
   * Handle get products by category
   */
  ipcMain.handle('product:getByCategory', async (
    _event: IpcMainInvokeEvent,
    categoryId: number
  ) => {
    try {
      return await ProductService.getByCategory(categoryId);
    } catch (error: any) {
      console.error('IPC product:getByCategory error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving products by category',
      };
    }
  });

  /**
   * Handle get products by tags
   */
  ipcMain.handle('product:getByTags', async (
    _event: IpcMainInvokeEvent,
    tags: string[]
  ) => {
    try {
      return await ProductService.getByTags(tags);
    } catch (error: any) {
      console.error('IPC product:getByTags error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving products by tags',
      };
    }
  });

  /**
   * Handle product code generation
   */
  ipcMain.handle('product:generateCode', async (
    _event: IpcMainInvokeEvent,
    categoryId: number,
    metalTypeId: number
  ) => {
    try {
      return await ProductService.generateCode(categoryId, metalTypeId);
    } catch (error: any) {
      console.error('IPC product:generateCode error:', error);
      return {
        success: false,
        message: 'An error occurred while generating product code',
      };
    }
  });

  /**
   * Handle get stock history
   */
  ipcMain.handle('product:getStockHistory', async (
    _event: IpcMainInvokeEvent,
    productId: number,
    filters?: any,
    pagination?: any
  ) => {
    try {
      return await ProductService.getStockHistory(productId, filters, pagination);
    } catch (error: any) {
      console.error('IPC product:getStockHistory error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stock history',
      };
    }
  });

  /**
   * Handle get stock summary for charts
   */
  ipcMain.handle('product:getStockSummary', async (
    _event: IpcMainInvokeEvent,
    productId: number,
    days?: number
  ) => {
    try {
      return await ProductService.getStockSummary(productId, days);
    } catch (error: any) {
      console.error('IPC product:getStockSummary error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stock summary',
      };
    }
  });

  /**
   * Handle get stock activity for timeline
   */
  ipcMain.handle('product:getStockActivity', async (
    _event: IpcMainInvokeEvent,
    productId: number,
    limit?: number
  ) => {
    try {
      return await ProductService.getStockActivity(productId, limit);
    } catch (error: any) {
      console.error('IPC product:getStockActivity error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stock activity',
      };
    }
  });

  console.log('✓ Product IPC handlers registered');
};

export default setupProductHandlers;
