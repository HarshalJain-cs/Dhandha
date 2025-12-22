import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AuthService } from '../services/authService';

/**
 * Authentication IPC Handlers
 * Handles IPC communication for authentication operations
 */

/**
 * Setup all authentication IPC handlers
 */
export const setupAuthHandlers = (): void => {
  /**
   * Handle user login
   */
  ipcMain.handle('auth:login', async (
    _event: IpcMainInvokeEvent,
    username: string,
    password: string
  ) => {
    try {
      return await AuthService.login(username, password);
    } catch (error: any) {
      console.error('IPC auth:login error:', error);
      return {
        success: false,
        message: 'An error occurred during login',
      };
    }
  });

  /**
   * Handle token validation
   */
  ipcMain.handle('auth:validateToken', async (
    _event: IpcMainInvokeEvent,
    token: string
  ) => {
    try {
      const user = await AuthService.validateTokenAndGetUser(token);
      if (user) {
        return {
          success: true,
          user: user.toSafeObject(),
        };
      }
      return {
        success: false,
        message: 'Invalid or expired token',
      };
    } catch (error: any) {
      console.error('IPC auth:validateToken error:', error);
      return {
        success: false,
        message: 'An error occurred during token validation',
      };
    }
  });

  /**
   * Handle password change
   */
  ipcMain.handle('auth:changePassword', async (
    _event: IpcMainInvokeEvent,
    userId: number,
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      return await AuthService.changePassword(userId, currentPassword, newPassword);
    } catch (error: any) {
      console.error('IPC auth:changePassword error:', error);
      return {
        success: false,
        message: 'An error occurred while changing password',
      };
    }
  });

  /**
   * Handle user creation
   */
  ipcMain.handle('auth:createUser', async (
    _event: IpcMainInvokeEvent,
    userData: {
      username: string;
      password: string;
      email: string;
      full_name: string;
      role_id: number;
      branch_id?: number;
      created_by: number;
    }
  ) => {
    try {
      return await AuthService.createUser(userData);
    } catch (error: any) {
      console.error('IPC auth:createUser error:', error);
      return {
        success: false,
        message: 'An error occurred while creating user',
      };
    }
  });

  /**
   * Handle get user by ID
   */
  ipcMain.handle('auth:getUserById', async (
    _event: IpcMainInvokeEvent,
    userId: number
  ) => {
    try {
      const user = await AuthService.getUserById(userId);
      if (user) {
        return {
          success: true,
          user: user.toSafeObject(),
        };
      }
      return {
        success: false,
        message: 'User not found',
      };
    } catch (error: any) {
      console.error('IPC auth:getUserById error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching user',
      };
    }
  });

  /**
   * Handle user update
   */
  ipcMain.handle('auth:updateUser', async (
    _event: IpcMainInvokeEvent,
    userId: number,
    updateData: Partial<{
      email: string;
      full_name: string;
      role_id: number;
      branch_id: number;
      is_active: boolean;
    }>,
    updatedBy: number
  ) => {
    try {
      return await AuthService.updateUser(userId, updateData, updatedBy);
    } catch (error: any) {
      console.error('IPC auth:updateUser error:', error);
      return {
        success: false,
        message: 'An error occurred while updating user',
      };
    }
  });

  /**
   * Handle user deactivation
   */
  ipcMain.handle('auth:deactivateUser', async (
    _event: IpcMainInvokeEvent,
    userId: number,
    updatedBy: number
  ) => {
    try {
      return await AuthService.deactivateUser(userId, updatedBy);
    } catch (error: any) {
      console.error('IPC auth:deactivateUser error:', error);
      return {
        success: false,
        message: 'An error occurred while deactivating user',
      };
    }
  });

  /**
   * Handle get all users
   */
  ipcMain.handle('auth:getAllUsers', async (_event: IpcMainInvokeEvent) => {
    try {
      const users = await AuthService.getAllUsers();
      return {
        success: true,
        users: users.map(user => user.toSafeObject()),
      };
    } catch (error: any) {
      console.error('IPC auth:getAllUsers error:', error);
      return {
        success: false,
        message: 'An error occurred while fetching users',
        users: [],
      };
    }
  });

  console.log('✓ Authentication IPC handlers registered');
};

export default setupAuthHandlers;
