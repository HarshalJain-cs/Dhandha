import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { HardwareService } from '../services/hardwareService';
import log from 'electron-log';

/**
 * Hardware IPC Handlers
 * IPC handlers for barcode scanner, RFID reader, and weighing scale
 */

/**
 * Setup hardware IPC handlers
 */
export function setupHardwareHandlers(): void {
  // ============================================
  // SETTINGS
  // ============================================

  /**
   * Get hardware settings
   */
  ipcMain.handle('hardware:getSettings', async (_event: IpcMainInvokeEvent) => {
    try {
      const settings = HardwareService.getSettings();
      return {
        success: true,
        message: 'Settings retrieved successfully',
        data: settings,
      };
    } catch (error: any) {
      log.error('IPC hardware:getSettings error:', error);
      return {
        success: false,
        message: 'Failed to get settings',
      };
    }
  });

  /**
   * Save hardware settings
   */
  ipcMain.handle(
    'hardware:saveSettings',
    async (_event: IpcMainInvokeEvent, settings: any) => {
      try {
        return HardwareService.saveSettings(settings);
      } catch (error: any) {
        log.error('IPC hardware:saveSettings error:', error);
        return {
          success: false,
          message: 'Failed to save settings',
        };
      }
    }
  );

  /**
   * Toggle hardware mode (real/mock)
   */
  ipcMain.handle(
    'hardware:toggleMode',
    async (_event: IpcMainInvokeEvent, mode: 'real' | 'mock') => {
      try {
        return HardwareService.toggleMode(mode);
      } catch (error: any) {
        log.error('IPC hardware:toggleMode error:', error);
        return {
          success: false,
          message: 'Failed to toggle mode',
        };
      }
    }
  );

  /**
   * Disconnect all hardware
   */
  ipcMain.handle('hardware:disconnectAll', async (_event: IpcMainInvokeEvent) => {
    try {
      HardwareService.disconnectAll();
      return {
        success: true,
        message: 'All hardware disconnected',
      };
    } catch (error: any) {
      log.error('IPC hardware:disconnectAll error:', error);
      return {
        success: false,
        message: 'Failed to disconnect hardware',
      };
    }
  });

  // ============================================
  // BARCODE SCANNER
  // ============================================

  /**
   * Scan barcode (single scan)
   */
  ipcMain.handle('hardware:barcode:scan', async (_event: IpcMainInvokeEvent) => {
    try {
      return await HardwareService.scanBarcode();
    } catch (error: any) {
      log.error('IPC hardware:barcode:scan error:', error);
      return {
        success: false,
        message: 'Failed to scan barcode',
      };
    }
  });

  /**
   * Start continuous barcode scanning
   */
  ipcMain.handle(
    'hardware:barcode:startContinuous',
    async (event: IpcMainInvokeEvent) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);

        return await HardwareService.startBarcodeContinuous((barcode: string) => {
          // Send barcode data to renderer
          window?.webContents.send('hardware:barcode:data', barcode);
        });
      } catch (error: any) {
        log.error('IPC hardware:barcode:startContinuous error:', error);
        return {
          success: false,
          message: 'Failed to start continuous scan',
        };
      }
    }
  );

  /**
   * Stop continuous barcode scanning
   */
  ipcMain.handle(
    'hardware:barcode:stopContinuous',
    async (_event: IpcMainInvokeEvent) => {
      try {
        return HardwareService.stopBarcodeContinuous();
      } catch (error: any) {
        log.error('IPC hardware:barcode:stopContinuous error:', error);
        return {
          success: false,
          message: 'Failed to stop continuous scan',
        };
      }
    }
  );

  // ============================================
  // RFID READER
  // ============================================

  /**
   * Read RFID tag (single read)
   */
  ipcMain.handle('hardware:rfid:read', async (_event: IpcMainInvokeEvent) => {
    try {
      return await HardwareService.readRFID();
    } catch (error: any) {
      log.error('IPC hardware:rfid:read error:', error);
      return {
        success: false,
        message: 'Failed to read RFID',
      };
    }
  });

  /**
   * Start continuous RFID reading
   */
  ipcMain.handle(
    'hardware:rfid:startContinuous',
    async (event: IpcMainInvokeEvent) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);

        return await HardwareService.startRFIDContinuous(
          (tag: string, rssi: number) => {
            // Send RFID data to renderer
            window?.webContents.send('hardware:rfid:data', { tag, rssi });
          }
        );
      } catch (error: any) {
        log.error('IPC hardware:rfid:startContinuous error:', error);
        return {
          success: false,
          message: 'Failed to start continuous read',
        };
      }
    }
  );

  /**
   * Stop continuous RFID reading
   */
  ipcMain.handle(
    'hardware:rfid:stopContinuous',
    async (_event: IpcMainInvokeEvent) => {
      try {
        return HardwareService.stopRFIDContinuous();
      } catch (error: any) {
        log.error('IPC hardware:rfid:stopContinuous error:', error);
        return {
          success: false,
          message: 'Failed to stop continuous read',
        };
      }
    }
  );

  // ============================================
  // WEIGHING SCALE
  // ============================================

  /**
   * Read weight from scale (single read)
   */
  ipcMain.handle('hardware:scale:read', async (_event: IpcMainInvokeEvent) => {
    try {
      return await HardwareService.readScale();
    } catch (error: any) {
      log.error('IPC hardware:scale:read error:', error);
      return {
        success: false,
        message: 'Failed to read weight',
      };
    }
  });

  /**
   * Tare the scale (zero)
   */
  ipcMain.handle('hardware:scale:tare', async (_event: IpcMainInvokeEvent) => {
    try {
      return await HardwareService.tareScale();
    } catch (error: any) {
      log.error('IPC hardware:scale:tare error:', error);
      return {
        success: false,
        message: 'Failed to tare scale',
      };
    }
  });

  /**
   * Start continuous scale reading
   */
  ipcMain.handle(
    'hardware:scale:startContinuous',
    async (event: IpcMainInvokeEvent) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);

        return await HardwareService.startScaleContinuous(
          (weight: number, stable: boolean) => {
            // Send weight data to renderer
            window?.webContents.send('hardware:scale:data', { weight, stable });
          }
        );
      } catch (error: any) {
        log.error('IPC hardware:scale:startContinuous error:', error);
        return {
          success: false,
          message: 'Failed to start continuous read',
        };
      }
    }
  );

  /**
   * Stop continuous scale reading
   */
  ipcMain.handle(
    'hardware:scale:stopContinuous',
    async (_event: IpcMainInvokeEvent) => {
      try {
        return HardwareService.stopScaleContinuous();
      } catch (error: any) {
        log.error('IPC hardware:scale:stopContinuous error:', error);
        return {
          success: false,
          message: 'Failed to stop continuous read',
        };
      }
    }
  );

  log.info('Hardware IPC handlers registered');
}
