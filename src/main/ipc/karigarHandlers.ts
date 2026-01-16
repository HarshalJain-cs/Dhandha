import { ipcMain } from 'electron';
import { Op } from 'sequelize';
import Karigar from '../models/Karigar';
import WorkOrder from '../models/WorkOrder';
import WorkOrderPayment from '../models/WorkOrderPayment';
import { sequelize } from '../database/connection';

export function setupKarigarHandlers() {
  // Get all karigars
  ipcMain.handle('karigar:getAll', async () => {
    try {
      const karigars = await Karigar.findAll({
        order: [['name', 'ASC']],
      });
      return { success: true, data: karigars };
    } catch (error) {
      console.error('Error fetching karigars:', error);
      return { success: false, error: 'Failed to fetch karigars' };
    }
  });

  // Get active karigars
  ipcMain.handle('karigar:getActive', async () => {
    try {
      const karigars = await Karigar.findAll({
        where: { isActive: true },
        order: [['name', 'ASC']],
      });
      return { success: true, data: karigars };
    } catch (error) {
      console.error('Error fetching active karigars:', error);
      return { success: false, error: 'Failed to fetch active karigars' };
    }
  });

  // Get karigar by ID
  ipcMain.handle('karigar:getById', async (event, id: number) => {
    try {
      const karigar = await Karigar.findByPk(id, {
        include: [
          {
            model: WorkOrder,
            as: 'workOrders',
            include: [
              {
                model: WorkOrderPayment,
                as: 'payments',
              },
            ],
          },
        ],
      });
      
      if (!karigar) {
        return { success: false, error: 'Karigar not found' };
      }
      
      return { success: true, data: karigar };
    } catch (error) {
      console.error('Error fetching karigar:', error);
      return { success: false, error: 'Failed to fetch karigar' };
    }
  });

  // Create karigar
  ipcMain.handle('karigar:create', async (event, karigarData) => {.
    try {
      const karigar = await Karigar.create(karigarData);
      return { success: true, data: karigar };
    } catch (error) {
      console.error('Error creating karigar:', error);
      return { success: false, error: 'Failed to create karigar' };
    }
  });

  // Update karigar
  ipcMain.handle('karigar:update', async (event, id: number, karigarData) => {
    try {
      const karigar = await Karigar.findByPk(id);
      
      if (!karigar) {
        return { success: false, error: 'Karigar not found' };
      }
      
      await karigar.update(karigarData);
      return { success: true, data: karigar };
    } catch (error) {
      console.error('Error updating karigar:', error);
      return { success: false, error: 'Failed to update karigar' };
    }
  });

  // Delete karigar (soft delete by setting isActive to false)
  ipcMain.handle('karigar:delete', async (event, id: number) => {
    try {
      const karigar = await Karigar.findByPk(id);
      
      if (!karigar) {
        return { success: false, error: 'Karigar not found' };
      }
      
      await karigar.update({ isActive: false });
      return { success: true, message: 'Karigar deactivated successfully' };
    } catch (error) {
      console.error('Error deleting karigar:', error);
      return { success: false, error: 'Failed to delete karigar' };
    }
  });

  // Get karigar statistics
  ipcMain.handle('karigar:getStats', async (event, karigarId: number) => {
    try {
      const stats = await WorkOrder.findAll({
        where: { karigarId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
          [sequelize.fn('SUM', sequelize.col('balanceAmount')), 'balanceAmount'],
        ],
        group: ['status'],
        raw: true,
      });
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching karigar stats:', error);
      return { success: false, error: 'Failed to fetch karigar statistics' };
    }
  });
}