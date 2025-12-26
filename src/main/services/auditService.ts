import AuditLog from '../database/models/AuditLog';
import { Op } from 'sequelize';

export class AuditService {
  static async log(
    userId: number,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT',
    entityType: string | null,
    entityId: string | null,
    oldValues: any = null,
    newValues: any = null,
    ipAddress: string | null = null,
    userAgent: string | null = null
  ): Promise<any> {
    try {
      const auditLog = await AuditLog.create({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date(),
      });
      return { success: true, data: auditLog };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getAuditLogs(filters: any = {}, pagination: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 50 } = pagination;
      const where: any = {};

      if (filters.user_id) where.user_id = filters.user_id;
      if (filters.action) where.action = filters.action;
      if (filters.entity_type) where.entity_type = filters.entity_type;
      if (filters.start_date && filters.end_date) {
        where.timestamp = { [Op.between]: [filters.start_date, filters.end_date] };
      }

      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [['timestamp', 'DESC']],
      });

      return {
        success: true,
        data: {
          logs: rows,
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

  static async getEntityHistory(entityType: string, entityId: string): Promise<any> {
    try {
      const logs = await AuditLog.findAll({
        where: { entity_type: entityType, entity_id: entityId },
        order: [['timestamp', 'DESC']],
      });
      return { success: true, data: logs };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getUserActivity(userId: number, dateRange: any = {}): Promise<any> {
    try {
      const where: any = { user_id: userId };

      if (dateRange.start_date && dateRange.end_date) {
        where.timestamp = { [Op.between]: [dateRange.start_date, dateRange.end_date] };
      }

      const logs = await AuditLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
      });

      const summary = {
        totalActions: logs.length,
        creates: logs.filter((log) => log.action === 'CREATE').length,
        updates: logs.filter((log) => log.action === 'UPDATE').length,
        deletes: logs.filter((log) => log.action === 'DELETE').length,
        logins: logs.filter((log) => log.action === 'LOGIN').length,
        logouts: logs.filter((log) => log.action === 'LOGOUT').length,
      };

      return { success: true, data: { logs, summary } };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
