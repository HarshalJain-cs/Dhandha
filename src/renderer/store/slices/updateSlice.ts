import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Update Info Interface
 */
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  files?: any[];
}

/**
 * Update Progress Interface
 */
export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

/**
 * Update Settings Interface
 */
export interface UpdateSettings {
  autoDownload: boolean;
  autoInstallOnQuit: boolean;
  allowPrerelease: boolean;
  checkInterval: number; // Hours
}

/**
 * Update State Interface
 */
export interface UpdateState {
  checking: boolean;
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  downloadProgress: UpdateProgress | null;
  downloaded: boolean;
  error: string | null;
  settings: UpdateSettings;
  lastChecked: Date | null;
}

/**
 * Initial State
 */
const initialState: UpdateState = {
  checking: false,
  updateAvailable: false,
  updateInfo: null,
  downloading: false,
  downloadProgress: null,
  downloaded: false,
  error: null,
  settings: {
    autoDownload: true,
    autoInstallOnQuit: true,
    allowPrerelease: false,
    checkInterval: 24,
  },
  lastChecked: null,
};

/**
 * Update Slice
 */
const updateSlice = createSlice({
  name: 'update',
  initialState,
  reducers: {
    // Checking for updates
    setChecking: (state, action: PayloadAction<boolean>) => {
      state.checking = action.payload;
      if (action.payload) {
        state.error = null;
        state.lastChecked = new Date();
      }
    },

    // Update available
    setUpdateAvailable: (state, action: PayloadAction<UpdateInfo>) => {
      state.checking = false;
      state.updateAvailable = true;
      state.updateInfo = action.payload;
      state.error = null;
    },

    // Update not available
    setUpdateNotAvailable: (state) => {
      state.checking = false;
      state.updateAvailable = false;
      state.updateInfo = null;
      state.error = null;
    },

    // Downloading update
    setDownloading: (state, action: PayloadAction<boolean>) => {
      state.downloading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // Download progress
    setDownloadProgress: (state, action: PayloadAction<UpdateProgress>) => {
      state.downloadProgress = action.payload;
    },

    // Update downloaded
    setDownloaded: (state, action: PayloadAction<UpdateInfo>) => {
      state.downloading = false;
      state.downloaded = true;
      state.updateInfo = action.payload;
      state.downloadProgress = null;
      state.error = null;
    },

    // Error
    setError: (state, action: PayloadAction<string>) => {
      state.checking = false;
      state.downloading = false;
      state.error = action.payload;
    },

    // Update settings
    setSettings: (state, action: PayloadAction<Partial<UpdateSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // Reset update state (after install or dismiss)
    resetUpdate: (state) => {
      state.checking = false;
      state.updateAvailable = false;
      state.updateInfo = null;
      state.downloading = false;
      state.downloadProgress = null;
      state.downloaded = false;
      state.error = null;
    },

    // Set last checked timestamp
    setLastChecked: (state, action: PayloadAction<Date>) => {
      state.lastChecked = action.payload;
    },
  },
});

// Export actions
export const {
  setChecking,
  setUpdateAvailable,
  setUpdateNotAvailable,
  setDownloading,
  setDownloadProgress,
  setDownloaded,
  setError,
  setSettings,
  resetUpdate,
  setLastChecked,
} = updateSlice.actions;

// Export reducer
export default updateSlice.reducer;
