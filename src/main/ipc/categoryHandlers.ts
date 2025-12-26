import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { CategoryService } from '../services/categoryService';

/**
 * Category IPC Handlers
 * Handles IPC communication for category operations
 */

/**
 * Setup all category IPC handlers
 */
export const setupCategoryHandlers = (): void => {
  /**
   * Handle category creation
   */
  ipcMain.handle('category:create', async (
    _event: IpcMainInvokeEvent,
    categoryData: {
      category_name: string;
      category_code: string;
      parent_category_id?: number;
      description?: string;
      hsn_code?: string;
      tax_percentage?: number;
      created_by: number;
    }
  ) => {
    try {
      return await CategoryService.create(categoryData);
    } catch (error: any) {
      console.error('IPC category:create error:', error);
      return {
        success: false,
        message: 'An error occurred while creating category',
      };
    }
  });

  /**
   * Handle get all categories
   */
  ipcMain.handle('category:getAll', async (
    _event: IpcMainInvokeEvent,
    filters?: {
      is_active?: boolean;
      parent_category_id?: number | null;
      search?: string;
    }
  ) => {
    try {
      return await CategoryService.getAll(filters);
    } catch (error: any) {
      console.error('IPC category:getAll error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving categories',
      };
    }
  });

  /**
   * Handle get category by ID
   */
  ipcMain.handle('category:getById', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await CategoryService.getById(id);
    } catch (error: any) {
      console.error('IPC category:getById error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category',
      };
    }
  });

  /**
   * Handle category update
   */
  ipcMain.handle('category:update', async (
    _event: IpcMainInvokeEvent,
    id: number,
    updateData: Partial<{
      category_name: string;
      category_code: string;
      parent_category_id: number;
      description: string;
      hsn_code: string;
      tax_percentage: number;
      is_active: boolean;
    }>,
    updatedBy: number
  ) => {
    try {
      return await CategoryService.update(id, updateData, updatedBy);
    } catch (error: any) {
      console.error('IPC category:update error:', error);
      return {
        success: false,
        message: 'An error occurred while updating category',
      };
    }
  });

  /**
   * Handle category deletion
   */
  ipcMain.handle('category:delete', async (
    _event: IpcMainInvokeEvent,
    id: number,
    deletedBy: number
  ) => {
    try {
      return await CategoryService.delete(id, deletedBy);
    } catch (error: any) {
      console.error('IPC category:delete error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting category',
      };
    }
  });

  /**
   * Handle get category tree
   */
  ipcMain.handle('category:getTree', async (
    _event: IpcMainInvokeEvent,
    parentId: number | null = null
  ) => {
    try {
      return await CategoryService.getTree(parentId);
    } catch (error: any) {
      console.error('IPC category:getTree error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category tree',
      };
    }
  });

  /**
   * Handle get category children
   */
  ipcMain.handle('category:getChildren', async (
    _event: IpcMainInvokeEvent,
    parentId: number
  ) => {
    try {
      return await CategoryService.getChildren(parentId);
    } catch (error: any) {
      console.error('IPC category:getChildren error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving child categories',
      };
    }
  });

  /**
   * Handle get category full path
   */
  ipcMain.handle('category:getFullPath', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await CategoryService.getFullPath(id);
    } catch (error: any) {
      console.error('IPC category:getFullPath error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category path',
      };
    }
  });

  /**
   * Handle get root categories
   */
  ipcMain.handle('category:getRootCategories', async (_event: IpcMainInvokeEvent) => {
    try {
      return await CategoryService.getRootCategories();
    } catch (error: any) {
      console.error('IPC category:getRootCategories error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving root categories',
      };
    }
  });

  /**
   * Handle get category breadcrumb
   */
  ipcMain.handle('category:getBreadcrumb', async (
    _event: IpcMainInvokeEvent,
    id: number
  ) => {
    try {
      return await CategoryService.getBreadcrumb(id);
    } catch (error: any) {
      console.error('IPC category:getBreadcrumb error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category breadcrumb',
      };
    }
  });

  console.log('✓ Category IPC handlers registered');
};

export default setupCategoryHandlers;
