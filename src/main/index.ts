import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initializeDatabase } from './database/connection';
import postgresService from './services/postgresService';

/**
 * Main Electron Process
 * - Initializes database connection
 * - Sets up IPC handlers
 * - Creates application window
 */

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../../dist/preload/index.js'),
    },
    title: 'Jewellery ERP System',
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false, // Don't show until ready
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Load from Vite dev server in development
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load from built files in production
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('✓ Application window loaded successfully');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

/**
 * Validate license before starting application
 */
const validateLicense = async (): Promise<boolean> => {
  try {
    console.log('🔐 Validating license...');

    // Dynamically import licenseService after models are initialized
    const licenseService = (await import('./services/licenseService')).default;
    const result = await licenseService.validateLicense();

    if (result.valid) {
      console.log('✓ License is valid');

      if (result.warningMessage) {
        console.warn('⚠️', result.warningMessage);
      }

      return true;
    } else {
      console.warn('✗ License validation failed:', result.error);
      return false;
    }
  } catch (error: any) {
    console.error('✗ License validation error:', error);
    return false;
  }
};

/**
 * Initialize the application
 */
const initializeApp = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Jewellery ERP System...');

    // Initialize PostgreSQL service first
    console.log('⚙  Starting PostgreSQL...');
    await postgresService.init();
    console.log('✓ PostgreSQL started successfully');

    // Initialize database
    console.log('⚙  Initializing database...');
    await initializeDatabase();

    // Dynamically import models after database is initialized
    const { initializeModels } = await import('./database/models');
    await initializeModels();

    // Dynamically import and setup IPC handlers (needed for license activation UI)
    const { setupAllHandlers } = await import('./ipc');
    setupAllHandlers();

    // Validate license
    const licenseValid = await validateLicense();

    // Create application window
    await createWindow();

    // Initialize auto-updater (only in production mode)
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (!isDev && mainWindow && licenseValid) {
      console.log('⚙  Initializing auto-updater...');
      const updateService = (await import('./services/updateService')).default;
      await updateService.init(mainWindow);
      console.log('✓ Auto-updater initialized');
    }

    // If license is not valid, the app will show the activation page
    // This is handled in the React router (App.tsx)
    if (!licenseValid) {
      console.log('⚠️ Application started in activation mode (no valid license)');
    } else {
      console.log('✓ Application started successfully');
    }
  } catch (error: any) {
    console.error('✗ Failed to initialize application:', error);
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
app.on('before-quit', async (event) => {
  console.log('⚙  Shutting down application...');

  // Prevent default to allow graceful shutdown
  event.preventDefault();

  try {
    // Cleanup update service
    const updateService = (await import('./services/updateService')).default;
    updateService.cleanup();

    // Close database connections
    const { closeDatabaseConnection } = await import('./database/connection');
    await closeDatabaseConnection();
    console.log('✓ Database connections closed');

    // Stop PostgreSQL service
    console.log('⚙  Stopping PostgreSQL...');
    await postgresService.stop();
    console.log('✓ PostgreSQL stopped');

    console.log('✓ Application shutdown complete');
  } catch (error) {
    console.error('✗ Error during shutdown:', error);
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
