import { app, BrowserWindow, Tray, Menu } from 'electron';
import type { Event } from 'electron';
import path from 'path';
import log from 'electron-log';
import { initializeDatabase } from './database/connection';
import postgresService from './services/postgresService';
import { setupMonitoringHandlers } from './ipc/monitoringHandlers';

// Extend the app interface to include isQuitting property
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

/**
 * Declare webpack entry points provided by Electron Forge
 */
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

/**
 * Main Electron Process
 * - Initializes database connection
 * - Sets up IPC handlers
 * - Creates application window
 */

let mainWindow: BrowserWindow | null = null;
let tray: any = null;

/**
 * Create the main application window
 */
const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    title: 'Jewellery ERP System',
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false, // Don't show until ready
  });

  mainWindow = window;

  // Load the app using webpack entry point
  window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open DevTools in development
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    window.webContents.openDevTools();
  }

   // Show window when ready
   window.once('ready-to-show', () => {
     window.show();
     log.info('✓ Application window loaded successfully');
   });

  // Handle window closed
  window.on('closed', () => {
    mainWindow = null;
  });

  // Handle window minimize/close to tray
  window.on('minimize', (event: any) => {
    event.preventDefault();
    window.hide();
  });

  window.on('close', (event: any) => {
    if (!app.isQuitting) {
      event.preventDefault();
      window.hide();
      return false;
    }
  });
};

/**
 * Create the system tray
 */
const createTray = (): void => {
  try {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    log.info('⚙  Loading tray icon from:', iconPath);

    if (!require('fs').existsSync(iconPath)) {
      log.warn('⚠️ Tray icon not found at path:', iconPath);
      // Try alternative path for development
      const altPath = path.join(process.cwd(), 'assets/icon.png');
      log.info('⚙  Trying alternative path:', altPath);
      if (require('fs').existsSync(altPath)) {
        tray = new Tray(altPath);
      } else {
        log.error('✗ Could not find tray icon anywhere');
        return;
      }
    } else {
      tray = new Tray(iconPath);
    }

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        }
      },
      {
        label: 'Hide App',
        click: () => {
          if (mainWindow) {
            mainWindow.hide();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        }
      }
    ]);

     tray.setToolTip('Jewellery ERP System');
     tray.setContextMenu(contextMenu);

     log.info('✓ System tray created successfully');
  } catch (error) {
    console.error('✗ Failed to create system tray:', error);
  }
};

/**
 * Validate license before starting application
 */
const validateLicense = async (): Promise<boolean> => {
  try {
    log.info('🔐 Validating license...');

    // Dynamically import licenseService after models are initialized
    const licenseService = (await import('./services/licenseService')).default;
    const result = await licenseService.validateLicense();

    if (result.valid) {
      log.info('✓ License is valid');

      if (result.warningMessage) {
        log.warn('⚠️', result.warningMessage);
      }

      return true;
    } else {
      log.warn('✗ License validation failed:', result.error);
      return false;
    }
  } catch (error: any) {
    log.error('✗ License validation error:', error);
    return false;
  }
};

/**
 * Initialize the application
 */
const initializeApp = async (): Promise<void> => {
  try {
    log.info('🚀 Starting Jewellery ERP System...');

    // Initialize PostgreSQL service first
    log.info('⚙  Starting PostgreSQL...');
    await postgresService.init();
    log.info('✓ PostgreSQL started successfully');

    // Initialize database
    log.info('⚙  Initializing database...');
    await initializeDatabase();

    // Dynamically import models after database is initialized
    const { initializeModels } = await import('./database/models');
    await initializeModels();

    // Dynamically import and setup IPC handlers (needed for license activation UI)
    const { setupAllHandlers } = await import('./ipc');
    setupAllHandlers();

    // Setup monitoring handlers
    setupMonitoringHandlers();

    // Validate license
    const licenseValid = await validateLicense();

    // Create application window
    log.info('⚙  Creating main window...');
    await createWindow();
    log.info('✓ Main window function called');

    // Create system tray
    log.info('⚙  Initializing system tray...');
    createTray();

    // Initialize auto-updater (only in production mode)
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (!isDev && mainWindow && licenseValid) {
      log.info('⚙  Initializing auto-updater...');
      const updateService = (await import('./services/updateService')).default;
      await updateService.init(mainWindow);
      log.info('✓ Auto-updater initialized');
    }

    // If license is not valid, the app will show the activation page
    // This is handled in the React router (App.tsx)
    if (!licenseValid) {
      log.info('⚠️ Application started in activation mode (no valid license)');
    } else {
      log.info('✓ Application started successfully');
    }
  } catch (error: any) {
    log.error('✗ Failed to initialize application:', error);
    app.quit();
  }
};

/**
 * App event handlers
 */

// When Electron has finished initialization
app.whenReady().then(initializeApp);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle before quit
app.on('before-quit', async (event: Event) => {
  log.info('⚙  Shutting down application...');

  // Prevent default to allow graceful shutdown
  event.preventDefault();

  try {
    // Cleanup update service
    const updateService = (await import('./services/updateService')).default;
    updateService.cleanup();

    // Close database connections
    const { closeDatabaseConnection } = await import('./database/connection');
    await closeDatabaseConnection();
    log.info('✓ Database connections closed');

    // Stop PostgreSQL service
    log.info('⚙  Stopping PostgreSQL...');
    await postgresService.stop();
    log.info('✓ PostgreSQL stopped');

    log.info('✓ Application shutdown complete');
  } catch (error) {
    log.error('✗ Error during shutdown:', error);
  } finally {
    // Force exit after cleanup
    app.exit(0);
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus on the main window if someone tries to open another instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
