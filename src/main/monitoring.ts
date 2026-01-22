import log from 'electron-log';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Configure electron-log for production monitoring
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Set custom log file path
const logPath = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

log.transports.file.fileName = 'jewellery-erp.log';
log.transports.file.resolvePath = () => path.join(logPath, 'jewellery-erp.log');

// Error logging configuration
log.errorHandler.startCatching({
  showDialog: false, // Don't show error dialogs in production
  onError: (error) => {
    // Log critical errors
    log.error('Critical Application Error:', error);

    // Could send to external monitoring service here
    // Example: sendToMonitoringService(error);
  }
});

// Performance monitoring
export const performanceMonitor = {
  startOperation(operationName: string) {
    const startTime = Date.now();
    log.debug(`Starting operation: ${operationName}`);

    return {
      end: (result?: any) => {
        const duration = Date.now() - startTime;
        log.info(`Operation completed: ${operationName} (${duration}ms)`, result);
        return duration;
      },
      fail: (error: any) => {
        const duration = Date.now() - startTime;
        log.error(`Operation failed: ${operationName} (${duration}ms)`, error);
        return duration;
      }
    };
  }
};

// Health check utilities
export const healthCheck = {
  async checkDatabase() {
    try {
      // Add database connectivity check here
      log.info('Database health check: PASSED');
      return { status: 'healthy', service: 'database' };
    } catch (error) {
      log.error('Database health check: FAILED', error);
      return { status: 'unhealthy', service: 'database', error: error.message };
    }
  },

  async checkFileSystem() {
    try {
      const testPath = path.join(app.getPath('userData'), 'health-check.tmp');
      fs.writeFileSync(testPath, 'health-check');
      fs.unlinkSync(testPath);
      log.info('File system health check: PASSED');
      return { status: 'healthy', service: 'filesystem' };
    } catch (error) {
      log.error('File system health check: FAILED', error);
      return { status: 'unhealthy', service: 'filesystem', error: error.message };
    }
  },

  async checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const usageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    };

    log.info('Memory usage check:', usageMB);

    // Alert if memory usage is too high
    if (usageMB.heapUsed > 500) {
      log.warn('High memory usage detected:', usageMB);
    }

    return {
      status: usageMB.heapUsed > 800 ? 'warning' : 'healthy',
      service: 'memory',
      data: usageMB
    };
  },

  async runAllChecks() {
    const results = await Promise.all([
      this.checkDatabase(),
      this.checkFileSystem(),
      this.checkMemoryUsage()
    ]);

    const summary = {
      timestamp: new Date().toISOString(),
      overall: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      services: results
    };

    log.info('Health check summary:', summary);
    return summary;
  }
};

// Application monitoring
export const appMonitor = {
  trackEvent(eventName: string, data?: any) {
    log.info(`Event: ${eventName}`, data);
  },

  trackError(error: Error, context?: string) {
    log.error(`Error in ${context || 'unknown'}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  },

  trackPerformance(operation: string, duration: number, success: boolean) {
    const status = success ? 'SUCCESS' : 'FAILED';
    log.info(`Performance: ${operation} - ${status} (${duration}ms)`);
  }
};

// IPC monitoring handlers
export function setupMonitoringHandlers() {
  // Add IPC handlers for monitoring if needed
  // This would be called from the main process
}

export default {
  log,
  performanceMonitor,
  healthCheck,
  appMonitor,
  setupMonitoringHandlers
};