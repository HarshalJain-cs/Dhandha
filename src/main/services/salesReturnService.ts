import SalesReturn from '../database/models/SalesReturn';
import Invoice from '../database/models/Invoice';
import Product from '../database/models/Product';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

export class SalesReturnService {
  static async createReturn(returnData: any, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      // Generate return number
      const lastReturn = await SalesReturn.findOne({ order: [['return_id', 'DESC']] });
      const lastNumber = lastReturn ? lastReturn.return_id : 0;
      returnData.return_number = `RET${String(lastNumber + 1).padStart(6, '0')}`;
      returnData.created_by = userId;
      returnData.return_date = new Date();
      returnData.status = 'pending';

      const salesReturn = await SalesReturn.create(returnData, { transaction });

      // Mark original invoice as has_return
      await Invoice.update(
        { has_return: true },
        { where: { invoice_id: returnData.original_invoice_id }, transaction }
      );

      await transaction.commit();
      return { success: true, data: salesReturn, message: 'Sales return created successfully' };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async approveReturn(returnId: number, approvedBy: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const salesReturn = await SalesReturn.findByPk(returnId, {
        include: [{ model: Invoice, as: 'originalInvoice' }],
      });

      if (!salesReturn) return { success: false, message: 'Sales return not found' };
      if (salesReturn.status !== 'pending')
        return { success: false, message: 'Return is not in pending status' };

      // Approve the return
      await salesReturn.update(
        {
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date(),
        },
        { transaction }
      );

      // Restore product stock if applicable
      const invoice: any = salesReturn.get('originalInvoice');
      if (invoice && invoice.product_id) {
        await Product.update(
          {
            current_stock: sequelize.literal('current_stock + 1'),
            status: 'active',
          },
          { where: { product_id: invoice.product_id }, transaction }
        );
      }

      await transaction.commit();
      return { success: true, data: salesReturn, message: 'Return approved successfully' };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async processExchange(returnId: number, newInvoiceData: any, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const salesReturn = await SalesReturn.findByPk(returnId);
      if (!salesReturn) return { success: false, message: 'Sales return not found' };
      if (salesReturn.return_type !== 'exchange')
        return { success: false, message: 'This is not an exchange return' };

      // Create new invoice for exchange
      const newInvoice = await Invoice.create(
        { ...newInvoiceData, created_by: userId },
        { transaction }
      );

      // Update return with exchange invoice
      await salesReturn.update(
        {
          exchange_invoice_id: newInvoice.invoice_id,
          status: 'completed',
        },
        { transaction }
      );

      await transaction.commit();
      return {
        success: true,
        data: { salesReturn, newInvoice },
        message: 'Exchange processed successfully',
      };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async getAllReturns(filters: any = {}, pagination: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.return_type) where.return_type = filters.return_type;
      if (filters.customer_id) where.customer_id = filters.customer_id;
      if (filters.start_date && filters.end_date) {
        where.return_date = { [Op.between]: [filters.start_date, filters.end_date] };
      }

      const { count, rows } = await SalesReturn.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [['return_date', 'DESC']],
        include: [
          { model: Invoice, as: 'originalInvoice' },
          { model: Invoice, as: 'exchangeInvoice' },
        ],
      });

      return {
        success: true,
        data: {
          returns: rows,
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

  static async getReturnById(id: number): Promise<any> {
    try {
      const salesReturn = await SalesReturn.findByPk(id, {
        include: [
          { model: Invoice, as: 'originalInvoice' },
          { model: Invoice, as: 'exchangeInvoice' },
        ],
      });
      if (!salesReturn) return { success: false, message: 'Sales return not found' };
      return { success: true, data: salesReturn };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getReturnStats(): Promise<any> {
    try {
      const totalReturns = await SalesReturn.count();
      const pendingReturns = await SalesReturn.count({ where: { status: 'pending' } });
      const approvedReturns = await SalesReturn.count({ where: { status: 'approved' } });
      const completedReturns = await SalesReturn.count({ where: { status: 'completed' } });

      const totalRefundAmount = await SalesReturn.sum('refund_amount', {
        where: { status: { [Op.in]: ['approved', 'completed'] } },
      });

      return {
        success: true,
        data: {
          totalReturns,
          pendingReturns,
          approvedReturns,
          completedReturns,
          totalRefundAmount: totalRefundAmount || 0,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
