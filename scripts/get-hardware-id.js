/**
 * Hardware ID Generator Script
 *
 * This script generates the hardware ID for the current system.
 * Use this ID when inserting demo licenses into the database.
 *
 * Usage: node scripts/get-hardware-id.js
 */

const { machineIdSync } = require('node-machine-id');
const si = require('systeminformation');
const crypto = require('crypto');
const os = require('os');

/**
 * Get primary MAC address (prioritize Ethernet over WiFi)
 */
function getPrimaryMacAddress() {
  const networkInterfaces = os.networkInterfaces();
  const interfaces = Object.entries(networkInterfaces);

  // Priority: Ethernet > WiFi > Other
  const priorities = ['ethernet', 'eth', 'wi-fi', 'wifi'];

  for (const priority of priorities) {
    for (const [name, addresses] of interfaces) {
      if (name.toLowerCase().includes(priority)) {
        const validAddress = addresses.find(addr =>
          !addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00'
        );
        if (validAddress) {
          return validAddress.mac;
        }
      }
    }
  }

  // Fallback: first valid MAC address
  for (const [, addresses] of interfaces) {
    const validAddress = addresses.find(addr =>
      !addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00'
    );
    if (validAddress) {
      return validAddress.mac;
    }
  }

  return null;
}

async function generateHardwareId() {
  const factors = [];

  // Factor 1: Machine ID (most stable, OS-level)
  try {
    const machineId = machineIdSync(true);
    factors.push(`MID:${machineId}`);
    console.log('✓ Machine ID collected');
  } catch (error) {
    console.warn('⚠ Could not get machine ID:', error.message);
  }

  // Factor 2: Primary MAC address
  try {
    const primaryMac = getPrimaryMacAddress();
    if (primaryMac) {
      factors.push(`MAC:${primaryMac}`);
      console.log('✓ MAC Address collected');
    }
  } catch (error) {
    console.warn('⚠ Could not get MAC address:', error.message);
  }

  // Factor 3: CPU information
  try {
    const cpuInfo = await si.cpu();
    if (cpuInfo) {
      const cpuString = `CPU:${cpuInfo.manufacturer}:${cpuInfo.brand}:${cpuInfo.cores}`;
      factors.push(cpuString);
      console.log('✓ CPU Information collected');
    }
  } catch (error) {
    console.warn('⚠ Could not get CPU info:', error.message);
  }

  // Factor 4: System UUID (motherboard)
  try {
    const systemInfo = await si.system();
    if (systemInfo && systemInfo.uuid) {
      factors.push(`UUID:${systemInfo.uuid}`);
      console.log('✓ System UUID collected');
    }
  } catch (error) {
    console.warn('⚠ Could not get system UUID:', error.message);
  }

  // Factor 5: Hostname (least stable, but useful)
  try {
    const hostname = os.hostname();
    factors.push(`HOST:${hostname}`);
    console.log('✓ Hostname collected');
  } catch (error) {
    console.warn('⚠ Could not get hostname:', error.message);
  }

  // Combine all factors and hash
  const combined = factors.join('|');
  const hash = crypto.createHash('sha256').update(combined).digest('hex');

  return hash;
}

async function main() {
  try {
    console.log('\n========================================');
    console.log('  HARDWARE ID GENERATOR');
    console.log('========================================\n');

    console.log('Collecting hardware information...\n');

    const hardwareId = await generateHardwareId();

    console.log('\n========================================');
    console.log('Hardware ID:');
    console.log('----------------------------------------');
    console.log(hardwareId);
    console.log('----------------------------------------\n');

    console.log('Use this Hardware ID when inserting');
    console.log('demo licenses into the database.\n');

    console.log('Copy and run this SQL:');
    console.log('========================================');
    console.log(`INSERT INTO licenses (`);
    console.log(`  license_key, hardware_id, activation_date,`);
    console.log(`  grace_period_days, license_type, status,`);
    console.log(`  last_verified_at, verification_failures,`);
    console.log(`  offline_grace_remaining_days, expiry_date,`);
    console.log(`  metadata, created_at, updated_at`);
    console.log(`) VALUES (`);
    console.log(`  'DHAN-TEST-1234-5678-90AB',`);
    console.log(`  '${hardwareId}',`);
    console.log(`  CURRENT_TIMESTAMP,`);
    console.log(`  30,`);
    console.log(`  'perpetual',`);
    console.log(`  'active',`);
    console.log(`  CURRENT_TIMESTAMP,`);
    console.log(`  0,`);
    console.log(`  30,`);
    console.log(`  NULL,`);
    console.log(`  '{"demo": true, "features": ["all"]}'::jsonb,`);
    console.log(`  CURRENT_TIMESTAMP,`);
    console.log(`  CURRENT_TIMESTAMP`);
    console.log(`);`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error generating hardware ID:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
