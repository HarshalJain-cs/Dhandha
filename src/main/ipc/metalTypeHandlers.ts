import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { MetalTypeService } from '../services/metalTypeService';

/**
 * Metal Type IPC Handlers
 * Handles IPC communication for metal type operations
 */

/**
 * Setup all metal type IPC handlers
 */
export const setupMetalTypeHandlers = (): void => {
  /**
   * Handle metal type creation
   */
  ipcMain.handle('metalType:create', async (
    _event: IpcMainInvokeEvent,
    metalTypeData: {
      metal_name: string;
      metal_code: string;
      purity_percentage: number;
      current_rate_per_gram: number;
      unit?: string;
      created_by: number;
    }
  ) => {
    try {
      return await MetalTypeService.create(metalTypeData);
    } catch (error: any) {
      console.error('IPC metalType:create error:', error);
      return {
        success: false,
        message: 'An error occurred while creating metal type',
      };
    }
  });

  /**
   * Handle get all metal types
   */
  ipcMain.handle('metalType:getAll', async (
    _event: IpcMainInvokeEvent,
    filters?: {
      is_active?: boolean;
      search?: string;
    }
  ) => {
    try {
      return await MetalTypeService.getAll(filters);
    } catch (error: any) {
      console.error('IPC metalType:getAll error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving metal types',
      };
    }
  });

  /**
   * Handle get metal type by ID
   */
  ipcMain.handle('metalType:getById', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await MetalTypeService.getById(id);
    } catch (error: any) {
      console.error('IPC metalType:getById error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving metal type',
      };
    }
  });

  /**
   * Handle metal type update
   */
  ipcMain.handle('metalType:update', async (
    _event: IpcMainInvokeEvent,
    id: number,
    updateData: Partial<{
      metal_name: string;
      metal_code: string;
      purity_percentage: number;
      current_rate_per_gram: number;
      unit: string;
      is_active: boolean;
    }>,
    updatedBy: number
  ) => {
    try {
      return await MetalTypeService.update(id, updateData, updatedBy);
    } catch (error: any) {
      console.error('IPC metalType:update error:', error);
      return {
        success: false,
        message: 'An error occurred while updating metal type',
      };
    }
  });

  /**
   * Handle metal type deletion
   */
  ipcMain.handle('metalType:delete', async (
    _event: IpcMainInvokeEvent,
    id: number,
    deletedBy: number
  ) => {
    try {
      return await MetalTypeService.delete(id, deletedBy);
    } catch (error: any) {
      console.error('IPC metalType:delete error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting metal type',
      };
    }
  });

  /**
   * Handle metal rate update
   */
  ipcMain.handle('metalType:updateRate', async (
    _event: IpcMainInvokeEvent,
    id: number,
    newRate: number,
    updatedBy: number
  ) => {
    try {
      return await MetalTypeService.updateRate(id, newRate, updatedBy);
    } catch (error: any) {
      console.error('IPC metalType:updateRate error:', error);
      return {
        success: false,
        message: 'An error occurred while updating metal rate',
      };
    }
  });

  /**
   * Handle get current rates
   */
  ipcMain.handle('metalType:getCurrentRates', async (_event: IpcMainInvokeEvent) => {
    try {
      return await MetalTypeService.getCurrentRates();
    } catch (error: any) {
      console.error('IPC metalType:getCurrentRates error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving current rates',
      };
    }
  });

  /**
   * Handle calculate fine weight
   */
  ipcMain.handle('metalType:calculateFineWeight', async (
    _event: IpcMainInvokeEvent,
    metalTypeId: number,
    grossWeight: number
  ) => {
    try {
      return await MetalTypeService.calculateFineWeight(metalTypeId, grossWeight);
    } catch (error: any) {
      console.error('IPC metalType:calculateFineWeight error:', error);
      return {
        success: false,
        message: 'An error occurred while calculating fine weight',
      };
    }
  });

  /**
   * Handle get metal types by metal name
   */
  ipcMain.handle('metalType:getByMetalName', async (
    _event: IpcMainInvokeEvent,
    metalName: string
  ) => {
    try {
      return await MetalTypeService.getByMetalName(metalName);
    } catch (error: any) {
      console.error('IPC metalType:getByMetalName error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving metal types',
      };
    }
  });

  /**
   * Handle calculate metal value
   */
  ipcMain.handle('metalType:calculateMetalValue', async (
    _event: IpcMainInvokeEvent,
    metalTypeId: number,
    grossWeight: number
  ) => {
    try {
      return await MetalTypeService.calculateMetalValue(metalTypeId, grossWeight);
    } catch (error: any) {
      console.error('IPC metalType:calculateMetalValue error:', error);
      return {
        success: false,
        message: 'An error occurred while calculating metal value',
      };
    }
  });

  console.log('✓ Metal Type IPC handlers registered');
};

export default setupMetalTypeHandlers;
