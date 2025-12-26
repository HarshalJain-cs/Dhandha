import { Karigar } from '../database/models/Karigar';
import { KarigarOrder } from '../database/models/KarigarOrder';
import { MetalTransaction } from '../database/models/MetalTransaction';
import { Product } from '../database/models/Product';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * Karigar Service Response Interface
 */
export interface KarigarServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Karigar Filters Interface
 */
export interface KarigarFilters {
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  specialization?: string;
  skill_level?: string;
  search?: string;
}

/**
 * Order Filters Interface
 */
export interface OrderFilters {
  is_active?: boolean;
  karigar_id?: number;
  status?: string;
  order_type?: string;
  from_date?: Date;
  to_date?: Date;
}

/**
 * Karigar Service
 * Handles all karigar-related operations
 */
export class KarigarService {
  /**
   * Create new karigar
   */
  static async createKarigar(
    data: any,
    createdBy: number
  ): Promise<KarigarServiceResponse> {
    try {
      // Check mobile uniqueness
      const existingKarigar = await Karigar.findOne({
        where: { mobile: data.mobile, is_active: true },
      });

      if (existingKarigar) {
        return {
          success: false,
          message: 'Karigar with this mobile number already exists',
        };
      }

      // Generate karigar code
      const karigarCode = await Karigar.generateKarigarCode();

      const karigar = await Karigar.create({
        ...data,
        karigar_code: karigarCode,
        created_by: createdBy,
      } as any);

      return {
        success: true,
        message: 'Karigar created successfully',
        data: karigar,
      };
    } catch (error: any) {
      console.error('Error creating karigar:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while creating karigar',
      };
    }
  }

