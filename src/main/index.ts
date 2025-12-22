import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initializeDatabase } from './database/connection';
import { initializeModels } from './database/models';
import { setupAllHandlers } from './ipc';

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
      preload: path.join(__dirname, '../preload/index.js'),
    },
    title: 'Jewellery ERP System',
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false, // Don't show until ready
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
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
 * Initialize the application
 */
const initializeApp = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Jewellery ERP System...');

    // Initialize database
    console.log('⚙  Initializing database...');
    await initializeDatabase();
    await initializeModels();

    // Setup IPC handlers
    setupAllHandlers();

    // Create application window
    await createWindow();

    console.log('✓ Application started successfully');
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
app.on('before-quit', async () => {
  console.log('⚙  Shutting down application...');
  // Close database connections and cleanup
  const { closeDatabaseConnection } = await import('./database/connection');
  await closeDatabaseConnection();
  console.log('✓ Application shutdown complete');
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
