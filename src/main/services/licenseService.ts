import License from '../database/models/License';
import hardwareIdService from './hardwareIdService';
import Store from 'electron-store';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

/**
 * License Service
 * Handles license activation, validation, and management
 *
 * Features:
 * - Hardware-bound license activation
 * - Online/offline license validation
 * - Grace period for offline usage
 * - Cloud verification via Supabase
 * - License status tracking
 */

const store = new Store({
  name: 'license',
  encryptionKey: 'dhandha-jewellery-erp-2025', // Basic obfuscation
});

interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  warningMessage?: string;
}

interface LicenseActivationResult {
  success: boolean;
  license?: License;
  error?: string;
}

interface CloudLicenseResponse {
  valid: boolean;
  license_type: 'trial' | 'perpetual' | 'subscription';
  grace_period_days: number;
  expiry_date?: string;
  status: string;
  metadata?: any;
  error?: string;
}

export class LicenseService {
  private supabase: any = null;

  constructor() {
    // Initialize Supabase if credentials are available
    if (process.env.LICENSE_API_URL && process.env.LICENSE_API_KEY) {
      this.supabase = createClient(
        process.env.LICENSE_API_URL,
        process.env.LICENSE_API_KEY
      );
    }
  }

  /**
   * Activate a license with the provided license key
   * @param licenseKey License key in format: DHAN-XXXX-XXXX-XXXX-XXXX
   * @returns Activation result
   */
  async activateLicense(licenseKey: string): Promise<LicenseActivationResult> {
    try {
      // Validate license key format
      if (!this.isValidLicenseKeyFormat(licenseKey)) {
        return {
          success: false,
          error: 'Invalid license key format. Expected format: DHAN-XXXX-XXXX-XXXX-XXXX',
        };
      }

      // Generate hardware ID
      const hardwareId = await hardwareIdService.generateHardwareId();

      // Check if license already exists locally
      const existingLicense = await License.findOne({
        where: { license_key: licenseKey },
      });

      if (existingLicense) {
        // Verify hardware ID matches
        if (existingLicense.hardware_id !== hardwareId) {
          return {
            success: false,
            error: 'This license is already activated on another device. Please contact support to transfer your license.',
          };
        }

        // License already activated on this device
        return {
          success: true,
          license: existingLicense,
        };
      }

      // Attempt online activation with cloud server
      if (this.supabase) {
        try {
          const cloudResult = await this.activateWithCloud(licenseKey, hardwareId);

          if (cloudResult.valid) {
            // Create local license record
            const license = await License.create({
              license_key: licenseKey,
              hardware_id: hardwareId,
              activation_date: new Date(),
              license_type: cloudResult.license_type,
              grace_period_days: cloudResult.grace_period_days,
              status: 'active',
              last_verified_at: new Date(),
              verification_failures: 0,
              offline_grace_remaining_days: cloudResult.grace_period_days,
              expiry_date: cloudResult.expiry_date ? new Date(cloudResult.expiry_date) : null,
              metadata: cloudResult.metadata,
            });

            console.log('✓ License activated successfully (online)');
            return {
              success: true,
              license,
            };
          } else {
            return {
              success: false,
              error: cloudResult.error || 'License activation failed. Please check your license key.',
            };
          }
        } catch (cloudError: any) {
          console.warn('Cloud activation failed, trying offline activation:', cloudError.message);
          // Fall through to offline activation
        }
      }

      // Offline activation (if cloud unavailable)
      const offlineResult = this.validateOfflineLicense(licenseKey, hardwareId);

      if (offlineResult.valid) {
        // Create local license record with default values
        const license = await License.create({
          license_key: licenseKey,
          hardware_id: hardwareId,
          activation_date: new Date(),
          license_type: 'perpetual', // Default for offline
          grace_period_days: 30,
          status: 'grace_period', // Start in grace period until verified online
          last_verified_at: null,
          verification_failures: 0,
          offline_grace_remaining_days: 30,
          expiry_date: null,
          metadata: null,
        });

        console.log('✓ License activated successfully (offline mode)');
        console.log('⚠️ Please connect to internet to verify license');

        return {
          success: true,
          license,
        };
      } else {
        return {
          success: false,
          error: 'Invalid license key. Please check and try again, or contact support.',
        };
      }
    } catch (error: any) {
      console.error('License activation error:', error);
      return {
        success: false,
        error: `Activation failed: ${error.message}`,
      };
    }
  }

