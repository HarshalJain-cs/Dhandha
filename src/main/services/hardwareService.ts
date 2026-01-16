import { SerialPort } from 'serialport';
import Store from 'electron-store';
import log from 'electron-log';

/**
 * Hardware Service
 * Unified service for barcode scanner, RFID reader, and weighing scale
 * Supports both real hardware and mock modes for testing
 */

// ============================================
// INTERFACES
// ============================================

/** Service response interface */
export interface HardwareServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/** Hardware mode */
export type HardwareMode = 'real' | 'mock';

/** Barcode settings */
export interface BarcodeSettings {
  enabled: boolean;
  port: string | null;
  baudRate: number;
  continuous: boolean;
}

/** RFID settings */
export interface RFIDSettings {
  enabled: boolean;
  port: string | null;
  baudRate: number;
  frequency: number; // MHz
  power: number; // dBm
  continuous: boolean;
}

/** Scale settings */
export interface ScaleSettings {
  enabled: boolean;
  port: string | null;
  baudRate: number;
  unit: 'g' | 'kg';
  precision: number; // decimal places
  tare: number; // tare weight
}

/** Hardware settings */
export interface HardwareSettings {
  mode: HardwareMode;
  barcode: BarcodeSettings;
  rfid: RFIDSettings;
  scale: ScaleSettings;
}

// ============================================
// HARDWARE SERVICE CLASS
// ============================================

export class HardwareService {
  // Electron store for settings persistence
  private static store = new Store<{ hardwareSettings: HardwareSettings }>({
    defaults: {
      hardwareSettings: {
        mode: 'mock', // Default to mock mode
        barcode: {
          enabled: true,
          port: null,
          baudRate: 9600,
          continuous: false,
        },
        rfid: {
          enabled: true,
          port: null,
          baudRate: 115200,
          frequency: 865.7,
          power: 30,
          continuous: false,
        },
        scale: {
          enabled: true,
          port: null,
          baudRate: 9600,
          unit: 'g',
          precision: 3,
          tare: 0,
        },
      },
    },
  });

  // Serial port instances
  private static barcodePort: SerialPort | null = null;
  private static rfidPort: SerialPort | null = null;
  private static scalePort: SerialPort | null = null;

  // Continuous scan handlers
  private static barcodeContinuousHandler: ((data: string) => void) | null = null;
  private static rfidContinuousHandler: ((data: string) => void) | null = null;
  private static scaleContinuousHandler: ((data: number) => void) | null = null;

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  /**
   * Get current hardware settings
   */
  static getSettings(): HardwareSettings {
    return this.store.get('hardwareSettings');
  }

