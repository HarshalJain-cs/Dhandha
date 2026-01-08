import type { Configuration } from 'webpack';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

/**
 * Webpack Configuration for Electron Main Process
 */
export const mainConfig: Configuration = {
  entry: './src/main/index.ts',
  target: 'electron-main',
  externals: {
    electron: 'commonjs electron',
    sequelize: 'commonjs sequelize',
    pg: 'commonjs pg',
    'pg-hstore': 'commonjs pg-hstore',
    sqlite3: 'commonjs sqlite3',
    tedious: 'commonjs tedious',
    'pg-native': 'commonjs pg-native',
    usb: 'commonjs usb',
    'node-hid': 'commonjs node-hid',
    serialport: 'commonjs serialport',
  },
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
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'database/migrations'),
          to: path.resolve(__dirname, '.webpack/main/database/migrations'),
        },
      ],
    }),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
};

export default mainConfig;
