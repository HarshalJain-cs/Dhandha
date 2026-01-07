import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../src/main/database/connection';
import log from 'electron-log';
import path from 'path';

/**
 * Umzug Migration Runner
 * Runs database migrations programmatically
 */
const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '../database/migrations/*.js'),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: {
    info: (message) => log.info(message),
    warn: (message) => log.warn(message),
    error: (message) => log.error(message),
    debug: (message) => log.debug(message),
  },
});

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    log.info('Checking for pending migrations...');

    const pending = await umzug.pending();

    if (pending.length === 0) {
      log.info('No pending migrations');
      return;
    }

    log.info(`Found ${pending.length} pending migrations`);
    pending.forEach((migration) => {
      log.info(`  - ${migration.name}`);
    });

    log.info('Running migrations...');
    await umzug.up();

    log.info('✓ All migrations completed successfully');
  } catch (error) {
    log.error('✗ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback last migration
 */
export async function rollbackMigration(): Promise<void> {
  try {
    log.info('Rolling back last migration...');
    await umzug.down();
    log.info('✓ Rollback completed successfully');
  } catch (error) {
    log.error('✗ Rollback failed:', error);
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  executed: string[];
  pending: string[];
}> {
  const executed = (await umzug.executed()).map((m) => m.name);
  const pending = (await umzug.pending()).map((m) => m.name);

  return { executed, pending };
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'up':
      runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'down':
      rollbackMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'status':
      getMigrationStatus()
        .then((status) => {
          console.log('\n=== Migration Status ===\n');
          console.log('Executed:');
          status.executed.forEach((name) => console.log(`  ✓ ${name}`));
          console.log('\nPending:');
          status.pending.forEach((name) => console.log(`  ○ ${name}`));
          console.log('');
          process.exit(0);
        })
        .catch(() => process.exit(1));
      break;

    default:
      console.log('Usage: ts-node scripts/run-migrations.ts [up|down|status]');
      process.exit(1);
  }
}
