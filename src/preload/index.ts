import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload Script
 * Exposes safe IPC methods to the renderer process
 * Acts as a bridge between main and renderer processes
 */

/**
 * Authentication API
 */
const authAPI = {
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),

  validateToken: (token: string) =>
    ipcRenderer.invoke('auth:validateToken', token),

  changePassword: (userId: number, currentPassword: string, newPassword: string) =>
    ipcRenderer.invoke('auth:changePassword', userId, currentPassword, newPassword),

  createUser: (userData: {
    username: string;
    password: string;
    email: string;
    full_name: string;
    role_id: number;
    branch_id?: number;
    created_by: number;
  }) => ipcRenderer.invoke('auth:createUser', userData),

  getUserById: (userId: number) =>
    ipcRenderer.invoke('auth:getUserById', userId),

  updateUser: (
    userId: number,
    updateData: Partial<{
      email: string;
      full_name: string;
      role_id: number;
      branch_id: number;
      is_active: boolean;
    }>,
    updatedBy: number
  ) => ipcRenderer.invoke('auth:updateUser', userId, updateData, updatedBy),

  deactivateUser: (userId: number, updatedBy: number) =>
    ipcRenderer.invoke('auth:deactivateUser', userId, updatedBy),

  getAllUsers: () =>
    ipcRenderer.invoke('auth:getAllUsers'),
};

/**
 * Sync API
 */
const syncAPI = {
  getStatus: () =>
    ipcRenderer.invoke('sync:getStatus'),

  triggerSync: () =>
    ipcRenderer.invoke('sync:triggerSync'),

  toggleSync: (enabled: boolean) =>
    ipcRenderer.invoke('sync:toggleSync', enabled),

  updateInterval: (intervalMinutes: number) =>
    ipcRenderer.invoke('sync:updateInterval', intervalMinutes),

  cleanup: (daysToKeep?: number) =>
    ipcRenderer.invoke('sync:cleanup', daysToKeep),
};

/**
 * Expose APIs to renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  auth: authAPI,
  sync: syncAPI,
  // Additional APIs will be added here
  // product: productAPI,
  // customer: customerAPI,
  // invoice: invoiceAPI,
  // etc.
});

/**
 * TypeScript type definitions for window.electronAPI
 * This will be used in the renderer process
 */
export interface ElectronAPI {
  auth: typeof authAPI;
  sync: typeof syncAPI;
}

// Extend the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
