import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { StoneService } from '../services/stoneService';

/**
 * Stone IPC Handlers
 * Handles IPC communication for stone/diamond operations
 */

/**
 * Setup all stone IPC handlers
 */
export const setupStoneHandlers = (): void => {
  /**
   * Handle stone creation
   */
  ipcMain.handle('stone:create', async (
    _event: IpcMainInvokeEvent,
    stoneData: {
      stone_name: string;
      stone_code: string;
      stone_type: string;
      base_rate_per_carat: number;
      unit?: string;
      description?: string;
      created_by: number;
    }
  ) => {
    try {
      return await StoneService.create(stoneData);
    } catch (error: any) {
      console.error('IPC stone:create error:', error);
      return {
        success: false,
        message: 'An error occurred while creating stone',
      };
    }
  });

  /**
   * Handle get all stones
   */
  ipcMain.handle('stone:getAll', async (
    _event: IpcMainInvokeEvent,
    filters?: {
      is_active?: boolean;
      stone_type?: string;
      search?: string;
    }
  ) => {
    try {
      return await StoneService.getAll(filters);
    } catch (error: any) {
      console.error('IPC stone:getAll error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stones',
      };
    }
  });

  /**
   * Handle get stone by ID
   */
  ipcMain.handle('stone:getById', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await StoneService.getById(id);
    } catch (error: any) {
      console.error('IPC stone:getById error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stone',
      };
    }
  });

  /**
   * Handle stone update
   */
  ipcMain.handle('stone:update', async (
    _event: IpcMainInvokeEvent,
    id: number,
    updateData: Partial<{
      stone_name: string;
      stone_code: string;
      stone_type: string;
      base_rate_per_carat: number;
      unit: string;
      description: string;
      is_active: boolean;
    }>,
    updatedBy: number
  ) => {
    try {
      return await StoneService.update(id, updateData, updatedBy);
    } catch (error: any) {
      console.error('IPC stone:update error:', error);
      return {
        success: false,
        message: 'An error occurred while updating stone',
      };
    }
  });

  /**
   * Handle stone deletion
   */
  ipcMain.handle('stone:delete', async (
    _event: IpcMainInvokeEvent,
    id: number,
    deletedBy: number
  ) => {
    try {
      return await StoneService.delete(id, deletedBy);
    } catch (error: any) {
      console.error('IPC stone:delete error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting stone',
      };
    }
  });

  /**
   * Handle add stone to product
   */
  ipcMain.handle('stone:addToProduct', async (
    _event: IpcMainInvokeEvent,
    productStoneData: {
      product_id: number;
      stone_id: number;
      quantity: number;
      carat_weight: number;
      rate_per_carat: number;
      cut_grade?: string;
      color_grade?: string;
      clarity_grade?: string;
      certificate_number?: string;
      certification_lab?: string;
      description?: string;
      created_by: number;
    }
  ) => {
    try {
      return await StoneService.addStoneToProduct(productStoneData);
    } catch (error: any) {
      console.error('IPC stone:addToProduct error:', error);
      return {
        success: false,
        message: 'An error occurred while adding stone to product',
      };
    }
  });

  /**
   * Handle update product stone
   */
  ipcMain.handle('stone:updateProductStone', async (
    _event: IpcMainInvokeEvent,
    id: number,
    updateData: Partial<{
      quantity: number;
      carat_weight: number;
      rate_per_carat: number;
      cut_grade: string;
      color_grade: string;
      clarity_grade: string;
      certificate_number: string;
      certification_lab: string;
      description: string;
    }>,
    updatedBy: number
  ) => {
    try {
      return await StoneService.updateProductStone(id, updateData, updatedBy);
    } catch (error: any) {
      console.error('IPC stone:updateProductStone error:', error);
      return {
        success: false,
        message: 'An error occurred while updating product stone',
      };
    }
  });

  /**
   * Handle remove stone from product
   */
  ipcMain.handle('stone:removeFromProduct', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await StoneService.removeStoneFromProduct(id);
    } catch (error: any) {
      console.error('IPC stone:removeFromProduct error:', error);
      return {
        success: false,
        message: 'An error occurred while removing stone from product',
      };
    }
  });

  /**
   * Handle get product stones
   */
  ipcMain.handle('stone:getProductStones', async (
    _event: IpcMainInvokeEvent,
    productId: number
  ) => {
    try {
      return await StoneService.getProductStones(productId);
    } catch (error: any) {
      console.error('IPC stone:getProductStones error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving product stones',
      };
    }
  });

  /**
   * Handle calculate stone value
   */
  ipcMain.handle('stone:calculateValue', async (
    _event: IpcMainInvokeEvent,
    stoneId: number,
    caratWeight: number,
    quantity: number = 1
  ) => {
    try {
      return await StoneService.calculateStoneValue(stoneId, caratWeight, quantity);
    } catch (error: any) {
      console.error('IPC stone:calculateValue error:', error);
      return {
        success: false,
        message: 'An error occurred while calculating stone value',
      };
    }
  });

  /**
   * Handle get stones by type
   */
  ipcMain.handle('stone:getByType', async (
    _event: IpcMainInvokeEvent,
    stoneType: string
  ) => {
    try {
      return await StoneService.getByType(stoneType);
    } catch (error: any) {
      console.error('IPC stone:getByType error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stones by type',
      };
    }
  });

  /**
   * Handle get stone types
   */
  ipcMain.handle('stone:getStoneTypes', async (_event: IpcMainInvokeEvent) => {
    try {
      return await StoneService.getStoneTypes();
    } catch (error: any) {
      console.error('IPC stone:getStoneTypes error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stone types',
      };
    }
  });

  console.log('✓ Stone IPC handlers registered');
};

export default setupStoneHandlers;
