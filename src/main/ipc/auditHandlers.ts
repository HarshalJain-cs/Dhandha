import { ipcMain } from 'electron';
import { AuditService } from '../services/auditService';

export function setupAuditHandlers(): void {
  ipcMain.handle('audit:getAll', async (event, filters, pagination) => {
    return await AuditService.getAuditLogs(filters, pagination);
  });

  ipcMain.handle('audit:getEntityHistory', async (event, entityType, entityId) => {
    return await AuditService.getEntityHistory(entityType, entityId);
  });

  ipcMain.handle('audit:getUserActivity', async (event, userId, dateRange) => {
    return await AuditService.getUserActivity(userId, dateRange);
  });
}
