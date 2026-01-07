import { Sequelize } from 'sequelize';
import postgresService from '../services/postgresService';
import log from 'electron-log';

const isDev = process.env.NODE_ENV !== 'production';

// Sequelize instance - will be initialized with PostgreSQL connection
export let sequelize: Sequelize;

/**
 * Check if database tables exist (PostgreSQL)
 */
const checkTablesExist = async (): Promise<boolean> => {
  try {
    const [results] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    return Array.isArray(results) && results.length > 0;
  } catch (error) {
    log.error('Error checking if tables exist:', error);
    return false;
  }
};

/**
 * Run database migrations
 */
const runMigrations = async (): Promise<void> => {
  try {
    log.info('Running database migrations...');
    // Import and run migrations using Umzug
    const { runMigrations: executeMigrations } = await import('../../scripts/run-migrations');
    await executeMigrations();
    log.info('✓ Database migrations completed successfully');
  } catch (error) {
    log.error('✗ Database migration failed:', error);
    throw error;
  }
};

/**
 * Initialize database connection
 * - Connects to PostgreSQL via postgresService
 * - Tests connection
 * - Runs migrations if needed
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Get PostgreSQL connection string from service
    const connectionString = postgresService.getConnectionString();

    log.info('Initializing database connection...');

    // Create Sequelize instance with PostgreSQL
    sequelize = new Sequelize(connectionString, {
      dialect: 'postgres',
      logging: isDev ? (msg) => log.info(msg) : false,
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

    // Test connection
    await sequelize.authenticate();
    log.info('✓ Database connection established successfully');

    const config = postgresService.getConnectionConfig();
    log.info(`  Database: ${config.database}`);
    log.info(`  Host: ${config.host}:${config.port}`);

    // Check if tables exist
    const tablesExist = await checkTablesExist();

    if (!tablesExist) {
      log.info('⚙  No existing tables found. Running migrations...');
      await runMigrations();
    } else {
      log.info('✓ Database schema already exists');
    }

  } catch (error: any) {
    log.error('✗ Database connection failed:', error.message);
    log.error('  Make sure PostgreSQL service is running');
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
