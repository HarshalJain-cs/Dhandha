/**
 * Hardware ID Mock
 * Mocks hardware ID service for consistent test results
 */

import { jest } from '@jest/globals';

export const MOCK_HARDWARE_ID = 'mock-hardware-abc123def456';
export const MOCK_ALTERNATIVE_HARDWARE_ID = 'mock-hardware-xyz789ghi012';

export const MOCK_HARDWARE_INFO = {
  machineId: 'mock-machine-id-123',
  macAddress: '00:11:22:33:44:55',
  cpu: 'Intel Core i7-1234',
  systemUuid: 'mock-uuid-abcd-1234',
  hostname: 'test-machine',
};

/**
 * Mock hardwareIdService module
 */
export function mockHardwareIdService() {
  const hardwareIdService = {
    generateHardwareId: jest.fn<() => Promise<string>>().mockResolvedValue(MOCK_HARDWARE_ID),
    getPrimaryMacAddress: jest.fn<() => string>().mockReturnValue(MOCK_HARDWARE_INFO.macAddress),
    getHardwareInfo: jest.fn<() => Promise<typeof MOCK_HARDWARE_INFO>>().mockResolvedValue(MOCK_HARDWARE_INFO),
  };

  return hardwareIdService;
}

/**
 * Mock hardware ID generation to return specific ID
 */
export function mockHardwareIdWithValue(hardwareId: string) {
  return jest.fn<() => Promise<string>>().mockResolvedValue(hardwareId);
}

/**
 * Mock hardware ID generation to throw error
 */
export function mockHardwareIdError(errorMessage: string = 'Hardware ID generation failed') {
  return jest.fn<() => Promise<string>>().mockRejectedValue(new Error(errorMessage));
}

/**
 * Create mock for different machine
 */
export function mockDifferentMachine() {
  return {
    generateHardwareId: jest.fn<() => Promise<string>>().mockResolvedValue(MOCK_ALTERNATIVE_HARDWARE_ID),
    getPrimaryMacAddress: jest.fn<() => string>().mockReturnValue('AA:BB:CC:DD:EE:FF'),
    getHardwareInfo: jest.fn<() => Promise<any>>().mockResolvedValue({
      machineId: 'different-machine-id',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      cpu: 'AMD Ryzen 5-5678',
      systemUuid: 'different-uuid-5678',
      hostname: 'different-machine',
    }),
  };
}
