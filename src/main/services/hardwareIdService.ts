import { machineIdSync } from 'node-machine-id';
import * as si from 'systeminformation';
import * as crypto from 'crypto';
import * as os from 'os';

/**
 * Hardware ID Service
 * Generates a stable hardware fingerprint for license binding
 *
 * Uses multiple factors:
 * - Machine ID (OS-level unique ID)
 * - MAC address (primary network adapter)
 * - CPU information
 * - System UUID (if available)
 *
 * The hash is stable across reboots but changes if hardware changes significantly
 */

export class HardwareIdService {
  private cachedHardwareId: string | null = null;

  /**
   * Generate a stable hardware ID
   * @returns 64-character SHA-256 hash
   */
  async generateHardwareId(): Promise<string> {
    // Return cached value if available
    if (this.cachedHardwareId) {
      return this.cachedHardwareId;
    }

    try {
      const factors: string[] = [];

      // Factor 1: Machine ID (most stable, OS-level)
      try {
        const machineId = machineIdSync(true);
        factors.push(`MID:${machineId}`);
      } catch (error) {
        console.warn('Could not get machine ID:', error);
      }

      // Factor 2: Primary MAC address
      try {
        const primaryMac = this.getPrimaryMacAddress();
        if (primaryMac) {
          factors.push(`MAC:${primaryMac}`);
        }
      } catch (error) {
        console.warn('Could not get MAC address:', error);
      }

      // Factor 3: CPU information
      try {
        const cpu = await si.cpu();
        const cpuInfo = `CPU:${cpu.manufacturer}-${cpu.brand}-${cpu.cores}`;
        factors.push(cpuInfo);
      } catch (error) {
        console.warn('Could not get CPU info:', error);
      }

      // Factor 4: System UUID (motherboard)
      try {
        const system = await si.system();
        if (system.uuid && system.uuid !== '-') {
          factors.push(`UUID:${system.uuid}`);
        }
      } catch (error) {
        console.warn('Could not get system UUID:', error);
      }

      // Factor 5: Hostname (least stable, but helps)
      try {
        const hostname = os.hostname();
        factors.push(`HOST:${hostname}`);
      } catch (error) {
        console.warn('Could not get hostname:', error);
      }

      if (factors.length === 0) {
        throw new Error('Could not generate hardware ID: no factors available');
      }

      // Combine all factors and hash
      const combined = factors.join('|');
      const hash = crypto.createHash('sha256').update(combined).digest('hex');

      // Cache the result
      this.cachedHardwareId = hash;

      console.log(`✓ Generated hardware ID from ${factors.length} factors`);

      return hash;
    } catch (error) {
      console.error('Error generating hardware ID:', error);
      throw error;
    }
  }

  /**
   * Get the MAC address of the primary network adapter
   * Prioritizes non-internal, active adapters
   */
  private getPrimaryMacAddress(): string | null {
    const interfaces = os.networkInterfaces();

    // Priority 1: Non-internal, active Ethernet adapter
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      for (const addr of addrs) {
        if (
          !addr.internal &&
          addr.mac &&
          addr.mac !== '00:00:00:00:00:00' &&
          (name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('eth'))
        ) {
          return addr.mac;
        }
      }
    }

    // Priority 2: Non-internal, active WiFi adapter
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      for (const addr of addrs) {
        if (
          !addr.internal &&
          addr.mac &&
          addr.mac !== '00:00:00:00:00:00' &&
          (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan'))
        ) {
          return addr.mac;
        }
      }
    }

    // Priority 3: Any non-internal adapter
    for (const [_, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;

      for (const addr of addrs) {
        if (
          !addr.internal &&
          addr.mac &&
          addr.mac !== '00:00:00:00:00:00'
        ) {
          return addr.mac;
        }
      }
    }

    return null;
  }

  /**
   * Get hardware information for display/debugging
   */
  async getHardwareInfo(): Promise<{
    machineId: string;
    macAddress: string | null;
    cpu: string;
    systemUuid: string | null;
    hostname: string;
  }> {
    const machineId = machineIdSync(true);
    const macAddress = this.getPrimaryMacAddress();
    const hostname = os.hostname();

    let cpuInfo = 'Unknown';
    let systemUuid: string | null = null;

    try {
      const cpu = await si.cpu();
      cpuInfo = `${cpu.manufacturer} ${cpu.brand} (${cpu.cores} cores)`;
    } catch {
      // Ignore
    }

    try {
      const system = await si.system();
      systemUuid = system.uuid && system.uuid !== '-' ? system.uuid : null;
    } catch {
      // Ignore
    }

    return {
      machineId,
      macAddress,
      cpu: cpuInfo,
      systemUuid,
      hostname,
    };
  }

  /**
   * Clear cached hardware ID (useful for testing)
   */
  clearCache(): void {
    this.cachedHardwareId = null;
  }
}

// Export singleton instance
export default new HardwareIdService();
