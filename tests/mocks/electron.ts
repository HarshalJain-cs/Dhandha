/**
 * Electron Mock
 * Mocks Electron APIs for testing
 */

export const app = {
  getVersion: jest.fn(() => '1.0.0'),
  getPath: jest.fn((name: string) => `/mock/path/${name}`),
  whenReady: jest.fn(() => Promise.resolve()),
  quit: jest.fn(),
  on: jest.fn(),
};

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  removeHandler: jest.fn(),
};

export const ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  send: jest.fn(),
  removeAllListeners: jest.fn(),
};

export const BrowserWindow = jest.fn(() => ({
  loadURL: jest.fn(),
  webContents: {
    send: jest.fn(),
    openDevTools: jest.fn(),
  },
  on: jest.fn(),
  show: jest.fn(),
  isDestroyed: jest.fn(() => false),
}));

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};
