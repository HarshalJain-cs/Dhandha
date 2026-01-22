import { ipcMain } from 'electron';
import { healthCheck, appMonitor, performanceMonitor } from '../monitoring';

export function setupMonitoringHandlers() {
  // Health check endpoint
  ipcMain.handle('monitoring:health-check', async () => {
    const monitor = performanceMonitor.startOperation('health-check');

    try {
      const result = await healthCheck.runAllChecks();
      monitor.end(result);
      return result;
    } catch (error) {
      monitor.fail(error);
      return {
        timestamp: new Date().toISOString(),
        overall: 'error',
        error: error.message
      };
    }
  });

  // Application metrics endpoint
  ipcMain.handle('monitoring:app-metrics', async () => {
    const monitor = performanceMonitor.startOperation('app-metrics');

    try {
      const metrics = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      };

      monitor.end(metrics);
      return metrics;
    } catch (error) {
      monitor.fail(error);
      return { error: error.message };
    }
  });

  // Error reporting endpoint
  ipcMain.handle('monitoring:report-error', async (event, errorData) => {
    try {
      appMonitor.trackError(new Error(errorData.message), errorData.context);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Performance tracking endpoint
  ipcMain.handle('monitoring:track-performance', async (event, data) => {
    try {
      appMonitor.trackPerformance(data.operation, data.duration, data.success);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}