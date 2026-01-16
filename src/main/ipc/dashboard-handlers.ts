
import { ipcMain } from 'electron';
import { Op, Sequelize } from 'sequelize';
import { Invoice } from '../database/models/Invoice';
import { InvoiceItem } from '../database/models/InvoiceItem';
import { Product } from '../database/models/Product';
import { Category } from '../database/models/Category';
import { Payment } from '../database/models/Payment';

async function getSalesTrends() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await Invoice.findAll({
      attributes: [
        [Sequelize.fn('date', Sequelize.col('invoice_date')), 'date'],
        [Sequelize.fn('sum', Sequelize.col('total_amount')), 'totalSales'],
        [Sequelize.fn('count', Sequelize.col('id')), 'invoiceCount'],
      ],
      where: {
        invoice_date: {
          [Op.gte]: thirtyDaysAgo,
        },
        is_cancelled: false,
      },
      group: [Sequelize.fn('date', Sequelize.col('invoice_date'))],
      order: [[Sequelize.fn('date', Sequelize.col('invoice_date')), 'ASC']],
    });

    return { success: true, data: salesData };
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    return { success: false, message: 'Failed to fetch sales trends.' };
  }
}

async function getProductDistribution() {
  try {
    const productData = await Product.findAll({
      attributes: [
        [Sequelize.fn('count', Sequelize.col('Product.id')), 'productCount'],
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name'],
      }],
      group: ['category.name'],
    });

    return { success: true, data: productData };
  } catch (error) {
    console.error('Error fetching product distribution:', error);
    return { success: false, message: 'Failed to fetch product distribution.' };
  }
}

async function getTopProducts() {
  try {
    const topProducts = await InvoiceItem.findAll({
      attributes: [
        'item_name',
        [Sequelize.fn('sum', Sequelize.col('quantity')), 'totalQuantitySold'],
      ],
      group: ['item_name'],
      order: [[Sequelize.fn('sum', Sequelize.col('quantity')), 'DESC']],
      limit: 5,
    });
    return { success: true, data: topProducts };
  } catch (error) {
    console.error('Error fetching top products:', error);
    return { success: false, message: 'Failed to fetch top products.' };
  }
}

async function getPaymentSummary() {
  try {
    const summary = await Payment.findAll({
        attributes: [
            'payment_mode',
            [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
        ],
        group: ['payment_mode'],
    });
    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    return { success: false, message: 'Failed to fetch payment summary.' };
  }
}


export const dashboardHandlers = {
  getSalesTrends,
  getProductDistribution,
  getTopProducts,
  getPaymentSummary,
};

export function setupDashboardHandlers() {
  ipcMain.handle('dashboard:get-sales-trends', getSalesTrends);
  ipcMain.handle('dashboard:get-product-distribution', getProductDistribution);
  ipcMain.handle('dashboard:get-top-products', getTopProducts);
  ipcMain.handle('dashboard:get-payment-summary', getPaymentSummary);
}
