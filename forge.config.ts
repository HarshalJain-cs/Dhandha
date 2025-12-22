import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

/**
 * Electron Forge Configuration
 */
const config: ForgeConfig = {
  packagerConfig: {
    name: 'Jewellery ERP',
    executableName: 'jewellery-erp',
    icon: './assets/icon',
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'JewelleryERP',
      setupIcon: './assets/icon.ico',
    }),
    new MakerZIP({}, ['darwin', 'linux']),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/index.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
