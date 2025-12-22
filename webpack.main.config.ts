import type { Configuration } from 'webpack';
import path from 'path';

/**
 * Webpack Configuration for Electron Main Process
 */
export const mainConfig: Configuration = {
  entry: './src/main/index.ts',
  target: 'electron-main',
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
    alias: {
      '@main': path.resolve(__dirname, './src/main'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'index.js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
