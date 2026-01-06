/**
 * Test Database Utilities
 * Setup and teardown in-memory SQLite database for testing
 */

import { Sequelize, DataTypes } from 'sequelize';
import License from '../../src/main/database/models/License';

let sequelize: Sequelize | null = null;

/**
 * Setup in-memory SQLite database for tests
 */
export async function setupTestDB(): Promise<Sequelize> {
  // Create in-memory SQLite database
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });

  // Initialize License model
  License.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      license_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      hardware_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      activation_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      grace_period_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      license_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'perpetual',
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'active',
      },
      last_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      verification_failures: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      offline_grace_remaining_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    }
  );

  // Sync database (create tables)
  await sequelize.sync({ force: true });

  return sequelize;
}

/**
 * Teardown test database
 */
export async function teardownTestDB(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}

/**
 * Get test database instance
 */
export function getTestDB(): Sequelize | null {
  return sequelize;
}

/**
 * Seed license data for testing
 */
export async function seedLicense(
  data: Partial<{
    license_key: string;
    hardware_id: string;
    activation_date: Date;
    grace_period_days: number;
    license_type: 'trial' | 'perpetual' | 'subscription';
    status: 'active' | 'grace_period' | 'expired' | 'revoked';
    last_verified_at: Date | null;
    verification_failures: number;
    offline_grace_remaining_days: number;
    expiry_date: Date | null;
    metadata: any;
  }>
): Promise<License> {
  const defaultData = {
    license_key: 'DHAN-TEST-1234-5678-90AB',
    hardware_id: 'test-hardware-id-abc123',
    activation_date: new Date(),
    grace_period_days: 30,
    license_type: 'perpetual' as const,
    status: 'active' as const,
    last_verified_at: new Date(),
    verification_failures: 0,
    offline_grace_remaining_days: 30,
    expiry_date: null,
    metadata: null,
  };

  return await License.create({
    ...defaultData,
    ...data,
  });
}

/**
 * Clear all licenses from test database
 */
export async function clearLicenses(): Promise<void> {
  await License.destroy({ where: {}, truncate: true });
}
