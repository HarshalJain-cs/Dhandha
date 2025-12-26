import { ipcMain } from 'electron';
import { NotificationService } from '../services/notificationService';

export function setupNotificationHandlers(): void {
  ipcMain.handle('notification:getAll', async (event, userId, filters) => {
    return await NotificationService.getUserNotifications(userId, filters);
  });

  ipcMain.handle('notification:markAsRead', async (event, notificationId) => {
    return await NotificationService.markAsRead(notificationId);
  });

  ipcMain.handle('notification:markAllAsRead', async (event, userId) => {
    return await NotificationService.markAllAsRead(userId);
  });

  ipcMain.handle('notification:delete', async (event, notificationId) => {
    return await NotificationService.deleteNotification(notificationId);
  });
}