  /**
   * Save hardware settings
   */
  static saveSettings(settings: Partial<HardwareSettings>): HardwareServiceResponse {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      this.store.set('hardwareSettings', updated);

      log.info('Hardware settings saved:', updated);

      return {
        success: true,
        message: 'Settings saved successfully',
        data: updated,
      };
    } catch (error: any) {
      log.error('Error saving hardware settings:', error);
      return {
        success: false,
        message: `Failed to save settings: ${error.message}`,
      };
    }
  }

  /**
   * Toggle hardware mode (real/mock)
   */
  static toggleMode(mode: HardwareMode): HardwareServiceResponse {
    try {
      // Stop all connections before switching
      this.disconnectAll();

      // Update settings
      const settings = this.getSettings();
      settings.mode = mode;
      this.store.set('hardwareSettings', settings);

      log.info(`Hardware mode switched to: ${mode}`);

      return {
        success: true,
        message: `Mode switched to ${mode}`,
        data: { mode },
      };
    } catch (error: any) {
      log.error('Error toggling hardware mode:', error);
      return {
        success: false,
        message: `Failed to switch mode: ${error.message}`,
      };
    }
  }

  /**
   * Disconnect all hardware
   */
  static disconnectAll(): void {
    this.stopBarcodeContinuous();
    this.stopRFIDContinuous();
    this.stopScaleContinuous();

    if (this.barcodePort?.isOpen) {
      this.barcodePort.close();
      this.barcodePort = null;
    }

    if (this.rfidPort?.isOpen) {
      this.rfidPort.close();
      this.rfidPort = null;
    }

    if (this.scalePort?.isOpen) {
      this.scalePort.close();
      this.scalePort = null;
    }

    log.info('All hardware disconnected');
  }

  // ============================================
  // BARCODE SCANNER
  // ============================================

  /**
   * Scan barcode (single scan)
   */
  static async scanBarcode(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      return this.mockBarcodeScan();
    }

    // Real mode
    try {
      if (!settings.barcode.enabled) {
        return {
          success: false,
          message: 'Barcode scanner is disabled',
        };
      }

      // Connect if not connected
      if (!this.barcodePort || !this.barcodePort.isOpen) {
        const connectResult = await this.connectBarcode();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Read barcode data
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Barcode scan timeout'));
        }, 10000); // 10 second timeout

        this.barcodePort!.once('data', (data: Buffer) => {
          clearTimeout(timeout);
          const barcode = this.parseBarcodeData(data);

          if (barcode) {
            log.info('Barcode scanned:', barcode);
            resolve({
              success: true,
              message: 'Barcode scanned successfully',
              data: { barcode },
            });
          } else {
            reject(new Error('Invalid barcode data'));
          }
        });
      });
    } catch (error: any) {
      log.error('Barcode scan error:', error);
      return {
        success: false,
        message: `Failed to scan barcode: ${error.message}`,
      };
    }
  }

  /**
   * Start continuous barcode scanning
   */
  static async startBarcodeContinuous(
    callback: (barcode: string) => void
  ): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      this.barcodeContinuousHandler = callback;
      this.startMockBarcodeContinuous(callback);
      return {
        success: true,
        message: 'Mock barcode continuous scan started',
      };
    }

    // Real mode
    try {
      if (!settings.barcode.enabled) {
        return {
          success: false,
          message: 'Barcode scanner is disabled',
        };
      }

      // Connect if not connected
      if (!this.barcodePort || !this.barcodePort.isOpen) {
        const connectResult = await this.connectBarcode();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Set up continuous scanning
      this.barcodeContinuousHandler = callback;
      this.barcodePort!.on('data', (data: Buffer) => {
        const barcode = this.parseBarcodeData(data);
        if (barcode && this.barcodeContinuousHandler) {
          log.info('Continuous barcode:', barcode);
          this.barcodeContinuousHandler(barcode);
        }
      });

      log.info('Barcode continuous scan started');

      return {
        success: true,
        message: 'Continuous scan started',
      };
    } catch (error: any) {
      log.error('Error starting barcode continuous scan:', error);
      return {
        success: false,
        message: `Failed to start continuous scan: ${error.message}`,
      };
    }
  }

  /**
   * Stop continuous barcode scanning
   */
  static stopBarcodeContinuous(): HardwareServiceResponse {
    this.barcodeContinuousHandler = null;

    if (this.barcodePort?.isOpen) {
      this.barcodePort.removeAllListeners('data');
    }

    log.info('Barcode continuous scan stopped');

    return {
      success: true,
      message: 'Continuous scan stopped',
    };
  }

  /**
   * Connect to barcode scanner
   */
  private static async connectBarcode(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    if (!settings.barcode.port) {
      // Try to auto-detect
      const ports = await SerialPort.list();
      const barcodePort = ports.find(
        (p) =>
          p.manufacturer?.toLowerCase().includes('scanner') ||
          p.manufacturer?.toLowerCase().includes('datalogic') ||
          p.manufacturer?.toLowerCase().includes('honeywell')
      );

      if (!barcodePort) {
        return {
          success: false,
          message: 'No barcode scanner found. Please configure port in settings.',
        };
      }

      settings.barcode.port = barcodePort.path;
    }

    try {
      this.barcodePort = new SerialPort({
        path: settings.barcode.port,
        baudRate: settings.barcode.baudRate,
      });

      return new Promise((resolve) => {
        this.barcodePort!.on('open', () => {
          log.info('Barcode scanner connected:', settings.barcode.port);
          resolve({
            success: true,
            message: 'Barcode scanner connected',
          });
        });

        this.barcodePort!.on('error', (error) => {
          log.error('Barcode connection error:', error);
          resolve({
            success: false,
            message: `Connection failed: ${error.message}`,
          });
        });
      });
    } catch (error: any) {
      log.error('Barcode connect error:', error);
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  /**
   * Parse barcode data from buffer
   */
  private static parseBarcodeData(data: Buffer): string | null {
    try {
      // Most barcode scanners send data as ASCII text followed by CR/LF
      const str = data.toString('utf8').trim();
      return str.length > 0 ? str : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mock barcode scan
   */
  private static mockBarcodeScan(): HardwareServiceResponse {
    // Generate random EAN-13 barcode
    const barcode = this.generateMockBarcode();

    log.info('Mock barcode scan:', barcode);

    return {
      success: true,
      message: 'Mock barcode scanned',
      data: { barcode },
    };
  }

  /**
   * Start mock continuous barcode scanning
   */
  private static startMockBarcodeContinuous(callback: (barcode: string) => void): void {
    // Simulate scanning every 3-5 seconds
    const interval = setInterval(() => {
      if (!this.barcodeContinuousHandler) {
        clearInterval(interval);
        return;
      }

      const barcode = this.generateMockBarcode();
      log.info('Mock continuous barcode:', barcode);
      callback(barcode);
    }, 3000 + Math.random() * 2000);
  }

  /**
   * Generate mock barcode (EAN-13 format)
   */
  private static generateMockBarcode(): string {
    // Generate 12 random digits
    let barcode = '';
    for (let i = 0; i < 12; i++) {
      barcode += Math.floor(Math.random() * 10);
    }

    // Calculate EAN-13 check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return barcode + checkDigit;
  }

  // ============================================
  // RFID READER
  // ============================================

  /**
   * Read RFID tag (single read)
   */
  static async readRFID(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      return this.mockRFIDRead();
    }

    // Real mode
    try {
      if (!settings.rfid.enabled) {
        return {
          success: false,
          message: 'RFID reader is disabled',
        };
      }

      // Connect if not connected
      if (!this.rfidPort || !this.rfidPort.isOpen) {
        const connectResult = await this.connectRFID();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Send inventory command (depends on RFID reader model)
      // This is a generic example - adjust for your specific RFID reader
      const inventoryCommand = Buffer.from([0x43, 0x01]); // Example command
      this.rfidPort!.write(inventoryCommand);

      // Read response
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('RFID read timeout'));
        }, 5000); // 5 second timeout

        this.rfidPort!.once('data', (data: Buffer) => {
          clearTimeout(timeout);
          const tag = this.parseRFIDData(data);

          if (tag) {
            log.info('RFID tag read:', tag);
            resolve({
              success: true,
              message: 'RFID tag read successfully',
              data: { tag, rssi: this.calculateMockRSSI() },
            });
          } else {
            reject(new Error('Invalid RFID data'));
          }
        });
      });
    } catch (error: any) {
      log.error('RFID read error:', error);
      return {
        success: false,
        message: `Failed to read RFID: ${error.message}`,
      };
    }
  }

  /**
   * Start continuous RFID reading
   */
  static async startRFIDContinuous(
    callback: (tag: string, rssi: number) => void
  ): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      this.rfidContinuousHandler = callback;
      this.startMockRFIDContinuous(callback);
      return {
        success: true,
        message: 'Mock RFID continuous read started',
      };
    }

    // Real mode
    try {
      if (!settings.rfid.enabled) {
        return {
          success: false,
          message: 'RFID reader is disabled',
        };
      }

      // Connect if not connected
      if (!this.rfidPort || !this.rfidPort.isOpen) {
        const connectResult = await this.connectRFID();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Set up continuous reading
      this.rfidContinuousHandler = callback;
      this.rfidPort!.on('data', (data: Buffer) => {
        const tag = this.parseRFIDData(data);
        if (tag && this.rfidContinuousHandler) {
          const rssi = this.calculateMockRSSI();
          log.info('Continuous RFID:', tag, 'RSSI:', rssi);
          this.rfidContinuousHandler(tag, rssi);
        }
      });

      // Start continuous inventory mode
      const startContinuousCommand = Buffer.from([0x43, 0x02]); // Example command
      this.rfidPort!.write(startContinuousCommand);

      log.info('RFID continuous read started');

      return {
        success: true,
        message: 'Continuous read started',
      };
    } catch (error: any) {
      log.error('Error starting RFID continuous read:', error);
      return {
        success: false,
        message: `Failed to start continuous read: ${error.message}`,
      };
    }
  }

  /**
   * Stop continuous RFID reading
   */
  static stopRFIDContinuous(): HardwareServiceResponse {
    this.rfidContinuousHandler = null;

    if (this.rfidPort?.isOpen) {
      // Stop continuous inventory mode
      const stopCommand = Buffer.from([0x43, 0x00]); // Example command
      this.rfidPort.write(stopCommand);
      this.rfidPort.removeAllListeners('data');
    }

    log.info('RFID continuous read stopped');

    return {
      success: true,
      message: 'Continuous read stopped',
    };
  }

  /**
   * Connect to RFID reader
   */
  private static async connectRFID(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    if (!settings.rfid.port) {
      // Try to auto-detect
      const ports = await SerialPort.list();
      const rfidPort = ports.find(
        (p) =>
          p.manufacturer?.toLowerCase().includes('rfid') ||
          p.manufacturer?.toLowerCase().includes('zebra') ||
          p.manufacturer?.toLowerCase().includes('impinj')
      );

      if (!rfidPort) {
        return {
          success: false,
          message: 'No RFID reader found. Please configure port in settings.',
        };
      }

      settings.rfid.port = rfidPort.path;
    }

    try {
      this.rfidPort = new SerialPort({
        path: settings.rfid.port,
        baudRate: settings.rfid.baudRate,
      });

      return new Promise((resolve) => {
        this.rfidPort!.on('open', () => {
          log.info('RFID reader connected:', settings.rfid.port);
          resolve({
            success: true,
            message: 'RFID reader connected',
          });
        });

        this.rfidPort!.on('error', (error) => {
          log.error('RFID connection error:', error);
          resolve({
            success: false,
            message: `Connection failed: ${error.message}`,
          });
        });
      });
    } catch (error: any) {
      log.error('RFID connect error:', error);
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  /**
   * Parse RFID data from buffer
   */
  private static parseRFIDData(data: Buffer): string | null {
    try {
      // Parse EPC data from response
      // Format depends on RFID reader model - this is a generic example
      if (data.length < 4) return null;

      const epcLength = data[1];
      if (data.length < 2 + epcLength) return null;

      const epc = data.slice(2, 2 + epcLength);
      return epc.toString('hex').toUpperCase();
    } catch (error) {
      return null;
    }
  }

  /**
   * Mock RFID read
   */
  private static mockRFIDRead(): HardwareServiceResponse {
    // Generate random EPC tag
    const tag = this.generateMockRFIDTag();
    const rssi = this.calculateMockRSSI();

    log.info('Mock RFID read:', tag, 'RSSI:', rssi);

    return {
      success: true,
      message: 'Mock RFID read',
      data: { tag, rssi },
    };
  }

  /**
   * Start mock continuous RFID reading
   */
  private static startMockRFIDContinuous(
    callback: (tag: string, rssi: number) => void
  ): void {
    // Simulate reading every 2-4 seconds
    const interval = setInterval(() => {
      if (!this.rfidContinuousHandler) {
        clearInterval(interval);
        return;
      }

      const tag = this.generateMockRFIDTag();
      const rssi = this.calculateMockRSSI();
      log.info('Mock continuous RFID:', tag, 'RSSI:', rssi);
      callback(tag, rssi);
    }, 2000 + Math.random() * 2000);
  }

  /**
   * Generate mock RFID tag (EPC format)
   */
  private static generateMockRFIDTag(): string {
    // EPC format: 24 hex characters (96 bits)
    let tag = 'E280'; // Header
    for (let i = 0; i < 20; i++) {
      tag += Math.floor(Math.random() * 16).toString(16).toUpperCase();
    }
    return tag;
  }

  /**
   * Calculate mock RSSI (signal strength)
   */
  private static calculateMockRSSI(): number {
    // Random RSSI between -40 dBm (strong) and -80 dBm (weak)
    return -40 - Math.floor(Math.random() * 40);
  }

  // ============================================
  // WEIGHING SCALE
  // ============================================

  /**
   * Read weight from scale (single read)
   */
  static async readScale(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      return this.mockScaleRead();
    }

    // Real mode
    try {
      if (!settings.scale.enabled) {
        return {
          success: false,
          message: 'Weighing scale is disabled',
        };
      }

      // Connect if not connected
      if (!this.scalePort || !this.scalePort.isOpen) {
        const connectResult = await this.connectScale();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Request weight reading
      // Command depends on scale model - this is a generic example
      this.scalePort!.write('R\r\n'); // Common command for many scales

      // Read response
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Scale read timeout'));
        }, 5000); // 5 second timeout

        this.scalePort!.once('data', (data: Buffer) => {
          clearTimeout(timeout);
          const result = this.parseScaleData(data);

          if (result) {
            const weight = result.weight - settings.scale.tare;
            log.info('Scale read:', weight, settings.scale.unit);
            resolve({
              success: true,
              message: 'Weight read successfully',
              data: {
                weight: parseFloat(weight.toFixed(settings.scale.precision)),
                unit: settings.scale.unit,
                stable: result.stable,
              },
            });
          } else {
            reject(new Error('Invalid scale data'));
          }
        });
      });
    } catch (error: any) {
      log.error('Scale read error:', error);
      return {
        success: false,
        message: `Failed to read weight: ${error.message}`,
      };
    }
  }

  /**
   * Tare the scale (zero)
   */
  static async tareScale(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      settings.scale.tare = Math.random() * 0.5; // Mock tare
      this.saveSettings({ scale: settings.scale });
      return {
        success: true,
        message: 'Mock scale tared',
        data: { tare: settings.scale.tare },
      };
    }

    // Real mode
    try {
      if (!settings.scale.enabled) {
        return {
          success: false,
          message: 'Weighing scale is disabled',
        };
      }

      // Connect if not connected
      if (!this.scalePort || !this.scalePort.isOpen) {
        const connectResult = await this.connectScale();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Send tare command
      this.scalePort!.write('T\r\n'); // Common tare command

      // Read current weight and save as tare
      const readResult = await this.readScale();
      if (readResult.success) {
        settings.scale.tare = readResult.data.weight;
        this.saveSettings({ scale: settings.scale });
      }

      log.info('Scale tared:', settings.scale.tare);

      return {
        success: true,
        message: 'Scale tared successfully',
        data: { tare: settings.scale.tare },
      };
    } catch (error: any) {
      log.error('Scale tare error:', error);
      return {
        success: false,
        message: `Failed to tare scale: ${error.message}`,
      };
    }
  }

  /**
   * Start continuous scale reading
   */
  static async startScaleContinuous(
    callback: (weight: number, stable: boolean) => void
  ): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    // Mock mode
    if (settings.mode === 'mock') {
      this.scaleContinuousHandler = callback;
      this.startMockScaleContinuous(callback);
      return {
        success: true,
        message: 'Mock scale continuous read started',
      };
    }

    // Real mode
    try {
      if (!settings.scale.enabled) {
        return {
          success: false,
          message: 'Weighing scale is disabled',
        };
      }

      // Connect if not connected
      if (!this.scalePort || !this.scalePort.isOpen) {
        const connectResult = await this.connectScale();
        if (!connectResult.success) {
          return connectResult;
        }
      }

      // Set up continuous reading
      this.scaleContinuousHandler = callback;
      this.scalePort!.on('data', (data: Buffer) => {
        const result = this.parseScaleData(data);
        if (result && this.scaleContinuousHandler) {
          const weight = parseFloat(
            (result.weight - settings.scale.tare).toFixed(settings.scale.precision)
          );
          log.info('Continuous scale:', weight, settings.scale.unit, 'Stable:', result.stable);
          this.scaleContinuousHandler(weight, result.stable);
        }
      });

      // Start continuous mode
      this.scalePort!.write('C\r\n'); // Common continuous command

      log.info('Scale continuous read started');

      return {
        success: true,
        message: 'Continuous read started',
      };
    } catch (error: any) {
      log.error('Error starting scale continuous read:', error);
      return {
        success: false,
        message: `Failed to start continuous read: ${error.message}`,
      };
    }
  }

  /**
   * Stop continuous scale reading
   */
  static stopScaleContinuous(): HardwareServiceResponse {
    this.scaleContinuousHandler = null;

    if (this.scalePort?.isOpen) {
      // Stop continuous mode
      this.scalePort.write('S\r\n'); // Common stop command
      this.scalePort.removeAllListeners('data');
    }

    log.info('Scale continuous read stopped');

    return {
      success: true,
      message: 'Continuous read stopped',
    };
  }

  /**
   * Connect to weighing scale
   */
  private static async connectScale(): Promise<HardwareServiceResponse> {
    const settings = this.getSettings();

    if (!settings.scale.port) {
      // Try to auto-detect
      const ports = await SerialPort.list();
      const scalePort = ports.find(
        (p) =>
          p.manufacturer?.toLowerCase().includes('scale') ||
          p.manufacturer?.toLowerCase().includes('iscale') ||
          p.manufacturer?.toLowerCase().includes('mettler')
      );

      if (!scalePort) {
        return {
          success: false,
          message: 'No weighing scale found. Please configure port in settings.',
        };
      }

      settings.scale.port = scalePort.path;
    }

    try {
      this.scalePort = new SerialPort({
        path: settings.scale.port,
        baudRate: settings.scale.baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
      });

      return new Promise((resolve) => {
        this.scalePort!.on('open', () => {
          log.info('Weighing scale connected:', settings.scale.port);
          resolve({
            success: true,
            message: 'Weighing scale connected',
          });
        });

        this.scalePort!.on('error', (error) => {
          log.error('Scale connection error:', error);
          resolve({
            success: false,
            message: `Connection failed: ${error.message}`,
          });
        });
      });
    } catch (error: any) {
      log.error('Scale connect error:', error);
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  /**
   * Parse scale data from buffer
   */
  private static parseScaleData(data: Buffer): { weight: number; stable: boolean } | null {
    try {
      // Parse weight data
      // Format depends on scale model - common formats:
      // - "W+00123.456g\r\n" (iScale and others)
      // - "ST,GS,+00123.456,g\r\n" (Mettler Toledo)
      // - "=   123.456 g\r\n" (Generic)

      const str = data.toString('utf8').trim();

      // Try iScale format
      let match = str.match(/W([+-])(\d+\.\d+)g/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const weight = parseFloat(match[2]) * sign;
        const stable = !str.includes('?'); // '?' often indicates unstable
        return { weight, stable };
      }

      // Try Mettler Toledo format
      match = str.match(/ST,GS,([+-]\d+\.\d+),g/);
      if (match) {
        const weight = parseFloat(match[1]);
        const stable = str.startsWith('ST'); // ST = stable, US = unstable
        return { weight, stable };
      }

      // Try generic format
      match = str.match(/=\s+(\d+\.\d+)\s+g/);
      if (match) {
        const weight = parseFloat(match[1]);
        const stable = !str.includes('*'); // '*' often indicates unstable
        return { weight, stable };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Mock scale read
   */
  private static mockScaleRead(): HardwareServiceResponse {
    const settings = this.getSettings();

    // Generate random weight between 1.0 and 50.0 grams
    const weight = parseFloat((1.0 + Math.random() * 49.0).toFixed(settings.scale.precision));
    const stable = Math.random() > 0.2; // 80% chance of stable reading

    log.info('Mock scale read:', weight, settings.scale.unit);

    return {
      success: true,
      message: 'Mock weight read',
      data: {
        weight,
        unit: settings.scale.unit,
        stable,
      },
    };
  }

  /**
   * Start mock continuous scale reading
   */
  private static startMockScaleContinuous(
    callback: (weight: number, stable: boolean) => void
  ): void {
    const settings = this.getSettings();

    // Simulate reading every 0.5-1 second
    const interval = setInterval(() => {
      if (!this.scaleContinuousHandler) {
        clearInterval(interval);
        return;
      }

      const weight = parseFloat((1.0 + Math.random() * 49.0).toFixed(settings.scale.precision));
      const stable = Math.random() > 0.2; // 80% chance of stable

      log.info('Mock continuous scale:', weight, settings.scale.unit, 'Stable:', stable);
      callback(weight, stable);
    }, 500 + Math.random() * 500);
  }
}

log.info('Hardware service initialized');
