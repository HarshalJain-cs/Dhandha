// @ts-nocheck
import Quotation from '../database/models/Quotation';
import QuotationItem from '../database/models/QuotationItem';
import Invoice from '../database/models/Invoice';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

export class QuotationService {
  static async createQuotation(data: any, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      // Generate quotation number
      const lastQuotation = await Quotation.findOne({ order: [['quotation_id', 'DESC']] });
      const lastNumber = lastQuotation ? lastQuotation.quotation_id : 0;
      data.quotation_number = `QUO${String(lastNumber + 1).padStart(6, '0')}`;
      data.created_by = userId;
      data.quotation_date = new Date();
      data.status = 'pending';

      const quotation = await Quotation.create(data, { transaction });

      // Create quotation items
      if (data.items && data.items.length > 0) {
        const items = data.items.map((item: any) => ({
          ...item,
          quotation_id: quotation.quotation_id,
        }));
        await QuotationItem.bulkCreate(items, { transaction });
      }

      await transaction.commit();
      return { success: true, data: quotation, message: 'Quotation created successfully' };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async getAllQuotations(filters: any = {}, pagination: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const where: any = {};

      if (filters.status) where.status = filters.status;
      if (filters.customer_id) where.customer_id = filters.customer_id;
      if (filters.start_date && filters.end_date) {
        where.quotation_date = { [Op.between]: [filters.start_date, filters.end_date] };
      }

      const { count, rows } = await Quotation.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [['quotation_date', 'DESC']],
        include: [{ model: QuotationItem, as: 'items' }],
      });

      return {
        success: true,
        data: {
          quotations: rows,
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

  static async getQuotationById(id: number): Promise<any> {
    try {
      const quotation = await Quotation.findByPk(id, {
        include: [{ model: QuotationItem, as: 'items' }],
      });
      if (!quotation) return { success: false, message: 'Quotation not found' };
      return { success: true, data: quotation };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async updateQuotation(id: number, data: any, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const quotation = await Quotation.findByPk(id);
      if (!quotation) return { success: false, message: 'Quotation not found' };

      data.updated_by = userId;
      await quotation.update(data, { transaction });

      // Update items if provided
      if (data.items) {
        await QuotationItem.destroy({ where: { quotation_id: id }, transaction });
        const items = data.items.map((item: any) => ({
          ...item,
          quotation_id: id,
        }));
        await QuotationItem.bulkCreate(items, { transaction });
      }

      await transaction.commit();
      return { success: true, data: quotation, message: 'Quotation updated successfully' };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async convertToInvoice(quotationId: number, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const quotation = await Quotation.findByPk(quotationId, {
        include: [{ model: QuotationItem, as: 'items' }],
      });

      if (!quotation) return { success: false, message: 'Quotation not found' };
      if (quotation.status === 'converted')
        return { success: false, message: 'Quotation already converted' };

      // Create invoice from quotation
      const invoiceData = {
        customer_id: quotation.customer_id,
        invoice_date: new Date(),
        subtotal: quotation.subtotal,
        discount_percentage: quotation.discount_percentage,
        discount_amount: quotation.discount_amount,
        total_tax: quotation.total_tax,
        grand_total: quotation.grand_total,
        created_by: userId,
      };

      const invoice = await Invoice.create(invoiceData, { transaction });

      // Update quotation status
      await quotation.update(
        {
          status: 'converted',
          converted_invoice_id: invoice.invoice_id,
        },
        { transaction }
      );

      await transaction.commit();
      return {
        success: true,
        data: { quotation, invoice },
        message: 'Quotation converted to invoice successfully',
      };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async updateStatus(id: number, status: string, userId: number): Promise<any> {
    try {
      const quotation = await Quotation.findByPk(id);
      if (!quotation) return { success: false, message: 'Quotation not found' };

      await quotation.update({ status, updated_by: userId });
      return { success: true, data: quotation, message: 'Status updated successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getQuotationStats(): Promise<any> {
    try {
      const totalQuotations = await Quotation.count();
      const pendingQuotations = await Quotation.count({ where: { status: 'pending' } });
      const acceptedQuotations = await Quotation.count({ where: { status: 'accepted' } });
      const convertedQuotations = await Quotation.count({ where: { status: 'converted' } });

      const totalValue = await Quotation.sum('grand_total');

      return {
        success: true,
        data: {
          totalQuotations,
          pendingQuotations,
          acceptedQuotations,
          convertedQuotations,
          totalValue: totalValue || 0,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
