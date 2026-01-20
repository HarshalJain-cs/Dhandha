import { ipcMain } from 'electron';
import { Op } from 'sequelize';
import log from 'electron-log';
import { ListResponse, DetailResponse, CreateResponse, UpdateResponse, DeleteResponse, FilterParams } from '../../shared/types';
import Karigar from '../models/Karigar';
import WorkOrder from '../models/WorkOrder';
import WorkOrderPayment from '../models/WorkOrderPayment';
import { sequelize } from '../database/connection';

export function setupKarigarHandlers() {
  // Get all karigars
  ipcMain.handle('karigar:getAll', async (_event, filters?: FilterParams): Promise<ListResponse<any>> => {
    try {
      const whereClause: any = { is_active: true };
      if (filters?.is_active !== undefined) {
        whereClause.is_active = filters.is_active;
      }
      if (filters?.status) {
        // Add status filtering if needed
      }

      const karigars = await Karigar.findAll({
        where: whereClause,
        order: [['name', 'ASC']],
      });
      return { success: true, data: karigars };
    } catch (error) {
      log.error('Error fetching karigars:', error);
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
      log.error('Error fetching active karigars:', error);
      return { success: false, error: 'Failed to fetch active karigars' };
    }
  });

  // Get karigar by ID
  ipcMain.handle('karigar:getById', async (_event, id: number): Promise<DetailResponse<any>> => {
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
      log.error('Error fetching karigar:', error);
      return { success: false, error: 'Failed to fetch karigar' };
    }
  });

  // Create karigar
  ipcMain.handle('karigar:create', async (_event, karigarData: any): Promise<CreateResponse<any>> => {
    try {
      const karigar = await Karigar.create(karigarData);
      return { success: true, data: karigar };
    } catch (error) {
      log.error('Error creating karigar:', error);
      return { success: false, error: 'Failed to create karigar' };
    }
  });

  // Update karigar
  ipcMain.handle('karigar:update', async (_event, id: number, karigarData: any): Promise<UpdateResponse<any>> => {
    try {
      const karigar = await Karigar.findByPk(id);
      
      if (!karigar) {
        return { success: false, error: 'Karigar not found' };
      }
      
      await karigar.update(karigarData);
      return { success: true, data: karigar };
    } catch (error) {
      log.error('Error updating karigar:', error);
      return { success: false, error: 'Failed to update karigar' };
    }
  });

  // Delete karigar (soft delete by setting isActive to false)
  ipcMain.handle('karigar:delete', async (_event, id: number): Promise<DeleteResponse> => {
    try {
      const karigar = await Karigar.findByPk(id);
      
      if (!karigar) {
        return { success: false, error: 'Karigar not found' };
      }
      
      await karigar.update({ isActive: false });
      return { success: true, message: 'Karigar deactivated successfully' };
    } catch (error) {
      log.error('Error deleting karigar:', error);
      return { success: false, error: 'Failed to delete karigar' };
    }
  });

  // Get karigar statistics
  ipcMain.handle('karigar:getStats', async (_event, karigarId?: number): Promise<DetailResponse<any>> => {
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
      log.error('Error fetching karigar stats:', error);
      return { success: false, error: 'Failed to fetch karigar statistics' };
    }
  });
}