  /**
   * Validate the current license
   * @returns Validation result
   */
  async validateLicense(): Promise<LicenseValidationResult> {
    try {
      // Get hardware ID
      const hardwareId = await hardwareIdService.generateHardwareId();

      // Find active license
      const license = await License.findOne({
        where: { hardware_id: hardwareId },
        order: [['created_at', 'DESC']],
      });

      if (!license) {
        return {
          valid: false,
          error: 'No license found. Please activate your license.',
        };
      }

      // Verify hardware ID matches (protection against license file copying)
      if (license.hardware_id !== hardwareId) {
        return {
          valid: false,
          error: 'Hardware mismatch. This license is not valid for this device.',
        };
      }

      // Check if license is valid
      if (!license.isValid()) {
        return {
          valid: false,
          license,
          error: license.getWarningMessage() || 'License is not valid.',
        };
      }

      // Check if verification is needed
      if (license.needsVerification() && this.supabase) {
        // Attempt online verification
        try {
          const verifyResult = await this.verifyWithCloud(license);

          if (verifyResult.success) {
            // Update license with verification result
            const newStatus = (verifyResult.status || 'active') as 'active' | 'grace_period' | 'expired' | 'revoked';
            await license.update({
              last_verified_at: new Date(),
              verification_failures: 0,
              offline_grace_remaining_days: license.grace_period_days,
              status: newStatus,
            });

            console.log('✓ License verified online');
          } else {
            // Verification failed, increment failure count
            await license.update({
              verification_failures: license.verification_failures + 1,
            });

            console.warn('✗ License verification failed:', verifyResult.error);
          }
        } catch (verifyError: any) {
          console.warn('Cloud verification unavailable:', verifyError.message);
          // Don't fail validation if cloud is unavailable, use grace period
        }
      }

      // Update offline grace period
      const daysSinceVerification = license.daysSinceLastVerification();

      if (daysSinceVerification > 0 && license.status === 'grace_period') {
        const remainingDays = Math.max(
          0,
          license.grace_period_days - daysSinceVerification
        );

        await license.update({
          offline_grace_remaining_days: remainingDays,
        });

        if (remainingDays <= 0) {
          await license.update({ status: 'expired' });

          return {
            valid: false,
            license,
            error: 'License grace period has expired. Please connect to internet to verify.',
          };
        }
      }

      // Final validation check
      if (!license.isValid()) {
        return {
          valid: false,
          license,
          error: license.getWarningMessage() || 'License validation failed.',
        };
      }

      // License is valid
      const warningMessage = license.getWarningMessage();

      return {
        valid: true,
        license,
        warningMessage: warningMessage || undefined,
      };
    } catch (error: any) {
      console.error('License validation error:', error);
      return {
        valid: false,
        error: `Validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Deactivate current license (for device transfer)
   */
  async deactivateLicense(): Promise<{ success: boolean; error?: string }> {
    try {
      const hardwareId = await hardwareIdService.generateHardwareId();

      const license = await License.findOne({
        where: { hardware_id: hardwareId },
      });

      if (!license) {
        return {
          success: false,
          error: 'No license found on this device.',
        };
      }

      // Notify cloud of deactivation (if available)
      if (this.supabase) {
        try {
          await this.deactivateWithCloud(license.license_key, hardwareId);
        } catch (error) {
          console.warn('Cloud deactivation failed:', error);
          // Continue with local deactivation
        }
      }

      // Delete local license
      await license.destroy();

      console.log('✓ License deactivated successfully');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('License deactivation error:', error);
      return {
        success: false,
        error: `Deactivation failed: ${error.message}`,
      };
    }
  }

  /**
   * Get current license information
   */
  async getLicenseInfo(): Promise<License | null> {
    try {
      const hardwareId = await hardwareIdService.generateHardwareId();

      const license = await License.findOne({
        where: { hardware_id: hardwareId },
        order: [['created_at', 'DESC']],
      });

      return license;
    } catch (error) {
      console.error('Error getting license info:', error);
      return null;
    }
  }

  /**
   * Validate license key format
   */
  private isValidLicenseKeyFormat(licenseKey: string): boolean {
    // Format: DHAN-XXXX-XXXX-XXXX-XXXX
    const pattern = /^DHAN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(licenseKey);
  }

  /**
   * Activate license with cloud server
   */
  private async activateWithCloud(
    licenseKey: string,
    hardwareId: string
  ): Promise<CloudLicenseResponse> {
    const { data, error } = await this.supabase
      .from('license_keys')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return {
        valid: false,
        error: 'Invalid license key or license not found.',
        license_type: 'perpetual',
        grace_period_days: 30,
        status: 'invalid',
      };
    }

    // Check if license is already activated on another device
    const { data: activations } = await this.supabase
      .from('license_activations')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('status', 'active');

    const maxActivations = data.max_activations || 1;

    if (activations && activations.length >= maxActivations) {
      // Check if this hardware ID is already activated
      const existingActivation = activations.find(
        (a: any) => a.hardware_id === hardwareId
      );

      if (!existingActivation) {
        return {
          valid: false,
          error: 'License already activated on maximum number of devices.',
          license_type: 'perpetual',
          grace_period_days: 30,
          status: 'max_activations_reached',
        };
      }
    }

    // Create activation record
    const { error: activationError } = await this.supabase
      .from('license_activations')
      .upsert(
        {
          license_key: licenseKey,
          hardware_id: hardwareId,
          activation_date: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          status: 'active',
          device_info: {
            platform: process.platform,
            arch: process.arch,
            hostname: require('os').hostname(),
          },
        },
        { onConflict: 'license_key,hardware_id' }
      );

    if (activationError) {
      console.error('Activation record creation failed:', activationError);
    }

    // Update activation count
    await this.supabase
      .from('license_keys')
      .update({
        current_activations: activations ? activations.length + 1 : 1,
      })
      .eq('license_key', licenseKey);

    return {
      valid: true,
      license_type: data.license_type || 'perpetual',
      grace_period_days: data.grace_period_days || 30,
      expiry_date: data.expiry_date,
      status: 'active',
      metadata: data.metadata,
    };
  }

  /**
   * Verify license with cloud server
   */
  private async verifyWithCloud(
    license: License
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('license_keys')
        .select('status, expiry_date')
        .eq('license_key', license.license_key)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'License not found in cloud database.',
        };
      }

      // Update last_seen_at for this activation
      await this.supabase
        .from('license_activations')
        .update({
          last_seen_at: new Date().toISOString(),
        })
        .eq('license_key', license.license_key)
        .eq('hardware_id', license.hardware_id);

      // Check if license is revoked
      if (data.status === 'revoked') {
        return {
          success: false,
          status: 'revoked',
          error: 'License has been revoked.',
        };
      }

      // Check expiry for trial/subscription
      if (data.expiry_date) {
        const expiryDate = new Date(data.expiry_date);
        if (new Date() > expiryDate) {
          return {
            success: false,
            status: 'expired',
            error: 'License has expired.',
          };
        }
      }

      return {
        success: true,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deactivate license with cloud server
   */
  private async deactivateWithCloud(
    licenseKey: string,
    hardwareId: string
  ): Promise<void> {
    // Update activation status
    await this.supabase
      .from('license_activations')
      .update({ status: 'deactivated' })
      .eq('license_key', licenseKey)
      .eq('hardware_id', hardwareId);

    // Decrement activation count
    const { data: activations } = await this.supabase
      .from('license_activations')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('status', 'active');

    await this.supabase
      .from('license_keys')
      .update({
        current_activations: activations ? activations.length : 0,
      })
      .eq('license_key', licenseKey);
  }

  /**
   * Validate license offline (basic checksum verification)
   * This is a fallback when cloud is unavailable
   */
  private validateOfflineLicense(
    licenseKey: string,
    hardwareId: string
  ): { valid: boolean } {
    try {
      // Remove DHAN prefix and dashes
      const keyParts = licenseKey.replace('DHAN-', '').split('-');

      if (keyParts.length !== 4) {
        return { valid: false };
      }

      // Last block should be a checksum of the first 3 blocks
      const data = keyParts.slice(0, 3).join('');
      const providedChecksum = keyParts[3];

      // Calculate checksum (simple hash of first 3 blocks)
      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(data + 'dhandha-secret-salt') // Secret salt for checksum
        .digest('hex')
        .substring(0, 4)
        .toUpperCase();

      return { valid: providedChecksum === calculatedChecksum };
    } catch {
      return { valid: false };
    }
  }
}

// Export singleton instance
export default new LicenseService();
