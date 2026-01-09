import type { Configuration } from 'webpack';
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
