import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { spawn, ChildProcess } from 'child_process';
import log from 'electron-log';
import crypto from 'crypto';

/**
 * PostgreSQL Configuration
 */
interface PostgresConfig {
  port: number;
  dataDir: string;
  binDir: string;
  password: string;
}

/**
 * PostgreSQL Service
 * Manages portable PostgreSQL bundled with the Electron app
 */
class PostgresService {
  private process: ChildProcess | null = null;
  private config: PostgresConfig | null = null;
  private isRunning = false;
  private stdoutListener: ((data: Buffer) => void) | null = null;
  private stderrListener: ((data: Buffer) => void) | null = null;

  /**
   * Get platform-specific binary path
   * Adds .exe extension on Windows
   * NOTE: Requires initConfig() to have been called first
   */
  private getBinaryPath(binary: string): string {
    if (!this.config) {
      throw new Error('PostgresService not initialized. Call initConfig() first.');
    }
    const extension = process.platform === 'win32' ? '.exe' : '';
    return path.join(this.config.binDir, `${binary}${extension}`);
  }

  /**
   * Clean up event listeners to prevent EPIPE errors
   * Removes stdout/stderr listeners before process termination
   */
  private cleanupListeners(): void {
    if (this.process) {
      if (this.stdoutListener) {
        this.process.stdout?.removeListener('data', this.stdoutListener);
        this.stdoutListener = null;
      }
      if (this.stderrListener) {
        this.process.stderr?.removeListener('data', this.stderrListener);
        this.stderrListener = null;
      }
    }
  }

  /**
   * Lazy initialization of config - called when first needed
   */
  private initConfig(): void {
    if (this.config) {
      return; // Already initialized
    }

    const isProd = app.isPackaged;
    const appPath = isProd ? process.resourcesPath : app.getAppPath();

    this.config = {
      port: 54320, // Non-standard port to avoid conflicts
      dataDir: path.join(app.getPath('userData'), 'postgres-data'),
      binDir: path.join(appPath, 'postgres', 'bin'),
      password: this.generateSecurePassword(),
    };

    log.info('PostgreSQL config:', {
      port: this.config.port,
      dataDir: this.config.dataDir,
      binDir: this.config.binDir,
    });
  }

