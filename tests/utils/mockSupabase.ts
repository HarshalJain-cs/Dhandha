/**
 * Supabase Mock
 * Mocks Supabase client for testing license cloud operations
 */

import { jest } from '@jest/globals';

export const MOCK_HARDWARE_ID = 'mock-hardware-abc123def456';

export interface MockSupabaseResponse {
  data: any;
  error: any;
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient() {
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockUpsert = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();

  const mockFrom = jest.fn((table: string) => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    upsert: mockUpsert,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
  }));

  return {
    from: mockFrom,
    // Expose mock methods for test assertions
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      upsert: mockUpsert,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    },
  };
}

/**
 * Mock successful license key lookup
 */
export function mockLicenseKeyFound(licenseKey: string = 'DHAN-TEST-1234-5678-90AB') {
  return {
    data: [
      {
        license_key: licenseKey,
        license_type: 'perpetual',
        status: 'active',
        max_activations: 1,
        current_activations: 0,
        grace_period_days: 30,
        issued_date: new Date().toISOString(),
        expiry_date: null,
        metadata: null,
      },
    ],
    error: null,
  };
}

/**
 * Mock license key not found
 */
export function mockLicenseKeyNotFound() {
  return {
    data: [],
    error: null,
  };
}

/**
 * Mock license already activated on max devices
 */
export function mockMaxActivationsReached() {
  return {
    data: [
      {
        license_key: 'DHAN-TEST-1234-5678-90AB',
        hardware_id: 'different-hardware-id',
        status: 'active',
      },
    ],
    error: null,
  };
}

/**
 * Mock successful activation
 */
export function mockActivationSuccess() {
  return {
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      license_key: 'DHAN-TEST-1234-5678-90AB',
      hardware_id: MOCK_HARDWARE_ID,
      activation_date: new Date().toISOString(),
      status: 'active',
    },
    error: null,
  };
}

/**
 * Mock Supabase error
 */
export function mockSupabaseError(message: string) {
  return {
    data: null,
    error: {
      message,
      code: 'MOCK_ERROR',
    },
  };
}

/**
 * Mock expired license
 */
export function mockExpiredLicense() {
  return {
    data: [
      {
        license_key: 'DHAN-TRIAL-XXXX-XXXX-XXXX',
        license_type: 'trial',
        status: 'expired',
        max_activations: 1,
        current_activations: 1,
        grace_period_days: 30,
        issued_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        expiry_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago (expired)
        metadata: null,
      },
    ],
    error: null,
  };
}

/**
 * Mock revoked license
 */
export function mockRevokedLicense() {
  return {
    data: [
      {
        license_key: 'DHAN-REVOKED-XXXX-XXXX-XXXX',
        license_type: 'perpetual',
        status: 'revoked',
        max_activations: 1,
        current_activations: 0,
        grace_period_days: 30,
        issued_date: new Date().toISOString(),
        expiry_date: null,
        metadata: { reason: 'Payment refunded' },
      },
    ],
    error: null,
  };
}
