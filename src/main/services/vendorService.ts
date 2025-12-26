import Vendor from '../database/models/Vendor';
import { Op } from 'sequelize';

export class VendorService {
  static async createVendor(data: any, userId: number): Promise<any> {
    try {
      // Generate vendor code
      const lastVendor = await Vendor.findOne({ order: [['vendor_id', 'DESC']] });
      const lastNumber = lastVendor ? lastVendor.vendor_id : 0;
      data.vendor_code = `VEN${String(lastNumber + 1).padStart(6, '0')}`;
      data.created_by = userId;

      const vendor = await Vendor.create(data);
      return { success: true, data: vendor, message: 'Vendor created successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getAllVendors(filters: any = {}, pagination: any = {}): Promise<any> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const where: any = {};

      if (filters.search) {
        where[Op.or] = [
          { vendor_name: { [Op.iLike]: `%${filters.search}%` } },
          { vendor_code: { [Op.iLike]: `%${filters.search}%` } },
          { phone: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }
      if (filters.vendor_type) where.vendor_type = filters.vendor_type;
      if (filters.is_active !== undefined) where.is_active = filters.is_active;

      const { count, rows } = await Vendor.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
      });

      return {
        success: true,
        data: {
          vendors: rows,
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

  static async getVendorById(id: number): Promise<any> {
    try {
      const vendor = await Vendor.findByPk(id);
      if (!vendor) return { success: false, message: 'Vendor not found' };
      return { success: true, data: vendor };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async updateVendor(id: number, data: any, userId: number): Promise<any> {
    try {
      const vendor = await Vendor.findByPk(id);
      if (!vendor) return { success: false, message: 'Vendor not found' };

      data.updated_by = userId;
      await vendor.update(data);
      return { success: true, data: vendor, message: 'Vendor updated successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async getVendorBalance(id: number): Promise<any> {
    try {
      const vendor = await Vendor.findByPk(id, {
        attributes: ['vendor_id', 'vendor_name', 'current_balance', 'credit_limit'],
      });
      if (!vendor) return { success: false, message: 'Vendor not found' };
      return { success: true, data: vendor };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
