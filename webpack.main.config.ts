import type { Configuration } from 'webpack';
import webpack from 'webpack';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

/**
 * Webpack Configuration for Electron Main Process
 */
export const mainConfig: Configuration = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/main/index.ts',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'main.js',
  },
  devtool: 'source-map',
  externalsPresets: { node: true, electron: true },
  externals: {
    electron: 'commonjs2 electron',
    sequelize: 'commonjs2 sequelize',
    pg: 'commonjs2 pg',
    'pg-hstore': 'commonjs2 pg-hstore',
    sqlite3: 'commonjs2 sqlite3',
    tedious: 'commonjs2 tedious',
    'pg-native': 'commonjs2 pg-native',
    usb: 'commonjs2 usb',
    'node-hid': 'commonjs2 node-hid',
    serialport: 'commonjs2 serialport',
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
    new webpack.DefinePlugin({
      MAIN_WINDOW_WEBPACK_ENTRY: JSON.stringify(process.env.NODE_ENV === 'production'
        ? `file://${path.resolve(__dirname, '.webpack/renderer/main_window/index.html')}`
        : 'http://localhost:5173'),
      MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: JSON.stringify(process.env.NODE_ENV === 'production'
        ? path.resolve(__dirname, '.webpack/renderer/main_window/preload.js')
        : path.resolve(__dirname, '.webpack/renderer/main_window/preload.js')), // Adjust this based on where preload is built
    }),
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
