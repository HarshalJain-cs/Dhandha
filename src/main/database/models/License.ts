import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * License Model
 * Stores license information locally for validation
 *
 * Types:
 * - trial: Time-limited trial license
 * - perpetual: One-time purchase, never expires
 * - subscription: Recurring subscription (monthly/yearly)
 *
 * Status:
 * - active: License is valid and active
 * - grace_period: Offline grace period active
 * - expired: License has expired
 * - revoked: License has been revoked remotely
 */

interface LicenseAttributes {
  id: number;
  license_key: string;
  hardware_id: string;
  activation_date: Date;
  grace_period_days: number;
  license_type: 'trial' | 'perpetual' | 'subscription';
  status: 'active' | 'grace_period' | 'expired' | 'revoked';
  last_verified_at: Date | null;
  verification_failures: number;
  offline_grace_remaining_days: number;
  expiry_date: Date | null; // For trial/subscription
  metadata: any; // Additional license info (JSON)
  created_at: Date;
  updated_at: Date;
}

interface LicenseCreationAttributes
  extends Optional<
    LicenseAttributes,
    | 'id'
    | 'grace_period_days'
    | 'status'
    | 'last_verified_at'
    | 'verification_failures'
    | 'offline_grace_remaining_days'
    | 'expiry_date'
    | 'metadata'
    | 'created_at'
    | 'updated_at'
  > {}

class License
  extends Model<LicenseAttributes, LicenseCreationAttributes>
  implements LicenseAttributes
{
  declare id: number;
  declare license_key: string;
  declare hardware_id: string;
  declare activation_date: Date;
  declare grace_period_days: number;
  declare license_type: 'trial' | 'perpetual' | 'subscription';
  declare status: 'active' | 'grace_period' | 'expired' | 'revoked';
  declare last_verified_at: Date | null;
  declare verification_failures: number;
  declare offline_grace_remaining_days: number;
  declare expiry_date: Date | null;
  declare metadata: any;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  /**
   * Check if license is currently valid
   */
  isValid(): boolean {
    // Revoked licenses are never valid
    if (this.status === 'revoked') {
      return false;
    }

    // Expired licenses are not valid
    if (this.status === 'expired') {
      return false;
    }

    // For trial/subscription, check expiry date
    if (
      (this.license_type === 'trial' || this.license_type === 'subscription') &&
      this.expiry_date
    ) {
      if (new Date() > this.expiry_date) {
        return false;
      }
    }

    // Grace period is still valid (but warn user)
    if (this.status === 'grace_period') {
      if (this.offline_grace_remaining_days <= 0) {
        return false;
      }
      return true;
    }

    // Active perpetual licenses are always valid
    if (this.license_type === 'perpetual' && this.status === 'active') {
      return true;
    }

    // Active trial/subscription within expiry date
    if (this.status === 'active') {
      return true;
    }

    return false;
  }

  /**
   * Check if license needs online verification
   * Returns true if verification is overdue
   */
  needsVerification(): boolean {
    if (!this.last_verified_at) {
      return true;
    }

    const hoursSinceVerification =
      (Date.now() - this.last_verified_at.getTime()) / (1000 * 60 * 60);

    // Verify every 24 hours
    return hoursSinceVerification > 24;
  }

  /**
   * Calculate days since last verification
   */
  daysSinceLastVerification(): number {
    if (!this.last_verified_at) {
      return 999; // Never verified
    }

    const daysSince =
      (Date.now() - this.last_verified_at.getTime()) / (1000 * 60 * 60 * 24);

    return Math.floor(daysSince);
  }

  /**
   * Check if license is in grace period
   */
  isInGracePeriod(): boolean {
    return this.status === 'grace_period';
  }

  /**
   * Get warning message if license needs attention
   */
  getWarningMessage(): string | null {
    if (this.status === 'revoked') {
      return 'License has been revoked. Please contact support.';
    }

    if (this.status === 'expired') {
      return 'License has expired. Please renew your license.';
    }

    if (this.status === 'grace_period') {
      const daysRemaining = this.offline_grace_remaining_days;
      if (daysRemaining <= 0) {
        return 'Grace period has expired. Please connect to the internet to verify your license.';
      }
      if (daysRemaining <= 5) {
        return `Grace period expires in ${daysRemaining} days. Please connect to the internet to verify your license.`;
      }
      return `Running in offline mode. ${daysRemaining} days remaining.`;
    }

    // Check expiry for trial/subscription
    if (this.expiry_date && (this.license_type === 'trial' || this.license_type === 'subscription')) {
      const daysUntilExpiry = Math.ceil(
        (this.expiry_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        return 'License has expired. Please renew.';
      }

      if (daysUntilExpiry <= 7) {
        return `License expires in ${daysUntilExpiry} days. Please renew soon.`;
      }

      if (daysUntilExpiry <= 30 && this.license_type === 'subscription') {
        return `Subscription renews in ${daysUntilExpiry} days.`;
      }
    }

    return null;
  }
}

// Initialize License model
License.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    license_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'License key in format: DHAN-XXXX-XXXX-XXXX-XXXX',
    },
    hardware_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Hardware fingerprint (SHA-256 hash)',
    },
    activation_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When license was first activated',
    },
    grace_period_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Number of days allowed offline before expiry',
    },
    license_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['trial', 'perpetual', 'subscription']],
      },
      comment: 'Type of license: trial, perpetual, or subscription',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'grace_period', 'expired', 'revoked']],
      },
      comment: 'Current license status',
    },
    last_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last successful online verification',
    },
    verification_failures: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of consecutive verification failures',
    },
    offline_grace_remaining_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Days remaining in offline grace period',
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiry date for trial/subscription licenses',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional license metadata (features, limits, etc.)',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'License',
    tableName: 'licenses',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_licenses_hardware_id',
        fields: ['hardware_id'],
      },
      {
        name: 'idx_licenses_status',
        fields: ['status'],
      },
      {
        name: 'idx_licenses_license_key',
        unique: true,
        fields: ['license_key'],
      },
    ],
    comment: 'Stores license information for application activation',
  }
);

export default License;
