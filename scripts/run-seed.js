const { Sequelize } = require('sequelize');
const path = require('path');

async function runSeed() {
  const sequelize = new Sequelize('postgres://postgres:@localhost:54320/jewellery_erp', {
    dialect: 'postgres',
    logging: console.log,
  });

  await sequelize.authenticate();
  console.log('✓ Connected\n');

  const queryInterface = sequelize.getQueryInterface();

  // Run the seed file
  const seedFile = '20260107120001-seed-initial-data.js';
  console.log(`Running seed: ${seedFile}...`);
  const seed = require(path.join(__dirname, '..', 'database', 'seeds', seedFile));
  await seed.up(queryInterface, Sequelize);
  console.log(`✓ ${seedFile} completed\n`);

  await sequelize.close();
  console.log('✓ Seed data inserted successfully');
}

runSeed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
