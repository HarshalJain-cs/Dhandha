// @ts-nocheck
import Notification from '../database/models/Notification';
import Product from '../database/models/Product';
import GoldLoan from '../database/models/GoldLoan';
import KarigarOrder from '../database/models/KarigarOrder';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

export class NotificationService {
  static async createNotification(
    userId: number,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success',
    priority: 'low' | 'medium' | 'high',
    entityType: string | null = null,
    entityId: string | null = null
  ): Promise<any> {
    try {
      const notification = await Notification.create({
        user_id: userId,
        title,
        message,
        type,
        priority,
        entity_type: entityType,
        entity_id: entityId,
        is_read: false,
        created_at: new Date(),
      });
      return { success: true, data: notification };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getUserNotifications(userId: number, filters: any = {}): Promise<any> {
    try {
      const where: any = { user_id: userId };

      if (filters.is_read !== undefined) where.is_read = filters.is_read;
      if (filters.type) where.type = filters.type;
      if (filters.priority) where.priority = filters.priority;

      const notifications = await Notification.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: filters.limit || 50,
      });

      const unreadCount = await Notification.count({
        where: { user_id: userId, is_read: false },
      });

      return { success: true, data: { notifications, unreadCount } };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async markAsRead(notificationId: number): Promise<any> {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (!notification) return { success: false, message: 'Notification not found' };

      await notification.update({ is_read: true, read_at: new Date() });
      return { success: true, data: notification };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async markAllAsRead(userId: number): Promise<any> {
    try {
      await Notification.update(
        { is_read: true, read_at: new Date() },
        { where: { user_id: userId, is_read: false } }
      );
      return { success: true, message: 'All notifications marked as read' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async deleteNotification(notificationId: number): Promise<any> {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (!notification) return { success: false, message: 'Notification not found' };

      await notification.destroy();
      return { success: true, message: 'Notification deleted' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async checkAlerts(): Promise<any> {
    try {
      const alerts: any[] = [];

      // Check low stock products
      const lowStockProducts = await Product.findAll({
        where: {
          current_stock: { [Op.lte]: sequelize.col('min_stock_level') },
          status: 'active',
        },
      });

      for (const product of lowStockProducts) {
        alerts.push({
          title: 'Low Stock Alert',
          message: `Product ${product.product_name} is running low on stock. Current: ${product.current_stock}, Minimum: ${product.min_stock_level}`,
          type: 'warning',
          priority: 'high',
          entity_type: 'product',
          entity_id: product.product_id.toString(),
        });
      }

      // Check loan maturity (30 days before)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingLoanMaturity = await GoldLoan.findAll({
        where: {
          maturity_date: { [Op.lte]: thirtyDaysFromNow, [Op.gte]: new Date() },
          status: 'active',
        },
      });

      for (const loan of upcomingLoanMaturity) {
        alerts.push({
          title: 'Loan Maturity Reminder',
          message: `Gold Loan ${loan.loan_number} is maturing on ${loan.maturity_date}. Outstanding: ₹${loan.outstanding_amount}`,
          type: 'info',
          priority: 'medium',
          entity_type: 'gold_loan',
          entity_id: loan.loan_id.toString(),
        });
      }

      // Check overdue loans
      const overdueLoans = await GoldLoan.findAll({
        where: {
          maturity_date: { [Op.lt]: new Date() },
          status: 'active',
        },
      });

      for (const loan of overdueLoans) {
        alerts.push({
          title: 'Overdue Loan',
          message: `Gold Loan ${loan.loan_number} is overdue! Maturity was ${loan.maturity_date}. Outstanding: ₹${loan.outstanding_amount}`,
          type: 'error',
          priority: 'high',
          entity_type: 'gold_loan',
          entity_id: loan.loan_id.toString(),
        });
      }

      // Check overdue karigar orders
      const overdueKarigarOrders = await KarigarOrder.findAll({
        where: {
          expected_completion_date: { [Op.lt]: new Date() },
          status: { [Op.in]: ['pending', 'in_progress'] },
        },
      });

      for (const order of overdueKarigarOrders) {
        alerts.push({
          title: 'Overdue Karigar Order',
          message: `Karigar Order ${order.order_number} is overdue! Expected completion: ${order.expected_completion_date}`,
          type: 'warning',
          priority: 'high',
          entity_type: 'karigar_order',
          entity_id: order.order_id.toString(),
        });
      }

      return { success: true, data: alerts };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static startAlertChecks(webContents: any): void {
    // Run alert checks every hour
    setInterval(async () => {
      const result = await this.checkAlerts();
      if (result.success && result.data.length > 0) {
        // Send notifications to all admin users (user_id = 1 for simplicity)
        for (const alert of result.data) {
          await this.createNotification(
            1, // Admin user ID
            alert.title,
            alert.message,
            alert.type,
            alert.priority,
            alert.entity_type,
            alert.entity_id
          );
        }
        // Notify renderer process
        webContents.send('new-notifications', result.data);
      }
    }, 3600000); // 1 hour
  }
}
