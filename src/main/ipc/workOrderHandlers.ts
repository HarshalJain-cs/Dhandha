import { ipcMain } from 'electron';
import { Op } from 'sequelize';
import WorkOrder from '../models/WorkOrder';
import WorkOrderPayment from '../models/WorkOrderPayment';
import Karigar from '../models/Karigar';
import { sequelize } from '../database/connection';

export function setupWorkOrderHandlers() {
  // Generate work order number
  ipcMain.handle('workOrder:generateNumber', async () => {
    try {
      const lastOrder = await WorkOrder.findOne({
        order: [['id', 'DESC']],
      });
      
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const lastNumber = lastOrder ? parseInt(lastOrder.workOrderNumber.split('-')[1]) : 0;
      const newNumber = `WO-${(lastNumber + 1).toString().padStart(6, '0')}-${currentYear}`;
      
      return { success: true, data: newNumber };
    } catch (error) {
      console.error('Error generating work order number:', error);
      return { success: false, error: 'Failed to generate work order number' };
    }
  });

  // Get all work orders
  ipcMain.handle('workOrder:getAll', async (event, filters?) => {
    try {
      const where: any = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.karigarId) {
        where.karigarId = filters.karigarId;
      }
      
      if (filters?.startDate && filters?.endDate) {
        where.issueDate = {
          [Op.between]: [filters.startDate, filters.endDate],
        };
      }
      
      const workOrders = await WorkOrder.findAll({
        where,
        include: [
          {
            model: Karigar,
            as: 'karigar',
            attributes: ['id', 'name', 'contactNumber', 'specialization'],
          },
          {
            model: WorkOrderPayment,
            as: 'payments',
          },
        ],
        order: [['issueDate', 'DESC']],
      });
      
      return { success: true, data: workOrders };
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return { success: false, error: 'Failed to fetch work orders' };
    }
  });

  // Get work order by ID
  ipcMain.handle('workOrder:getById', async (event, id: number) => {
    try {
      const workOrder = await WorkOrder.findByPk(id, {
        include: [
          {
            model: Karigar,
            as: 'karigar',
          },
          {
            model: WorkOrderPayment,
            as: 'payments',
            order: [['paymentDate', 'DESC']],
          },
        ],
      });
      
      if (!workOrder) {
        return { success: false, error: 'Work order not found' };
      }
      
      return { success: true, data: workOrder };
    } catch (error) {
      console.error('Error fetching work order:', error);
      return { success: false, error: 'Failed to fetch work order' };
    }
  });

  // Create work order
  ipcMain.handle('workOrder:create', async (event, workOrderData) => {
    try {
      const workOrder = await WorkOrder.create(workOrderData);
      return { success: true, data: workOrder };
    } catch (error) {
      console.error('Error creating work order:', error);
      return { success: false, error: 'Failed to create work order' };
    }
  });

  // Update work order
  ipcMain.handle('workOrder:update', async (event, id: number, workOrderData) => {
    try {
      const workOrder = await WorkOrder.findByPk(id);
      
      if (!workOrder) {
        return { success: false, error: 'Work order not found' };
      }
      
      await workOrder.update(workOrderData);
      return { success: true, data: workOrder };
    } catch (error) {
      console.error('Error updating work order:', error);
      return { success: false, error: 'Failed to update work order' };
    }
  });

  // Add payment to work order
  ipcMain.handle('workOrder:addPayment', async (event, paymentData) => {
    const transaction = await sequelize.transaction();
    
    try {
      const workOrder = await WorkOrder.findByPk(paymentData.workOrderId, { transaction });
      
      if (!workOrder) {
        await transaction.rollback();
        return { success: false, error: 'Work order not found' };
      }
      
      // Create payment
      const payment = await WorkOrderPayment.create(paymentData, { transaction });
      
      // Update work order balance
      const newBalance = parseFloat(workOrder.balanceAmount.toString()) - parseFloat(paymentData.amount);
      await workOrder.update({ balanceAmount: newBalance }, { transaction });
      
      await transaction.commit();
      return { success: true, data: { payment, workOrder } };
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding payment:', error);
      return { success: false, error: 'Failed to add payment' };
    }
  });

  // Get work order summary
  ipcMain.handle('workOrder:getSummary', async (event, filters?) => {
    try {
      const where: any = {};
      
      if (filters?.startDate && filters?.endDate) {
        where.issueDate = {
          [Op.between]: [filters.startDate, filters.endDate],
        };
      }
      
      const summary = await WorkOrder.findAll({
        where,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('grossWeight')), 'totalGrossWeight'],
          [sequelize.fn('SUM', sequelize.col('netWeight')), 'totalNetWeight'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
          [sequelize.fn('SUM', sequelize.col('balanceAmount')), 'totalBalance'],
        ],
        group: ['status'],
        raw: true,
      });
      
      return { success: true, data: summary };
    } catch (error) {
      console.error('Error fetching work order summary:', error);
      return { success: false, error: 'Failed to fetch summary' };
    }
  });

  // Get overdue work orders
  ipcMain.handle('workOrder:getOverdue', async () => {
    try {
      const today = new Date();
      
      const overdueOrders = await WorkOrder.findAll({
        where: {
          status: {
            [Op.in]: ['PENDING', 'IN_PROGRESS'],
          },
          expectedDeliveryDate: {
            [Op.lt]: today,
          },
        },
        include: [
          {
            model: Karigar,
            as: 'karigar',
            attributes: ['id', 'name', 'contactNumber'],
          },
        ],
        order: [['expectedDeliveryDate', 'ASC']],
      });
      
      return { success: true, data: overdueOrders };
    } catch (error) {
      console.error('Error fetching overdue work orders:', error);
      return { success: false, error: 'Failed to fetch overdue work orders' };
    }
  });
}
