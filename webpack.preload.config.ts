import type { Configuration } from 'webpack';
import path from 'path';

/**
 * Webpack Configuration for Electron Preload Script
 */
export const preloadConfig: Configuration = {
  entry: './src/preload/index.ts',
  target: 'electron-preload',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};

export default preloadConfig;
