/**
 * HardwareIdService Unit Tests
 * Tests hardware fingerprinting and ID generation
 */

import { HardwareIdService } from '../../src/main/services/hardwareIdService';

// Mock dependencies
jest.mock('node-machine-id');
jest.mock('systeminformation');
jest.mock('os');

import { machineIdSync } from 'node-machine-id';
import * as si from 'systeminformation';
import * as os from 'os';

describe('HardwareIdService', () => {
  let service: HardwareIdService;

  beforeEach(() => {
    service = new HardwareIdService();
    jest.clearAllMocks();
  });

  describe('generateHardwareId', () => {
    test('should generate a consistent hardware ID', async () => {
      // Mock machine ID
      (machineIdSync as jest.Mock).mockReturnValue('test-machine-id-123');

      // Mock network interfaces
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        'Ethernet': [
          {
            address: '00:11:22:33:44:55',
            mac: '00:11:22:33:44:55',
            internal: false,
            family: 'IPv4',
          },
        ],
      });

      // Mock CPU info
      (si.cpu as jest.Mock).mockResolvedValue({
        manufacturer: 'Intel',
        brand: 'Core i7-1234',
        speed: 2.4,
        cores: 8,
      });

      // Mock system info
      (si.system as jest.Mock).mockResolvedValue({
        uuid: 'test-system-uuid-456',
        manufacturer: 'Dell',
        model: 'XPS 15',
      });

      // Mock hostname
      (os.hostname as jest.Mock).mockReturnValue('test-machine');

      const hardwareId = await service.generateHardwareId();

      // Should return a 64-character SHA-256 hash
      expect(hardwareId).toMatch(/^[a-f0-9]{64}$/);
      expect(hardwareId.length).toBe(64);
    });

    test('should return cached hardware ID on subsequent calls', async () => {
      // Mock dependencies
      (machineIdSync as jest.Mock).mockReturnValue('test-machine-id');
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        'Ethernet': [{ address: '00:11:22:33:44:55', mac: '00:11:22:33:44:55', internal: false }],
      });
      (si.cpu as jest.Mock).mockResolvedValue({ brand: 'Intel Core i7' });
      (si.system as jest.Mock).mockResolvedValue({ uuid: 'test-uuid' });
      (os.hostname as jest.Mock).mockReturnValue('test-machine');

      const firstCall = await service.generateHardwareId();
      const secondCall = await service.generateHardwareId();

      // Should be the same
      expect(firstCall).toBe(secondCall);

      // Machine ID should only be called once (cached)
      expect(machineIdSync).toHaveBeenCalledTimes(1);
    });

    test('should handle missing machine ID gracefully', async () => {
      // Machine ID throws error
      (machineIdSync as jest.Mock).mockImplementation(() => {
        throw new Error('Machine ID not available');
      });

      // Other factors available
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        'Ethernet': [{ address: '00:11:22:33:44:55', mac: '00:11:22:33:44:55', internal: false }],
      });
      (si.cpu as jest.Mock).mockResolvedValue({ brand: 'Intel Core i7' });
      (si.system as jest.Mock).mockResolvedValue({ uuid: 'test-uuid' });
      (os.hostname as jest.Mock).mockReturnValue('test-machine');

      const hardwareId = await service.generateHardwareId();

      // Should still generate ID using other factors
      expect(hardwareId).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle missing MAC address gracefully', async () => {
      (machineIdSync as jest.Mock).mockReturnValue('test-machine-id');

      // No network interfaces
      (os.networkInterfaces as jest.Mock).mockReturnValue({});

      (si.cpu as jest.Mock).mockResolvedValue({ brand: 'Intel Core i7' });
      (si.system as jest.Mock).mockResolvedValue({ uuid: 'test-uuid' });
      (os.hostname as jest.Mock).mockReturnValue('test-machine');

      const hardwareId = await service.generateHardwareId();

      // Should still generate ID
      expect(hardwareId).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should handle all factors missing (worst case)', async () => {
      // All factors fail
      (machineIdSync as jest.Mock).mockImplementation(() => {
        throw new Error('Machine ID not available');
      });
      (os.networkInterfaces as jest.Mock).mockReturnValue({});
      (si.cpu as jest.Mock).mockRejectedValue(new Error('CPU info not available'));
      (si.system as jest.Mock).mockRejectedValue(new Error('System info not available'));
      (os.hostname as jest.Mock).mockReturnValue('unknown');

      const hardwareId = await service.generateHardwareId();

      // Should still generate a hash (from hostname at minimum)
      expect(hardwareId).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should generate different IDs for different machines', async () => {
      // First machine
      (machineIdSync as jest.Mock).mockReturnValue('machine-1');
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        'Ethernet': [{ address: '00:11:22:33:44:55', mac: '00:11:22:33:44:55', internal: false }],
      });
      (si.cpu as jest.Mock).mockResolvedValue({ brand: 'Intel Core i7' });
      (si.system as jest.Mock).mockResolvedValue({ uuid: 'uuid-1' });
      (os.hostname as jest.Mock).mockReturnValue('machine-1');

      const service1 = new HardwareIdService();
      const id1 = await service1.generateHardwareId();

      // Second machine (different hardware)
      (machineIdSync as jest.Mock).mockReturnValue('machine-2');
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        'Ethernet': [{ address: 'AA:BB:CC:DD:EE:FF', mac: 'AA:BB:CC:DD:EE:FF', internal: false }],
      });
      (si.cpu as jest.Mock).mockResolvedValue({ brand: 'AMD Ryzen 5' });
      (si.system as jest.Mock).mockResolvedValue({ uuid: 'uuid-2' });
      (os.hostname as jest.Mock).mockReturnValue('machine-2');

      const service2 = new HardwareIdService();
      const id2 = await service2.generateHardwareId();

      // IDs should be different
      expect(id1).not.toBe(id2);
    });
  });

  describe('getHardwareInfo', () => {
    test('should return detailed hardware information', async () => {
      (machineIdSync as jest.Mock).mockReturnValue('test-machine-id-123');
      (os.networkInterfaces as jest.Mock).mockReturnValue({
        'Ethernet': [{ address: '00:11:22:33:44:55', mac: '00:11:22:33:44:55', internal: false }],
      });
      (si.cpu as jest.Mock).mockResolvedValue({
        manufacturer: 'Intel',
        brand: 'Core i7-1234',
        cores: 8,
      });
      (si.system as jest.Mock).mockResolvedValue({
        uuid: 'test-system-uuid',
      });
      (os.hostname as jest.Mock).mockReturnValue('test-machine');

      const info = await service.getHardwareInfo();

      expect(info).toEqual({
        machineId: 'test-machine-id-123',
        macAddress: '00:11:22:33:44:55',
        cpu: 'Intel Core i7-1234 (8 cores)',
        systemUuid: 'test-system-uuid',
        hostname: 'test-machine',
      });
    });

    test('should handle missing CPU info', async () => {
      (machineIdSync as jest.Mock).mockReturnValue('test-machine-id');
      (os.networkInterfaces as jest.Mock).mockReturnValue({});
      (si.cpu as jest.Mock).mockRejectedValue(new Error('CPU info not available'));
      (si.system as jest.Mock).mockResolvedValue({ uuid: null });
      (os.hostname as jest.Mock).mockReturnValue('test-machine');

      const info = await service.getHardwareInfo();

      expect(info.cpu).toBe('Unknown');
      expect(info.machineId).toBe('test-machine-id');
      expect(info.hostname).toBe('test-machine');
    });
  });
});
