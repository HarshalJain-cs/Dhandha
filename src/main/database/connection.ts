import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

// Database configuration
const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jewellery_erp',
    username: process.env.DB_USER || 'erp_admin',
    password: process.env.DB_PASSWORD || 'jewellery2024',
    dialect: 'postgres' as const,
    logging: console.log,
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jewellery_erp',
    username: process.env.DB_USER || 'erp_admin',
    password: process.env.DB_PASSWORD || 'jewellery2024',
    dialect: 'postgres' as const,
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
    console.log(`  Database: ${config.database}`);
    console.log(`  Host: ${config.host}:${config.port}`);

    // Read and execute schema.sql if this is first run
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');

    // Check if tables exist
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `);

    const tablesExist = (results[0] as any).count > 0;

    if (!tablesExist && fs.existsSync(schemaPath)) {
      console.log('⚙  Running database schema...');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Split schema into individual statements and execute
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        try {
          await sequelize.query(statement);
        } catch (error: any) {
          // Ignore already exists errors
          if (!error.message?.includes('already exists')) {
            console.warn(`  Warning: ${error.message}`);
          }
        }
      }

      console.log('✓ Database schema created successfully');
    } else {
      console.log('✓ Database schema already exists');
    }

    // Sync models (only in development)
    if (isDev) {
      await sequelize.sync({ alter: false }); // Don't alter, use migrations
      console.log('✓ Database models synced');
    }

  } catch (error: any) {
    console.error('✗ Database connection failed:', error.message);
    console.error('  Make sure PostgreSQL is running and credentials are correct');
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
