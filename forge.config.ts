import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

/**
 * Electron Forge Configuration
 */
const config: ForgeConfig = {
  packagerConfig: {
    name: 'Jewellery ERP',
    executableName: 'jewellery-erp',
    asar: true,
    extraResource: [
      {
        from: 'postgres',
        to: 'postgres',
        filter: ['**/*'],
      },
    ],
  },
  rebuildConfig: {
    onlyModules: ['sqlite3', 'usb', 'node-hid', 'serialport'],
    force: true,
  },
  makers: [
    new MakerSquirrel({
      name: 'JewelleryERP',
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
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'HarshalJain-cs',
        name: 'Dhandha',
      },
      prerelease: false,
      draft: true, // Create draft first for review
    }),
  ],
};

export default config;