  /**
   * Get all karigars with filters
   */
  static async getAllKarigars(
    filters?: KarigarFilters,
    pagination?: { page: number; limit: number }
  ): Promise<KarigarServiceResponse> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.is_active !== undefined) {
          where.is_active = filters.is_active;
        }
        if (filters.status) {
          where.status = filters.status;
        }
        if (filters.specialization) {
          where.specialization = filters.specialization;
        }
        if (filters.skill_level) {
          where.skill_level = filters.skill_level;
        }
        if (filters.search) {
          where[Op.or] = [
            { name: { [Op.iLike]: `%${filters.search}%` } },
            { mobile: { [Op.iLike]: `%${filters.search}%` } },
            { karigar_code: { [Op.iLike]: `%${filters.search}%` } },
          ];
        }
      }

      const query: any = {
        where,
        order: [['created_at', 'DESC']],
      };

      if (pagination) {
        query.offset = (pagination.page - 1) * pagination.limit;
        query.limit = pagination.limit;
      }

      const { count, rows } = await Karigar.findAndCountAll(query);

      return {
        success: true,
        message: 'Karigars retrieved successfully',
        data: {
          karigars: rows,
          total: count,
          page: pagination?.page || 1,
          limit: pagination?.limit || count,
          totalPages: pagination ? Math.ceil(count / pagination.limit) : 1,
        },
      };
    } catch (error: any) {
      console.error('Error fetching karigars:', error);
      return {
        success: false,
        message: 'An error occurred while fetching karigars',
      };
    }
  }

  /**
   * Get karigar by ID
   */
  static async getKarigarById(id: number): Promise<KarigarServiceResponse> {
    try {
      const karigar = await Karigar.findByPk(id);

      if (!karigar) {
        return {
          success: false,
          message: 'Karigar not found',
        };
      }

      // Get statistics
      const orders = await KarigarOrder.findAll({
        where: { karigar_id: id },
      });

      const stats = {
        total_orders: orders.length,
        pending_orders: orders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length,
        completed_orders: orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
        cancelled_orders: orders.filter((o) => o.status === 'cancelled').length,
      };

      return {
        success: true,
        message: 'Karigar retrieved successfully',
        data: { ...karigar.toJSON(), stats },
      };
    } catch (error: any) {
      console.error('Error fetching karigar:', error);
      return {
        success: false,
        message: 'An error occurred while fetching karigar',
      };
    }
  }

  /**
   * Update karigar
   */
  static async updateKarigar(
    id: number,
    data: any,
    updatedBy: number
  ): Promise<KarigarServiceResponse> {
    try {
      const karigar = await Karigar.findByPk(id);

      if (!karigar) {
        return {
          success: false,
          message: 'Karigar not found',
        };
      }

      // Check mobile uniqueness if mobile is being updated
      if (data.mobile && data.mobile !== karigar.mobile) {
        const existingKarigar = await Karigar.findOne({
          where: {
            mobile: data.mobile,
            id: { [Op.ne]: id },
            is_active: true,
          },
        });

        if (existingKarigar) {
          return {
            success: false,
            message: 'Karigar with this mobile number already exists',
          };
        }
      }

      await karigar.update({
        ...data,
        updated_by: updatedBy,
      });

      return {
        success: true,
        message: 'Karigar updated successfully',
        data: karigar,
      };
    } catch (error: any) {
      console.error('Error updating karigar:', error);
      return {
        success: false,
        message: 'An error occurred while updating karigar',
      };
    }
  }

  /**
   * Delete karigar (soft delete)
   */
  static async deleteKarigar(
    id: number,
    deletedBy: number
  ): Promise<KarigarServiceResponse> {
    try {
      const karigar = await Karigar.findByPk(id);

      if (!karigar) {
        return {
          success: false,
          message: 'Karigar not found',
        };
      }

      // Check for pending orders
      const pendingOrders = await KarigarOrder.count({
        where: {
          karigar_id: id,
          status: { [Op.in]: ['pending', 'in_progress'] },
        },
      });

      if (pendingOrders > 0) {
        return {
          success: false,
          message: `Cannot delete karigar with ${pendingOrders} pending order(s)`,
        };
      }

      await karigar.update({
        is_active: false,
        status: 'inactive',
        updated_by: deletedBy,
      });

      return {
        success: true,
        message: 'Karigar deleted successfully',
      };
    } catch (error: any) {
      console.error('Error deleting karigar:', error);
      return {
        success: false,
        message: 'An error occurred while deleting karigar',
      };
    }
  }

  /**
   * Create karigar order
   */
  static async createOrder(
    data: any,
    createdBy: number
  ): Promise<KarigarServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Generate order number
      const orderNumber = await KarigarOrder.generateOrderNumber();

      // Get karigar details
      const karigar = await Karigar.findByPk(data.karigar_id);
      if (!karigar) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Karigar not found',
        };
      }

      // Calculate fine weight
      const fineWeight = parseFloat(((data.metal_issued_weight * data.metal_issued_purity) / 100).toFixed(3));

      // Create order
      const order = await KarigarOrder.create(
        {
          ...data,
          order_number: orderNumber,
          metal_issued_fine_weight: fineWeight,
          created_by: createdBy,
        } as any,
        { transaction }
      );

      // Create metal transaction (issue)
      const transactionNumber = await MetalTransaction.generateTransactionNumber();
      const metalRate = data.metal_rate || 0;
      const metalValue = fineWeight * metalRate;

      await MetalTransaction.create(
        {
          transaction_number: transactionNumber,
          transaction_type: 'issue',
          karigar_id: data.karigar_id,
          karigar_name: karigar.name,
          karigar_order_id: order.id,
          order_number: orderNumber,
          metal_type: data.metal_type,
          metal_purity: data.metal_issued_purity,
          gross_weight: data.metal_issued_weight,
          stone_weight: 0,
          net_weight: data.metal_issued_weight,
          fine_weight: fineWeight,
          metal_rate: metalRate,
          metal_value: metalValue,
          status: 'completed',
          description: `Metal issued for order ${orderNumber}`,
          created_by: createdBy,
        } as any,
        { transaction }
      );

      // Update karigar metal account
      karigar.issueMetal(
        data.metal_type.toLowerCase() === 'gold' ? 'gold' : 'silver',
        fineWeight
      );
      await karigar.save({ transaction });

      // Update product status if linked
      if (data.product_id) {
        const product = await Product.findByPk(data.product_id);
        if (product) {
          product.status = 'with_karigar';
          await product.save({ transaction });
        }
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Order created successfully',
        data: { order_id: order.id, order_number: orderNumber },
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error creating order:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while creating order',
      };
    }
  }

  /**
   * Get all orders with filters
   */
  static async getAllOrders(
    filters?: OrderFilters,
    pagination?: { page: number; limit: number }
  ): Promise<KarigarServiceResponse> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.is_active !== undefined) {
          where.is_active = filters.is_active;
        }
        if (filters.karigar_id) {
          where.karigar_id = filters.karigar_id;
        }
        if (filters.status) {
          where.status = filters.status;
        }
        if (filters.order_type) {
          where.order_type = filters.order_type;
        }
        if (filters.from_date || filters.to_date) {
          where.order_date = {};
          if (filters.from_date) {
            where.order_date[Op.gte] = filters.from_date;
          }
          if (filters.to_date) {
            where.order_date[Op.lte] = filters.to_date;
          }
        }
      }

      const query: any = {
        where,
        include: [
          {
            model: Karigar,
            as: 'karigar',
            attributes: ['id', 'karigar_code', 'name', 'mobile'],
          },
        ],
        order: [['order_date', 'DESC']],
      };

      if (pagination) {
        query.offset = (pagination.page - 1) * pagination.limit;
        query.limit = pagination.limit;
      }

      const { count, rows } = await KarigarOrder.findAndCountAll(query);

      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders: rows,
          total: count,
          page: pagination?.page || 1,
          limit: pagination?.limit || count,
          totalPages: pagination ? Math.ceil(count / pagination.limit) : 1,
        },
      };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: 'An error occurred while fetching orders',
      };
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(id: number): Promise<KarigarServiceResponse> {
    try {
      const order = await KarigarOrder.findByPk(id, {
        include: [
          {
            model: Karigar,
            as: 'karigar',
          },
        ],
      });

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
        };
      }

      // Get metal transactions for this order
      const transactions = await MetalTransaction.findAll({
        where: { karigar_order_id: id },
        order: [['transaction_date', 'ASC']],
      });

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: { ...order.toJSON(), transactions },
      };
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        message: 'An error occurred while fetching order',
      };
    }
  }

  /**
   * Receive metal from karigar (complete order)
   */
  static async receiveMetal(
    orderId: number,
    data: {
      metal_received_weight: number;
      metal_received_purity: number;
      quality_check_passed: boolean;
      quality_remarks?: string;
    },
    receivedBy: number
  ): Promise<KarigarServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      const order = await KarigarOrder.findByPk(orderId);
      if (!order) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Order not found',
        };
      }

      const karigar = await Karigar.findByPk(order.karigar_id);
      if (!karigar) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Karigar not found',
        };
      }

      // Calculate fine weight
      const fineWeight = parseFloat(
        ((data.metal_received_weight * data.metal_received_purity) / 100).toFixed(3)
      );

      // Update order
      order.metal_received_weight = data.metal_received_weight;
      order.metal_received_purity = data.metal_received_purity;
      order.metal_received_fine_weight = fineWeight;
      order.quality_check_done = true;
      order.quality_check_passed = data.quality_check_passed;
      order.quality_remarks = data.quality_remarks || null;

      // Calculate wastage
      order.calculateWastage();

      // Mark as completed
      order.complete();
      await order.save({ transaction });

      // Create metal transaction (receive)
      const transactionNumber = await MetalTransaction.generateTransactionNumber();
      const metalRate = 0; // Can be fetched from metal_types table
      const metalValue = fineWeight * metalRate;

      await MetalTransaction.create(
        {
          transaction_number: transactionNumber,
          transaction_type: 'receive',
          karigar_id: order.karigar_id,
          karigar_name: karigar.name,
          karigar_order_id: order.id,
          order_number: order.order_number,
          metal_type: order.metal_type,
          metal_purity: data.metal_received_purity,
          gross_weight: data.metal_received_weight,
          stone_weight: 0,
          net_weight: data.metal_received_weight,
          fine_weight: fineWeight,
          metal_rate: metalRate,
          metal_value: metalValue,
          expected_weight: order.metal_issued_fine_weight,
          actual_weight: fineWeight,
          wastage_weight: order.wastage_weight,
          wastage_percentage: order.wastage_percentage,
          wastage_value: order.wastage_amount,
          status: 'completed',
          description: `Metal received for order ${order.order_number}`,
          created_by: receivedBy,
        } as any,
        { transaction }
      );

      // Update karigar metal account
      const receivedSuccessfully = karigar.receiveMetal(
        order.metal_type.toLowerCase() === 'gold' ? 'gold' : 'silver',
        fineWeight
      );

      if (!receivedSuccessfully) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Insufficient metal balance with karigar',
        };
      }

      await karigar.save({ transaction });

      // Update product status if linked
      if (order.product_id) {
        const product = await Product.findByPk(order.product_id);
        if (product) {
          product.status = 'in_stock';
          await product.save({ transaction });
        }
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Metal received successfully',
        data: order,
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error receiving metal:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while receiving metal',
      };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    id: number,
    status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled',
    updatedBy: number,
    cancellationReason?: string
  ): Promise<KarigarServiceResponse> {
    try {
      const order = await KarigarOrder.findByPk(id);

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
        };
      }

      if (status === 'in_progress') {
        order.start();
      } else if (status === 'completed') {
        order.complete();
      } else if (status === 'delivered') {
        order.deliver();
      } else if (status === 'cancelled') {
        order.cancel(cancellationReason || 'No reason provided');
      } else {
        order.status = status;
      }

      order.updated_by = updatedBy;
      await order.save();

      return {
        success: true,
        message: `Order ${status} successfully`,
        data: order,
      };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        message: 'An error occurred while updating order status',
      };
    }
  }

  /**
   * Get karigar dashboard statistics
   */
  static async getKarigarStats(karigarId?: number): Promise<KarigarServiceResponse> {
    try {
      const where: any = {};
      if (karigarId) {
        where.karigar_id = karigarId;
      }

      const orders = await KarigarOrder.findAll({ where });

      const stats = {
        total_orders: orders.length,
        pending_orders: orders.filter((o) => o.status === 'pending').length,
        in_progress_orders: orders.filter((o) => o.status === 'in_progress').length,
        completed_orders: orders.filter((o) => o.status === 'completed').length,
        delivered_orders: orders.filter((o) => o.status === 'delivered').length,
        cancelled_orders: orders.filter((o) => o.status === 'cancelled').length,
        delayed_orders: orders.filter((o) => o.isDelayed()).length,
        total_metal_issued: orders.reduce((sum, o) => sum + Number(o.metal_issued_fine_weight), 0),
        total_metal_received: orders.reduce((sum, o) => sum + Number(o.metal_received_fine_weight), 0),
        total_wastage: orders.reduce((sum, o) => sum + Number(o.wastage_weight), 0),
        average_wastage_percentage: orders.length > 0
          ? orders.reduce((sum, o) => sum + Number(o.wastage_percentage), 0) / orders.length
          : 0,
      };

      return {
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats,
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return {
        success: false,
        message: 'An error occurred while fetching statistics',
      };
    }
  }
}

export default KarigarService;
