import { ipcMain } from 'electron';
import licenseService from '../services/licenseService';
import hardwareIdService from '../services/hardwareIdService';

/**
 * License IPC Handlers
 * Exposes license-related functions to the renderer process
 *
 * Available channels:
 * - license:activate - Activate a license
 * - license:validate - Validate current license
 * - license:deactivate - Deactivate license (for device transfer)
 * - license:get-info - Get current license information
 * - license:get-hardware-id - Get hardware ID for this device
 * - license:get-hardware-info - Get detailed hardware information
 */

export function setupLicenseHandlers(): void {
  /**
   * Activate a license with the provided license key
   */
  ipcMain.handle('license:activate', async (event, { licenseKey }) => {
    try {
      console.log('📝 License activation requested');

      if (!licenseKey || typeof licenseKey !== 'string') {
        return {
          success: false,
          error: 'License key is required',
        };
      }

      const result = await licenseService.activateLicense(licenseKey.trim().toUpperCase());

      if (result.success) {
        console.log('✓ License activated successfully');
        return {
          success: true,
          license: {
            id: result.license?.id,
            license_key: result.license?.license_key,
            license_type: result.license?.license_type,
            status: result.license?.status,
            activation_date: result.license?.activation_date,
            expiry_date: result.license?.expiry_date,
            grace_period_days: result.license?.grace_period_days,
            offline_grace_remaining_days: result.license?.offline_grace_remaining_days,
          },
        };
      } else {
        console.error('✗ License activation failed:', result.error);
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error('✗ License activation error:', error);
      return {
        success: false,
        error: `Activation failed: ${error.message}`,
      };
    }
  });

  /**
   * Validate the current license
   */
  ipcMain.handle('license:validate', async () => {
    try {
      console.log('🔍 License validation requested');

      const result = await licenseService.validateLicense();

      if (result.valid) {
        console.log('✓ License is valid');

        if (result.warningMessage) {
          console.warn('⚠️', result.warningMessage);
        }

        return {
          valid: true,
          license: result.license
            ? {
                id: result.license.id,
                license_key: result.license.license_key,
                license_type: result.license.license_type,
                status: result.license.status,
                activation_date: result.license.activation_date,
                expiry_date: result.license.expiry_date,
                grace_period_days: result.license.grace_period_days,
                offline_grace_remaining_days: result.license.offline_grace_remaining_days,
                last_verified_at: result.license.last_verified_at,
              }
            : null,
          warningMessage: result.warningMessage,
        };
      } else {
        console.error('✗ License validation failed:', result.error);
        return {
          valid: false,
          error: result.error,
          license: result.license
            ? {
                id: result.license.id,
                license_key: result.license.license_key,
                license_type: result.license.license_type,
                status: result.license.status,
                activation_date: result.license.activation_date,
                expiry_date: result.license.expiry_date,
              }
            : null,
        };
      }
    } catch (error: any) {
      console.error('✗ License validation error:', error);
      return {
        valid: false,
        error: `Validation failed: ${error.message}`,
      };
    }
  });

  /**
   * Deactivate current license (for device transfer)
   */
  ipcMain.handle('license:deactivate', async () => {
    try {
      console.log('🔓 License deactivation requested');

      const result = await licenseService.deactivateLicense();

      if (result.success) {
        console.log('✓ License deactivated successfully');
        return {
          success: true,
        };
      } else {
        console.error('✗ License deactivation failed:', result.error);
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error('✗ License deactivation error:', error);
      return {
        success: false,
        error: `Deactivation failed: ${error.message}`,
      };
    }
  });

  /**
   * Get current license information
   */
  ipcMain.handle('license:get-info', async () => {
    try {
      const license = await licenseService.getLicenseInfo();

      if (license) {
        return {
          success: true,
          license: {
            id: license.id,
            license_key: license.license_key,
            license_type: license.license_type,
            status: license.status,
            activation_date: license.activation_date,
            expiry_date: license.expiry_date,
            grace_period_days: license.grace_period_days,
            offline_grace_remaining_days: license.offline_grace_remaining_days,
            last_verified_at: license.last_verified_at,
            verification_failures: license.verification_failures,
            metadata: license.metadata,
          },
        };
      } else {
        return {
          success: false,
          error: 'No license found',
        };
      }
    } catch (error: any) {
      console.error('✗ Error getting license info:', error);
      return {
        success: false,
        error: `Failed to get license info: ${error.message}`,
      };
    }
  });

  /**
   * Get hardware ID for this device
   */
  ipcMain.handle('license:get-hardware-id', async () => {
    try {
      const hardwareId = await hardwareIdService.generateHardwareId();

      return {
        success: true,
        hardwareId,
      };
    } catch (error: any) {
      console.error('✗ Error getting hardware ID:', error);
      return {
        success: false,
        error: `Failed to get hardware ID: ${error.message}`,
      };
    }
  });

  /**
   * Get detailed hardware information (for support/debugging)
   */
  ipcMain.handle('license:get-hardware-info', async () => {
    try {
      const hardwareInfo = await hardwareIdService.getHardwareInfo();

      return {
        success: true,
        hardwareInfo,
      };
    } catch (error: any) {
      console.error('✗ Error getting hardware info:', error);
      return {
        success: false,
        error: `Failed to get hardware info: ${error.message}`,
      };
    }
  });

  console.log('✓ License IPC handlers registered');
}
