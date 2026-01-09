const { Sequelize } = require('sequelize');
const path = require('path');

async function runNewMigrations() {
  const sequelize = new Sequelize('postgres://postgres:@localhost:54320/jewellery_erp', {
    dialect: 'postgres',
    logging: console.log,
  });

  await sequelize.authenticate();
  console.log('✓ Connected\n');

  const queryInterface = sequelize.getQueryInterface();

  // Run the 3 new migrations
  const migrations = [
    '20260107120028-create-roles.js',
    '20260107120029-create-companies.js',
    '20260107120030-create-branches.js'
  ];

  for (const migrationFile of migrations) {
    console.log(`Running ${migrationFile}...`);
    const migration = require(path.join(__dirname, '..', 'database', 'migrations', migrationFile));
    await migration.up(queryInterface, Sequelize);
    console.log(`✓ ${migrationFile} completed\n`);
  }

  await sequelize.close();
  console.log('✓ All new migrations completed successfully');
}

runNewMigrations().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
