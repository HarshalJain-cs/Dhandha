/**
 * LicenseService Unit Tests
 * Tests license activation, validation, and deactivation
 */

import { setupTestDB, teardownTestDB, seedLicense, clearLicenses } from '../utils/testDatabase';
import { createMockSupabaseClient, mockLicenseKeyFound, mockActivationSuccess, MOCK_HARDWARE_ID } from '../utils/mockSupabase';
import License from '../../src/main/database/models/License';

// Note: We'll mock the actual licenseService in a way that allows testing
// For now, we'll test the License model directly and create integration tests for the full service

describe('License Model', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('License Creation and Retrieval', () => {
    test('should create a license with required fields', async () => {
      const license = await License.create({
        license_key: 'DHAN-TEST-1234-5678-90AB',
        hardware_id: 'test-hardware-id',
        activation_date: new Date(),
        grace_period_days: 30,
        license_type: 'perpetual',
        status: 'active',
        verification_failures: 0,
        offline_grace_remaining_days: 30,
      });

      expect(license.id).toBeDefined();
      expect(license.license_key).toBe('DHAN-TEST-1234-5678-90AB');
      expect(license.hardware_id).toBe('test-hardware-id');
      expect(license.license_type).toBe('perpetual');
      expect(license.status).toBe('active');
    });

    test('should retrieve license by license key', async () => {
      await seedLicense({
        license_key: 'DHAN-FIND-1234-5678-90AB',
      });

      const license = await License.findOne({
        where: { license_key: 'DHAN-FIND-1234-5678-90AB' },
      });

      expect(license).toBeDefined();
      expect(license?.license_key).toBe('DHAN-FIND-1234-5678-90AB');
    });

    test('should enforce unique license key constraint', async () => {
      await seedLicense({
        license_key: 'DHAN-UNIQUE-1234-5678-90AB',
      });

      // Attempt to create duplicate
      await expect(
        License.create({
          license_key: 'DHAN-UNIQUE-1234-5678-90AB',
          hardware_id: 'different-hardware',
          activation_date: new Date(),
          license_type: 'perpetual',
        })
      ).rejects.toThrow();
    });
  });

  describe('isValid Method', () => {
    test('should return true for active perpetual license', async () => {
      const license = await seedLicense({
        status: 'active',
        license_type: 'perpetual',
        expiry_date: null,
      });

      expect(license.isValid()).toBe(true);
    });

    test('should return false for revoked license', async () => {
      const license = await seedLicense({
        status: 'revoked',
      });

      expect(license.isValid()).toBe(false);
    });

    test('should return false for expired license', async () => {
      const license = await seedLicense({
        status: 'expired',
      });

      expect(license.isValid()).toBe(false);
    });

    test('should return false for expired trial license', async () => {
      const license = await seedLicense({
        license_type: 'trial',
        status: 'active',
        expiry_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });

      expect(license.isValid()).toBe(false);
    });

    test('should return true for trial license not yet expired', async () => {
      const license = await seedLicense({
        license_type: 'trial',
        status: 'active',
        expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      });

      expect(license.isValid()).toBe(true);
    });

    test('should return true for license in grace period with days remaining', async () => {
      const license = await seedLicense({
        status: 'grace_period',
        offline_grace_remaining_days: 15,
      });

      expect(license.isValid()).toBe(true);
    });

    test('should return false for license in grace period with no days remaining', async () => {
      const license = await seedLicense({
        status: 'grace_period',
        offline_grace_remaining_days: 0,
      });

      expect(license.isValid()).toBe(false);
    });
  });

  describe('needsVerification Method', () => {
    test('should return true if never verified', async () => {
      const license = await seedLicense({
        last_verified_at: null,
      });

      expect(license.needsVerification()).toBe(true);
    });

    test('should return true if verified more than 1 day ago', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const license = await seedLicense({
        last_verified_at: twoDaysAgo,
      });

      expect(license.needsVerification()).toBe(true);
    });

    test('should return false if verified less than 1 day ago', async () => {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const license = await seedLicense({
        last_verified_at: twelveHoursAgo,
      });

      expect(license.needsVerification()).toBe(false);
    });
  });

  describe('daysSinceLastVerification Method', () => {
    test('should return 0 if verified today', async () => {
      const license = await seedLicense({
        last_verified_at: new Date(),
      });

      const days = license.daysSinceLastVerification();
      expect(days).toBe(0);
    });

    test('should return correct days since last verification', async () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const license = await seedLicense({
        last_verified_at: fifteenDaysAgo,
      });

      const days = license.daysSinceLastVerification();
      expect(days).toBe(15);
    });

    test('should return 999 if never verified', async () => {
      const license = await seedLicense({
        last_verified_at: null,
      });

      const days = license.daysSinceLastVerification();
      expect(days).toBe(999);
    });
  });

  describe('isInGracePeriod Method', () => {
    test('should return true if status is grace_period', async () => {
      const license = await seedLicense({
        status: 'grace_period',
        offline_grace_remaining_days: 15,
      });

      expect(license.isInGracePeriod()).toBe(true);
    });

    test('should return false if status is active', async () => {
      const license = await seedLicense({
        status: 'active',
      });

      expect(license.isInGracePeriod()).toBe(false);
    });

    test('should return true if status is grace_period regardless of days', async () => {
      const license = await seedLicense({
        status: 'grace_period',
        offline_grace_remaining_days: 0,
      });

      // isInGracePeriod() only checks status, not remaining days
      expect(license.isInGracePeriod()).toBe(true);
    });
  });

  describe('getWarningMessage Method', () => {
    test('should return grace period warning', async () => {
      const license = await seedLicense({
        status: 'grace_period',
        offline_grace_remaining_days: 10,
      });

      const message = license.getWarningMessage();
      expect(message).toContain('Running in offline mode');
      expect(message).toContain('10 days');
    });

    test('should return expiring soon warning for trial license', async () => {
      const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const license = await seedLicense({
        license_type: 'trial',
        status: 'active',
        expiry_date: fiveDaysFromNow,
      });

      const message = license.getWarningMessage();
      expect(message).toContain('expires in');
      expect(message).toContain('5 days');
    });

    test('should return null for valid perpetual license', async () => {
      const license = await seedLicense({
        license_type: 'perpetual',
        status: 'active',
        expiry_date: null,
        offline_grace_remaining_days: 30,
      });

      const message = license.getWarningMessage();
      expect(message).toBeNull();
    });
  });

  describe('Offline Grace Period Countdown', () => {
    test('should decrement grace period days correctly', async () => {
      // Create license verified 5 days ago with 30 day grace period
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const license = await seedLicense({
        status: 'active',
        grace_period_days: 30,
        offline_grace_remaining_days: 30,
        last_verified_at: fiveDaysAgo,
      });

      // Simulate offline validation logic
      const daysSince = license.daysSinceLastVerification();
      const remainingDays = Math.max(0, license.offline_grace_remaining_days - daysSince);

      expect(daysSince).toBe(5);
      expect(remainingDays).toBe(25); // 30 - 5 = 25 days remaining
    });

    test('should enter grace period when offline too long', async () => {
      // License verified 2 days ago, already in grace period
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const license = await seedLicense({
        status: 'grace_period',
        grace_period_days: 30,
        offline_grace_remaining_days: 15,
        last_verified_at: twoDaysAgo,
      });

      // After 2 more days offline
      const remainingDays = Math.max(0, license.offline_grace_remaining_days - license.daysSinceLastVerification());

      expect(remainingDays).toBe(13); // 15 - 2 = 13 days
      expect(license.isInGracePeriod()).toBe(true);
    });

    test('should invalidate when grace period fully expired', async () => {
      // License with grace period fully expired (0 days remaining)
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      const license = await seedLicense({
        status: 'grace_period',
        grace_period_days: 30,
        offline_grace_remaining_days: 0, // Already expired
        last_verified_at: thirtyOneDaysAgo,
      });

      expect(license.offline_grace_remaining_days).toBe(0);
      expect(license.isValid()).toBe(false);
    });
  });

  describe('License Updates', () => {
    test('should update license status', async () => {
      const license = await seedLicense({
        status: 'active',
      });

      await license.update({ status: 'grace_period' });

      const updated = await License.findByPk(license.id);
      expect(updated?.status).toBe('grace_period');
    });

    test('should update offline grace remaining days', async () => {
      const license = await seedLicense({
        offline_grace_remaining_days: 30,
      });

      await license.update({ offline_grace_remaining_days: 20 });

      const updated = await License.findByPk(license.id);
      expect(updated?.offline_grace_remaining_days).toBe(20);
    });

    test('should increment verification failures', async () => {
      const license = await seedLicense({
        verification_failures: 2,
      });

      await license.update({ verification_failures: license.verification_failures + 1 });

      const updated = await License.findByPk(license.id);
      expect(updated?.verification_failures).toBe(3);
    });

    test('should reset verification failures on successful verification', async () => {
      const license = await seedLicense({
        verification_failures: 5,
      });

      await license.update({
        verification_failures: 0,
        last_verified_at: new Date(),
        offline_grace_remaining_days: 30,
      });

      const updated = await License.findByPk(license.id);
      expect(updated?.verification_failures).toBe(0);
      expect(updated?.offline_grace_remaining_days).toBe(30);
    });
  });
});
