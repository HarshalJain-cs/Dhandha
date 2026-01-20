import { ipcMain } from 'electron';
import { Op, Sequelize } from 'sequelize';
import log from 'electron-log';
import { Invoice } from '../database/models/Invoice';
import { InvoiceItem } from '../database/models/InvoiceItem';
import { Product } from '../database/models/Product';
import { Category } from '../database/models/Category';
import { Customer } from '../database/models/Customer';
import { User } from '../database/models/User';
import { StockTransaction } from '../database/models/StockTransaction';
import MetalRate from '../database/models/MetalRate';

// ============================================
// SALES REPORTS
// ============================================

ipcMain.handle(
  'reports:sales-summary',
  async (event, { startDate, endDate, groupBy = 'day' }) => {
    try {
      let dateFormat: string;
      switch (groupBy) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'YYYY-WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        case 'year':
          dateFormat = 'YYYY';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const salesSummary = await Invoice.findAll({
        attributes: [
          [
            Sequelize.fn('TO_CHAR', Sequelize.col('invoice_date'), dateFormat),
            'period',
          ],
          [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'invoice_count'],
          [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'subtotal'],
          [Sequelize.fn('SUM', Sequelize.col('cgst_amount')), 'cgst_amount'],
          [Sequelize.fn('SUM', Sequelize.col('sgst_amount')), 'sgst_amount'],
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount'],
          [Sequelize.fn('SUM', Sequelize.col('paid_amount')), 'paid_amount'],
          [Sequelize.fn('SUM', Sequelize.col('due_amount')), 'due_amount'],
        ],
        where: {
          invoice_date: {
            [Op.between]: [new Date(startDate), new Date(endDate)],
          },
          is_cancelled: false,
        },
        group: [
          Sequelize.fn('TO_CHAR', Sequelize.col('invoice_date'), dateFormat),
        ],
        order: [
          [
            Sequelize.fn('TO_CHAR', Sequelize.col('invoice_date'), dateFormat),
            'ASC',
          ],
        ],
        raw: true,
      });

      return { success: true, data: salesSummary };
    } catch (error: any) {
      log.error('Sales summary report error:', error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  'reports:sales-by-customer',
  async (event, { startDate, endDate }) => {
    try {
      const salesByCustomer = await Invoice.findAll({
        attributes: [
          'customer_id',
          [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'invoice_count'],
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_sales'],
          [Sequelize.fn('SUM', Sequelize.col('paid_amount')), 'total_paid'],
          [Sequelize.fn('SUM', Sequelize.col('due_amount')), 'total_due'],
          [Sequelize.fn('AVG', Sequelize.col('total_amount')), 'average_order_value'],
        ],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['customer_code', 'full_name', 'phone', 'email'],
          },
        ],
        where: {
          invoice_date: {
            [Op.between]: [new Date(startDate), new Date(endDate)],
          },
          is_cancelled: false,
        },
        group: ['customer_id', 'customer.id'],
        order: [[Sequelize.fn('SUM', Sequelize.col('total_amount')), 'DESC']],
      });

      return { success: true, data: salesByCustomer };
    } catch (error: any) {
      log.error('Sales by customer report error:', error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  'reports:sales-by-product',
  async (event, { startDate, endDate }) => {
    try {
      const salesByProduct = await InvoiceItem.findAll({
        attributes: [
          'product_id',
          'item_name',
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total_quantity'],
          [Sequelize.fn('SUM', Sequelize.col('net_weight')), 'total_weight'],
          [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_sales'],
          // gold_rate is on InvoiceItem, so we can't AVG directly from product in this query
          // [Sequelize.fn('AVG', Sequelize.col('gold_rate')), 'average_rate'],
        ],
        include: [
          {
            model: Invoice,
            as: 'invoice',
            attributes: [],
            where: {
              invoice_date: {
                [Op.between]: [new Date(startDate), new Date(endDate)],
              },
              is_cancelled: false,
            },
          },
        ],
        group: ['product_id', 'item_name'],
        order: [[Sequelize.fn('SUM', Sequelize.col('total_amount')), 'DESC']],
        raw: true,
      });

      return { success: true, data: salesByProduct };
    } catch (error: any) {
      log.error('Sales by product report error:', error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  'reports:sales-detailed',
  async (event, { startDate, endDate, customerId, paymentStatus }) => {
    try {
      const where: any = {
        invoice_date: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
        is_cancelled: false,
      };

      if (customerId) {
        where.customer_id = customerId;
      }

      if (paymentStatus) {
        where.payment_status = paymentStatus;
      }

      const detailedSales = await Invoice.findAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['customer_code', 'full_name', 'phone'],
          },
          {
            model: InvoiceItem,
            as: 'items',
            attributes: [
              'item_name',
              'quantity',
              'net_weight',
              'gold_rate',
              'making_charges',
              'total_amount',
            ],
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['full_name'],
          },
        ],
        order: [['invoice_date', 'DESC']],
      });

      return { success: true, data: detailedSales };
    } catch (error: any) {
      log.error('Detailed sales report error:', error);
      return { success: false, error: error.message };
    }
  }
);

// ============================================
// STOCK REPORTS
// ============================================

ipcMain.handle('reports:current-stock', async (event, filters: any = {}) => {
  try {
    const where: any = { is_active: true };

    if (filters.category_id) {
      where.category_id = filters.category_id;
    }

    if (filters.product_type) {
      where.product_type = filters.product_type;
    }

    if (filters.low_stock) {
      where.current_stock = { [Op.lte]: 10 };
    }

    const stockReport = await Product.findAll({
      where,
      attributes: [
        'id',
        'product_code',
        'product_name',
        'product_type',
        'purity',
        'net_weight',
        'current_stock',
        'making_charges',
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name'],
        },
      ],
      order: [['product_name', 'ASC']],
    });

    // Calculate total value
    const totalValue = stockReport.reduce((sum, product: any) => {
      // Simplified value calculation (would need current gold rate in reality)
      const estimatedValue = (product.current_stock || 0) * (product.making_charges || 0);
      return sum + estimatedValue;
    }, 0);

    return {
      success: true,
      data: {
        products: stockReport,
        summary: {
          total_products: stockReport.length,
          total_value: totalValue,
          low_stock_count: stockReport.filter((p: any) => p.current_stock <= 10).length,
        },
      },
    };
  } catch (error: any) {
    log.error('Current stock report error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  'reports:stock-movement',
  async (event, { startDate, endDate, productId }) => {
    try {
      const where: any = {
        transaction_date: { // Assuming stock transactions have transaction_date
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      };

      if (productId) {
        where.product_id = productId;
      }

      const stockMovement = await StockTransaction.findAll({
        where,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_code', 'product_name', 'product_type'],
          },
          {
            model: User,
            as: 'user', // Assuming user is associated with createdBy in StockTransaction
            attributes: ['full_name'],
          },
        ],
        order: [['transaction_date', 'DESC']],
      });

      return { success: true, data: stockMovement };
    } catch (error: any) {
      log.error('Stock movement report error:', error);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle('reports:stock-valuation', async () => {
  try {
    // Get current gold rate (latest by rate_date)
    const goldRate = await MetalRate.findOne({
      order: [['rate_date', 'DESC']],
    });

    const products = await Product.findAll({
      where: { is_active: true },
      attributes: [
        'id',
        'product_code',
        'product_name',
        'net_weight',
        'current_stock',
        'making_charge',
        'making_charge_type',
        'purity',
      ],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_name'],
        },
      ],
    });

    const valuationData = products.map((product: any) => {
      // Get rate based on purity
      let ratePerGram = 0;
      if (goldRate) {
        const purity = product.purity || 91.6; // Default to 22K (91.6%)
        if (purity >= 99) ratePerGram = Number(goldRate.gold_24k) || 0;
        else if (purity >= 91) ratePerGram = Number(goldRate.gold_22k) || 0;
        else if (purity >= 75) ratePerGram = Number(goldRate.gold_18k) || 0;
      }

      const goldValue = (product.net_weight || 0) * ratePerGram;

      const makingValue =
        product.making_charge_type === 'per_gram'
          ? (product.net_weight || 0) * (product.making_charge || 0)
          : (product.making_charge || 0);

      const unitValue = goldValue + makingValue;
      const totalValue = unitValue * (product.current_stock || 0);

      return {
        ...product.toJSON(),
        gold_rate: ratePerGram,
        gold_value: goldValue,
        making_value: makingValue,
        unit_value: unitValue,
        total_value: totalValue,
      };
    });

    const summary = {
      total_products: valuationData.length,
      total_stock_quantity: valuationData.reduce((sum, p) => sum + p.current_stock, 0),
      total_stock_value: valuationData.reduce((sum, p) => sum + p.total_value, 0),
      total_gold_weight: valuationData.reduce(
        (sum, p) => sum + (p.net_weight || 0) * (p.current_stock || 0),
        0
      ),
    };

    return {
      success: true,
      data: {
        products: valuationData,
        summary,
      },
    };
  } catch (error: any) {
    log.error('Stock valuation report error:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// GST REPORTS
// ============================================

ipcMain.handle('reports:gstr1', async (event, { month, year }) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // B2B Invoices (with GSTIN)
    const b2bInvoices = await Invoice.findAll({
      where: {
        invoice_date: {
          [Op.between]: [startDate, endDate],
        },
        is_cancelled: false,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: {
            gstin: { [Op.ne]: null },
          },
          attributes: ['gstin', 'full_name', 'state'],
        },
      ],
    });

    // B2C Large Invoices (>2.5 lakh without GSTIN)
    const b2cLargeInvoices = await Invoice.findAll({
      where: {
        invoice_date: {
          [Op.between]: [startDate, endDate],
        },
        is_cancelled: false,
        grand_total: { [Op.gt]: 250000 },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          where: {
            [Op.or]: [{ gstin: null }, { gstin: '' }],
          },
          attributes: ['full_name', 'state'],
        },
      ],
    });

    // B2C Small Invoices Summary
    const b2cSmallSummary = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Invoice.id')), 'invoice_count'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount'],
        [Sequelize.fn('SUM', Sequelize.col('cgst_amount')), 'cgst_amount'],
        [Sequelize.fn('SUM', Sequelize.col('sgst_amount')), 'sgst_amount'],
      ],
      where: {
        invoice_date: {
          [Op.between]: [startDate, endDate],
        },
        is_cancelled: false,
        grand_total: { [Op.lte]: 250000 },
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
          where: {
            [Op.or]: [{ gstin: null }, { gstin: '' }],
          },
        },
      ],
      raw: true,
    });

    return {
      success: true,
      data: {
        b2b: b2bInvoices,
        b2cl: b2cLargeInvoices,
        b2cs: b2cSmallSummary,
      },
    };
  } catch (error: any) {
    log.error('GSTR-1 report error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reports:gstr3b', async (event, { month, year }) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Outward Supplies
    const outwardSupplies = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'taxable_value'],
        [Sequelize.fn('SUM', Sequelize.col('cgst_amount')), 'cgst_amount'],
        [Sequelize.fn('SUM', Sequelize.col('sgst_amount')), 'sgst_amount'],
        [Sequelize.fn('SUM', Sequelize.col('igst_amount')), 'igst_amount'],
      ],
      where: {
        invoice_date: {
          [Op.between]: [startDate, endDate],
        },
        is_cancelled: false,
      },
      raw: true,
    });

    return {
      success: true,
      data: {
        outward_supplies: outwardSupplies[0],
        period: `${month}/${year}`,
      },
    };
  } catch (error: any) {
    log.error('GSTR-3B report error:', error);
    return { success: false, error: error.message };
  }
});

export function setupReportsHandlers() {
  log.info('Reports handlers registered');
}