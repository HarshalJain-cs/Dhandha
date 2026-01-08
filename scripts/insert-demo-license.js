/**
 * Insert Demo License Script
 *
 * This script inserts the demo license into the PostgreSQL database.
 *
 * Usage: node scripts/insert-demo-license.js
 */

const { Client } = require('pg');

// Use the hardware ID that the app is actually using (from app logs)
const HARDWARE_ID = '315cfa63693439956cd33841405136138c7ed8ba25b6efa5a539d08435dbc455';
const LICENSE_KEY = 'DHAN-TEST-1234-5678-90AB';

async function insertDemoLicense() {
  const client = new Client({
    host: 'localhost',
    port: 54320,
    user: 'postgres',
    password: '', // Empty password for embedded PostgreSQL
    database: 'jewellery_erp',
  });

  try {
    console.log('\n========================================');
    console.log('  DEMO LICENSE INSERTION');
    console.log('========================================\n');

    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if license already exists
    console.log('Checking for existing licenses...');
    const checkResult = await client.query(
      'SELECT * FROM licenses WHERE hardware_id = $1',
      [HARDWARE_ID]
    );

    if (checkResult.rows.length > 0) {
      console.log(`\n⚠ License already exists for this hardware ID:`);
      console.log('----------------------------------------');
      console.log(`License Key: ${checkResult.rows[0].license_key}`);
      console.log(`Type: ${checkResult.rows[0].license_type}`);
      console.log(`Status: ${checkResult.rows[0].status}`);
      console.log(`Activated: ${checkResult.rows[0].activation_date}`);
      console.log('========================================\n');
      await client.end();
      return;
    }

    console.log('✓ No existing license found\n');

    // Insert the demo license
    console.log('Inserting demo license...');
    const insertQuery = `
      INSERT INTO licenses (
        license_key,
        hardware_id,
        activation_date,
        grace_period_days,
        license_type,
        status,
        last_verified_at,
        verification_failures,
        offline_grace_remaining_days,
        expiry_date,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, CURRENT_TIMESTAMP, $3, $4, $5,
        CURRENT_TIMESTAMP, $6, $7, $8, $9,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const result = await client.query(insertQuery, [
      LICENSE_KEY,
      HARDWARE_ID,
      30,  // grace_period_days
      'perpetual',  // license_type
      'active',  // status
      0,  // verification_failures
      30,  // offline_grace_remaining_days
      null,  // expiry_date (perpetual license)
      JSON.stringify({ demo: true, features: ['all'], notes: 'Development license' }),  // metadata
    ]);

    console.log('✓ License inserted successfully!\n');

    console.log('License Details:');
    console.log('========================================');
    console.log(`License Key: ${result.rows[0].license_key}`);
    console.log(`Hardware ID: ${result.rows[0].hardware_id}`);
    console.log(`Type: ${result.rows[0].license_type}`);
    console.log(`Status: ${result.rows[0].status}`);
    console.log(`Grace Period: ${result.rows[0].grace_period_days} days`);
    console.log(`Activated: ${result.rows[0].activation_date}`);
    console.log(`Metadata: ${JSON.stringify(result.rows[0].metadata, null, 2)}`);
    console.log('========================================\n');

    console.log('✅ You can now activate the app with:');
    console.log(`   License Key: ${LICENSE_KEY}`);
    console.log('\n   The app will automatically validate against this hardware.\n');

    await client.end();
    console.log('✓ Connection closed\n');

  } catch (error) {
    console.error('\n❌ Error inserting demo license:', error.message);
    console.error('\nDetails:', error);
    console.error('\nMake sure:');
    console.error('  1. PostgreSQL is running (npm start)');
    console.error('  2. Database "jewellery_erp" exists');
    console.error('  3. Table "licenses" exists (run migrations)');
    console.error('');
    process.exit(1);
  }
}

insertDemoLicense();
