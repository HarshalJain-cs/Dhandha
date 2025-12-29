import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

// Get app data directory for SQLite database
const getAppDataPath = () => {
  const { app } = require('electron');
  return isDev
    ? path.join(__dirname, '../../..') // Project root in development
    : app.getPath('userData'); // User data directory in production
};

// Database configuration
const dbConfig = {
  development: {
    dialect: 'sqlite' as const,
    storage: path.join(getAppDataPath(), 'jewellery_erp.db'),
    logging: console.log,
  },
  production: {
    dialect: process.env.DB_DIALECT === 'postgres' ? ('postgres' as const) : ('sqlite' as const),
    // SQLite configuration
    storage: path.join(getAppDataPath(), 'jewellery_erp.db'),
    // PostgreSQL configuration (used only if DB_DIALECT=postgres)
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jewellery_erp',
    username: process.env.DB_USER || 'erp_admin',
    password: process.env.DB_PASSWORD || 'jewellery2024',
    logging: false,
  },
};

const config = isDev ? dbConfig.development : dbConfig.production;

// Create Sequelize instance
export const sequelize = new Sequelize({
  ...config,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

/**
 * Initialize database connection
 * - Tests connection
 * - Runs schema if needed
 * - Syncs models in development
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    if (config.dialect === 'sqlite') {
      console.log(`  Storage: ${config.storage}`);
    } else {
      console.log(`  Database: ${config.database}`);
      console.log(`  Host: ${config.host}:${config.port}`);
    }

    // Check if tables exist (SQLite-compatible query)
    const [results] = await sequelize.query(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='users'
    `);

    const tablesExist = Array.isArray(results) && results.length > 0;

    if (!tablesExist) {
      console.log('⚙  No existing tables found. Database will be synced from models...');
    } else {
      console.log('✓ Database schema already exists');
    }

    // Sync models in development, create tables if they don't exist
    if (isDev || !tablesExist) {
      await sequelize.sync({ alter: isDev }); // Alter in dev, create if tables don't exist
      console.log('✓ Database models synced');
    }

  } catch (error: any) {
    console.error('✗ Database connection failed:', error.message);
    if (!isDev && config.dialect === 'postgres') {
      console.error('  Make sure PostgreSQL is running and credentials are correct');
    }
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed');
  } catch (error: any) {
    console.error('✗ Error closing database connection:', error.message);
  }
};

// Export sequelize instance as default
export default sequelize;
