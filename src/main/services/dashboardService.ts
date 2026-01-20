import { Op } from 'sequelize';
import { sequelize } from '../database/connection';
import Invoice from '../database/models/Invoice';
import InvoiceItem from '../database/models/InvoiceItem';
import Payment from '../database/models/Payment';
import Product from '../database/models/Product';
import Category from '../database/models/Category';
import Customer from '../database/models/Customer';

interface ServiceResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Dashboard Service
 * Provides analytics and statistics for the dashboard
 */
export class DashboardService {
  /**
   * Get sales trends grouped by day, week, or month
   */
  static async getSalesTrends(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<ServiceResponse<any>> {
    try {
      const salesData = await Invoice.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('invoice_date')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'invoice_count'],
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total_sales'],
        ],
        where: {
          is_cancelled: false,
          invoice_type: 'sale',
          invoice_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [sequelize.fn('DATE', sequelize.col('invoice_date'))],
        order: [[sequelize.fn('DATE', sequelize.col('invoice_date')), 'ASC']],
        raw: true,
      });

      return {
        success: true,
        data: salesData,
      };
    } catch (error: any) {
      console.error('DashboardService.getSalesTrends error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get sales trends',
        data: [],
      };
    }
  }

  /**
   * Get product distribution by category
   */
  static async getProductDistribution(): Promise<ServiceResponse<any>> {
    try {
      const distribution = await Product.findAll({
        attributes: [
          [sequelize.col('category.category_name'), 'category'],
          [sequelize.fn('COUNT', sequelize.col('Product.id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('Product.current_stock')), 'total_stock'],
        ],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: [],
            required: true,
          },
        ],
        where: { is_active: true },
        group: ['category.id', 'category.category_name'],
        raw: true,
      });

      return {
        success: true,
        data: distribution,
      };
    } catch (error: any) {
      console.error('DashboardService.getProductDistribution error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get product distribution',
        data: [],
      };
    }
  }

  /**
   * Get top selling products by revenue
   */
  static async getTopProducts(
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const whereClause: any = {
        is_cancelled: false,
        invoice_type: 'sale',
      };

      if (startDate && endDate) {
        whereClause.invoice_date = {
          [Op.between]: [startDate, endDate],
        };
      }

      const topProducts = await InvoiceItem.findAll({
        attributes: [
          'product_id',
          'product_name',
          'category_name',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
          [sequelize.fn('SUM', sequelize.col('line_total')), 'total_revenue'],
          [sequelize.fn('COUNT', sequelize.col('invoice_id')), 'order_count'],
        ],
        include: [
          {
            model: Invoice,
            as: 'invoice',
            attributes: [],
            where: whereClause,
          },
        ],
        group: ['product_id', 'product_name', 'category_name'],
        order: [[sequelize.fn('SUM', sequelize.col('line_total')), 'DESC']],
        limit: limit,
        raw: true,
      });

      return {
        success: true,
        data: topProducts,
      };
    } catch (error: any) {
      console.error('DashboardService.getTopProducts error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get top products',
        data: [],
      };
    }
  }

  /**
   * Get payment summary by payment mode
   */
  static async getPaymentSummary(
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const whereClause: any = {
        payment_status: 'cleared',
      };

      if (startDate && endDate) {
        whereClause.payment_date = {
          [Op.between]: [startDate, endDate],
        };
      }

      const paymentSummary = await Payment.findAll({
        attributes: [
          'payment_mode',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        ],
        where: whereClause,
        group: ['payment_mode'],
        raw: true,
      });

      return {
        success: true,
        data: paymentSummary,
      };
    } catch (error: any) {
      console.error('DashboardService.getPaymentSummary error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get payment summary',
        data: [],
      };
    }
  }

  /**
   * Get revenue statistics for the selected period
   */
  static async getRevenueStats(
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const whereClause: any = {
        is_cancelled: false,
        invoice_type: 'sale',
      };

      if (startDate && endDate) {
        whereClause.invoice_date = {
          [Op.between]: [startDate, endDate],
        };
      }

      // Current period stats
      const currentStats: any = await Invoice.findOne({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grand_total')), 'total_revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_invoices'],
          [sequelize.fn('AVG', sequelize.col('grand_total')), 'avg_order_value'],
          [sequelize.fn('SUM', sequelize.col('balance_due')), 'outstanding_amount'],
        ],
        where: whereClause,
        raw: true,
      });

      return {
        success: true,
        data: {
          total_revenue: Number(currentStats?.total_revenue || 0),
          total_invoices: Number(currentStats?.total_invoices || 0),
          avg_order_value: Number(currentStats?.avg_order_value || 0),
          outstanding_amount: Number(currentStats?.outstanding_amount || 0),
        },
      };
    } catch (error: any) {
      console.error('DashboardService.getRevenueStats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get revenue statistics',
        data: {
          total_revenue: 0,
          total_invoices: 0,
          avg_order_value: 0,
          outstanding_amount: 0,
        },
      };
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(): Promise<ServiceResponse<any>> {
    try {
      const stats = await Customer.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_customers'],
          [sequelize.fn('SUM', sequelize.col('outstanding_balance')), 'total_outstanding'],
          [
            sequelize.fn(
              'COUNT',
              sequelize.literal("CASE WHEN outstanding_balance > 0 THEN 1 END")
            ),
            'customers_with_balance',
          ],
        ],
        where: { is_active: true },
        raw: true,
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      console.error('DashboardService.getCustomerStats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get customer statistics',
        data: null,
      };
    }
  }
}

export default DashboardService;