  /**
   * Initialize PostgreSQL - create data directory if first run
   */
  async init(): Promise<void> {
    this.initConfig();

    // Validate PostgreSQL binaries exist
    const binaries = ['postgres', 'initdb', 'pg_ctl'];
    for (const bin of binaries) {
      const binPath = this.getBinaryPath(bin);
      if (!fs.existsSync(binPath)) {
        const error = new Error(
          `PostgreSQL binary not found: ${binPath}\n` +
          `Please ensure PostgreSQL binaries are bundled in postgres/bin/`
        );
        log.error('Binary validation failed:', error.message);
        throw error;
      }
    }
    log.info('PostgreSQL binaries validated successfully');

    try {
      const dataExists = await this.checkDataDirectory();

      if (!dataExists) {
        log.info('First run - initializing PostgreSQL data directory');
        await this.initDatabase();
      }

      await this.start();
    } catch (error) {
      log.error('PostgreSQL initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if data directory exists
   */
  private async checkDataDirectory(): Promise<boolean> {
    try {
      await fsp.access(this.config!.dataDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize PostgreSQL data directory (first run only)
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const initdb = this.getBinaryPath('initdb');
      const pwFile = path.join(this.config!.dataDir, '..', 'pgpass.tmp');

      log.info('Running initdb:', initdb);

      // Create temporary password file
      fs.writeFileSync(pwFile, this.config!.password);

      const initProcess = spawn(initdb, [
        '-D',
        this.config!.dataDir,
        '-U',
        'postgres',
        `--pwfile=${pwFile}`,
        '--encoding=UTF8',
        '--locale=C',
        '--data-checksums',
      ]);

      let output = '';
      let errorOutput = '';

      initProcess.stdout?.on('data', (data) => {
        output += data.toString();
        log.info(`initdb stdout: ${data}`);
      });

      initProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
        log.info(`initdb stderr: ${data}`);
      });

      initProcess.on('close', (code) => {
        // Delete temporary password file
        try {
          fs.unlinkSync(pwFile);
        } catch (e) {
          log.warn('Failed to delete temporary password file:', e);
        }

        if (code === 0) {
          log.info('PostgreSQL data directory initialized successfully');
          resolve();
        } else {
          log.error('initdb failed with code:', code);
          log.error('initdb output:', output);
          log.error('initdb error:', errorOutput);
          reject(new Error(`initdb exited with code ${code}: ${errorOutput}`));
        }
      });

      initProcess.on('error', (error) => {
        // Delete temporary password file on error
        try {
          fs.unlinkSync(pwFile);
        } catch (e) {
          // Ignore
        }
        log.error('Failed to spawn initdb:', error);
        reject(error);
      });
    });
  }

  /**
   * Start PostgreSQL server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      log.warn('PostgreSQL already running');
      return;
    }

    return new Promise((resolve, reject) => {
      const postgres = this.getBinaryPath('postgres');

      log.info('Starting PostgreSQL:', postgres);

      this.process = spawn(postgres, [
        '-D',
        this.config!.dataDir,
        '-p',
        this.config!.port.toString(),
        '-h',
        'localhost',
      ]);

      let startupOutput = '';

      // Create and store stdout listener
      this.stdoutListener = (data: Buffer) => {
        const output = data.toString();
        startupOutput += output;
        log.info(`PostgreSQL: ${output.trim()}`);

        // Check for successful startup message
        if (output.includes('ready to accept connections')) {
          this.isRunning = true;
          log.info('PostgreSQL started successfully');
          resolve();
        }
      };

      // Create and store stderr listener
      this.stderrListener = (data: Buffer) => {
        const output = data.toString();
        startupOutput += output;
        log.info(`PostgreSQL: ${output.trim()}`);

        // PostgreSQL outputs startup messages to stderr
        if (output.includes('ready to accept connections')) {
          this.isRunning = true;
          log.info('PostgreSQL started successfully');
          resolve();
        }
      };

      // Attach stored listeners
      this.process.stdout?.on('data', this.stdoutListener);
      this.process.stderr?.on('data', this.stderrListener);

      this.process.on('close', (code) => {
        this.cleanupListeners(); // Clean up listeners before process is set to null
        log.info(`PostgreSQL exited with code ${code}`);
        this.isRunning = false;
        this.process = null;
      });

      this.process.on('error', (error) => {
        log.error('Failed to spawn PostgreSQL:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.isRunning) {
          log.error('PostgreSQL failed to start within 30 seconds');
          log.error('Startup output:', startupOutput);
          reject(new Error('PostgreSQL failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }

  /**
   * Stop PostgreSQL server gracefully
   */
  async stop(): Promise<void> {
    if (!this.process || !this.isRunning) {
      log.info('PostgreSQL not running, nothing to stop');
      return;
    }

    return new Promise((resolve) => {
      const pg_ctl = this.getBinaryPath('pg_ctl');

      log.info('Stopping PostgreSQL gracefully');

      const stopProcess = spawn(pg_ctl, [
        'stop',
        '-D',
        this.config!.dataDir,
        '-m',
        'fast',
      ]);

      stopProcess.on('close', (code) => {
        log.info(`pg_ctl stop exited with code ${code}`);
        this.isRunning = false;
        this.process = null;
        resolve();
      });

      stopProcess.on('error', (error) => {
        log.error('pg_ctl stop failed:', error);
        // Force kill after error
        if (this.process) {
          this.cleanupListeners(); // Clean up before killing
          this.process.kill('SIGTERM'); // Use SIGTERM for graceful shutdown
        }
        this.isRunning = false;
        this.process = null;
        resolve();
      });

      // Force kill after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        if (this.isRunning && this.process) {
          log.warn('Force killing PostgreSQL after timeout');
          this.cleanupListeners(); // Clean up before killing
          this.process.kill('SIGKILL'); // Use SIGKILL as last resort
          this.isRunning = false;
          this.process = null;
        }
        resolve();
      }, 10000);
    });
  }

  /**
   * Get connection string for Sequelize
   */
  getConnectionString(): string {
    this.initConfig();
    return `postgres://postgres:${this.config!.password}@localhost:${this.config!.port}/jewellery_erp`;
  }

  /**
   * Get connection config object
   */
  getConnectionConfig() {
    this.initConfig();
    return {
      host: 'localhost',
      port: this.config!.port,
      database: 'jewellery_erp',
      username: 'postgres',
      password: this.config!.password,
    };
  }

  /**
   * Generate secure random password
   */
  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Check if PostgreSQL is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export default new PostgresService();
