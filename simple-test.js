// Simple test without webpack
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

console.log('electron:', typeof electron);
console.log('app:', typeof app);
console.log('BrowserWindow:', typeof BrowserWindow);

if (app) {
  console.log('✓ Electron app is available!');
  app.whenReady().then(() => {
    console.log('✓ Electron is ready!');

    const win = new BrowserWindow({
      width: 800,
      height: 600,
    });

    win.loadURL('https://www.google.com');

    setTimeout(() => {
      console.log('✓ Quitting');
      app.quit();
    }, 3000);
  });
} else {
  console.error('✗ Electron app is NOT available!');
  process.exit(1);
}
