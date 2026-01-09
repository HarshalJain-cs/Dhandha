const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Connecting to PostgreSQL...');

    // Connect to PostgreSQL
    const sequelize = new Sequelize('postgres://postgres:@localhost:54320/jewellery_erp', {
      dialect: 'postgres',
      logging: console.log,
    });

    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Create Umzug instance
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    const migrationsPath = path.join(migrationsDir, '*.js');
    console.log(`Looking for migrations in: ${migrationsPath}\n`);

    const umzug = new Umzug({
      migrations: {
        glob: migrationsPath,
        resolve: ({ name, path: migrationPath }) => {
          const migration = require(migrationPath);
          return {
            name,
            up: async (params) => migration.up(params.context, params.context.sequelize.Sequelize),
            down: async (params) => migration.down(params.context, params.context.sequelize.Sequelize),
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    // Check for pending migrations
    const pending = await umzug.pending();

    if (pending.length === 0) {
      console.log('✓ No pending migrations\n');
      await sequelize.close();
      return;
    }

    console.log(`Found ${pending.length} pending migrations:`);
    pending.forEach((migration) => {
      console.log(`  - ${migration.name}`);
    });
    console.log();

    // Run migrations
    console.log('Running migrations...');
    await umzug.up();
    console.log('\n✓ All migrations completed successfully\n');

    await sequelize.close();
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
