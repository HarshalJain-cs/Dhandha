import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { PrinterService } from '../services/printerService';

/**
 * Printer IPC Handlers
 * Handles communication between renderer and main process for printer operations
 */

export function setupPrinterHandlers(): void {
  /**
   * Find all available USB printers
   */
  ipcMain.handle('printer:findPrinters', async (_event: IpcMainInvokeEvent) => {
    try {
      return await PrinterService.findPrinters();
    } catch (error: any) {
      console.error('IPC printer:findPrinters error:', error);
      return {
        success: false,
        message: 'An error occurred while finding printers',
      };
    }
  });

  /**
   * Connect to a printer
   */
  ipcMain.handle('printer:connect', async (_event: IpcMainInvokeEvent, printerId: string) => {
    try {
      return await PrinterService.connect(printerId);
    } catch (error: any) {
      console.error('IPC printer:connect error:', error);
      return {
        success: false,
        message: 'An error occurred while connecting to printer',
      };
    }
  });

  /**
   * Disconnect from printer
   */
  ipcMain.handle('printer:disconnect', async (_event: IpcMainInvokeEvent) => {
    try {
      return await PrinterService.disconnect();
    } catch (error: any) {
      console.error('IPC printer:disconnect error:', error);
      return {
        success: false,
        message: 'An error occurred while disconnecting printer',
      };
    }
  });

  /**
   * Get printer settings
   */
  ipcMain.handle('printer:getSettings', async (_event: IpcMainInvokeEvent) => {
    try {
      return await PrinterService.getSettings();
    } catch (error: any) {
      console.error('IPC printer:getSettings error:', error);
      return {
        success: false,
        message: 'An error occurred while getting printer settings',
      };
    }
  });

  /**
   * Save printer settings
   */
  ipcMain.handle('printer:saveSettings', async (_event: IpcMainInvokeEvent, settings: any) => {
    try {
      return await PrinterService.saveSettings(settings);
    } catch (error: any) {
      console.error('IPC printer:saveSettings error:', error);
      return {
        success: false,
        message: 'An error occurred while saving printer settings',
      };
    }
  });

  /**
   * Set paper width
   */
  ipcMain.handle('printer:setPaperWidth', async (_event: IpcMainInvokeEvent, width: 58 | 80) => {
    try {
      return await PrinterService.setPaperWidth(width);
    } catch (error: any) {
      console.error('IPC printer:setPaperWidth error:', error);
      return {
        success: false,
        message: 'An error occurred while setting paper width',
      };
    }
  });

  /**
   * Print invoice
   */
  ipcMain.handle('printer:printInvoice', async (_event: IpcMainInvokeEvent, invoiceId: number) => {
    try {
      return await PrinterService.printInvoice(invoiceId);
    } catch (error: any) {
      console.error('IPC printer:printInvoice error:', error);
      return {
        success: false,
        message: 'An error occurred while printing invoice',
      };
    }
  });

  /**
   * Print barcode label
   */
  ipcMain.handle('printer:printBarcodeLabel', async (_event: IpcMainInvokeEvent, productId: number) => {
    try {
      return await PrinterService.printBarcodeLabel(productId);
    } catch (error: any) {
      console.error('IPC printer:printBarcodeLabel error:', error);
      return {
        success: false,
        message: 'An error occurred while printing barcode label',
      };
    }
  });

  /**
   * Print RFID label
   */
  ipcMain.handle('printer:printRFIDLabel', async (_event: IpcMainInvokeEvent, productId: number) => {
    try {
      return await PrinterService.printRFIDLabel(productId);
    } catch (error: any) {
      console.error('IPC printer:printRFIDLabel error:', error);
      return {
        success: false,
        message: 'An error occurred while printing RFID label',
      };
    }
  });

  /**
   * Test print
   */
  ipcMain.handle('printer:testPrint', async (_event: IpcMainInvokeEvent) => {
    try {
      return await PrinterService.testPrint();
    } catch (error: any) {
      console.error('IPC printer:testPrint error:', error);
      return {
        success: false,
        message: 'An error occurred while performing test print',
      };
    }
  });

  /**
   * Get printer status
   */
  ipcMain.handle('printer:getStatus', async (_event: IpcMainInvokeEvent) => {
    try {
      return await PrinterService.getStatus();
    } catch (error: any) {
      console.error('IPC printer:getStatus error:', error);
      return {
        success: false,
        message: 'An error occurred while getting printer status',
      };
    }
  });

  console.log('Printer IPC handlers registered');
}
