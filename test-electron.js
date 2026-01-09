const { app, BrowserWindow } = require('electron');

console.log('app type:', typeof app);
console.log('app value:', app);
console.log('BrowserWindow type:', typeof BrowserWindow);

if (app) {
  console.log('✓ Electron app is available!');
  app.whenReady().then(() => {
    console.log('✓ Electron is ready!');
    app.quit();
  });
} else {
  console.error('✗ Electron app is NOT available!');
  process.exit(1);
}
