import { Sequelize } from 'sequelize';
import postgresService from '../services/postgresService';
import log from 'electron-log';
import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';

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

    // Create Umzug instance
    // In webpack bundle, migrations are copied to .webpack/main/database/migrations
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const migrationsPath = path.join(migrationsDir, '*.js').replace(/\\/g, '/');
    log.info(`Looking for migrations in: ${migrationsPath}`);

    const umzug = new Umzug({
      migrations: {
        glob: migrationsPath,
        resolve: ({ name, path: migrationPath }) => {
          // Load migration from disk using require
          if (!migrationPath) {
            throw new Error(`Migration path is undefined for migration: ${name}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const migration = require(migrationPath);
          return {
            name,
            up: async (params) => migration.up(params.context, params.context.sequelize.Sequelize),
            down: async (params) => migration.down(params.context, params.context.sequelize.Sequelize),
          };
        },
      },
      context: sequelize!.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: sequelize! }),
      logger: {
        info: (message) => log.info(message),
        warn: (message) => log.warn(message),
        error: (message) => log.error(message),
        debug: (message) => log.debug(message),
      },
    });

    // Check for pending migrations
    const pending = await umzug.pending();

    if (pending.length === 0) {
      log.info('No pending migrations');
      return;
    }

    log.info(`Found ${pending.length} pending migrations`);
    pending.forEach((migration) => {
      log.info(`  - ${migration.name}`);
    });

    // Run migrations
    await umzug.up();
    log.info('✓ All migrations completed successfully');
  } catch (error) {
    log.error('✗ Database migration failed:', error);
    throw error;
  }
};

/**
 * Initialize database connection
 * - Connects to PostgreSQL via postgresService
 * - Creates database if it doesn't exist
 * - Tests connection
 * - Runs migrations if needed
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const config = postgresService.getConnectionConfig();
    log.info('Initializing database connection...');

    // First, connect to the default 'postgres' database to check/create our database
    const defaultConnectionString = `postgres://postgres:${config.password}@${config.host}:${config.port}/postgres`;
    const defaultSequelize = new Sequelize(defaultConnectionString, {
      dialect: 'postgres',
      logging: false,
    });

    try {
      await defaultSequelize.authenticate();
      log.info('✓ Connected to PostgreSQL server');

      // Check if our database exists
      const [results] = await defaultSequelize.query(
        `SELECT 1 FROM pg_database WHERE datname = '${config.database}'`
      );

      if (!Array.isArray(results) || results.length === 0) {
        log.info(`⚙  Creating database: ${config.database}`);
        await defaultSequelize.query(`CREATE DATABASE ${config.database}`);
        log.info(`✓ Database ${config.database} created successfully`);
      } else {
        log.info(`✓ Database ${config.database} already exists`);
      }

      await defaultSequelize.close();
    } catch (error: any) {
      log.error('✗ Failed to connect to PostgreSQL server:', error.message);
      throw error;
    }

    // Now connect to our application database
    const connectionString = postgresService.getConnectionString();
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

    await sequelize.authenticate();
    log.info('✓ Database connection established successfully');
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
    if (sequelize) {
      await sequelize.close();
      console.log('✓ Database connection closed');
    } else {
      console.log('⚠️ Database connection not initialized, skipping close');
    }
  } catch (error: any) {
    console.error('✗ Error closing database connection:', error.message);
  }
};

// Export a getter function for sequelize to handle uninitialized state
export default { get sequelize() { return sequelize; } };
