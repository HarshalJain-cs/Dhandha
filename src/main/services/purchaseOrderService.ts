import PurchaseOrder from '../database/models/PurchaseOrder';
import Vendor from '../database/models/Vendor';
import MetalType from '../database/models/MetalType';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

export class PurchaseOrderService {
  static async createPurchaseOrder(data: any, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      // Generate PO number
      const lastPO = await PurchaseOrder.findOne({ order: [['purchase_order_id', 'DESC']] });
      const lastNumber = lastPO ? lastPO.purchase_order_id : 0;
      data.po_number = `PO${String(lastNumber + 1).padStart(6, '0')}`;
      data.created_by = userId;
      data.po_date = data.po_date || new Date();

      const purchaseOrder = await PurchaseOrder.create(data, { transaction });
      await transaction.commit();
      return { success: true, data: purchaseOrder, message: 'Purchase order created successfully' };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async getAllPurchaseOrders(filters: any = {}, pagination: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.vendor_id) where.vendor_id = filters.vendor_id;
      if (filters.date_from && filters.date_to) {
        where.po_date = { [Op.between]: [filters.date_from, filters.date_to] };
      }

      const { count, rows } = await PurchaseOrder.findAndCountAll({
        where,
        include: [
          { model: Vendor, as: 'vendor' },
          { model: MetalType, as: 'metalType' },
        ],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
      });

      return {
        success: true,
        data: {
          purchaseOrders: rows,
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getPurchaseOrderById(id: number): Promise<any> {
    try {
      const po = await PurchaseOrder.findByPk(id, {
        include: [
          { model: Vendor, as: 'vendor' },
          { model: MetalType, as: 'metalType' },
        ],
      });
      if (!po) return { success: false, message: 'Purchase order not found' };
      return { success: true, data: po };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async receivePurchaseOrder(id: number, receivedQty: number, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const po = await PurchaseOrder.findByPk(id);
      if (!po) return { success: false, message: 'Purchase order not found' };

      const newReceivedQty = Number(po.received_quantity) + Number(receivedQty);
      const status = newReceivedQty >= Number(po.quantity) ? 'received' : 'partial';

      await po.update(
        { received_quantity: newReceivedQty, status, updated_by: userId },
        { transaction }
      );

      await transaction.commit();
      return { success: true, data: po, message: 'Purchase order received successfully' };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async cancelPurchaseOrder(id: number, reason: string, userId: number): Promise<any> {
    try {
      const po = await PurchaseOrder.findByPk(id);
      if (!po) return { success: false, message: 'Purchase order not found' };

      await po.update({ status: 'cancelled', notes: reason, updated_by: userId });
      return { success: true, data: po, message: 'Purchase order cancelled' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getPurchaseOrderStats(): Promise<any> {
    try {
      const stats = await PurchaseOrder.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('purchase_order_id')), 'total_pos'],
          [
            sequelize.fn(
              'COUNT',
              sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")
            ),
            'pending_pos',
          ],
          [
            sequelize.fn(
              'COUNT',
              sequelize.literal("CASE WHEN status = 'received' THEN 1 END")
            ),
            'received_pos',
          ],
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total_value'],
        ],
        raw: true,
      });

      return { success: true, data: stats[0] };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
