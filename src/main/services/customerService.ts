import { Customer } from '../database/models/Customer';
import { Op } from 'sequelize';

/**
 * Customer Service Response Interface
 */
export interface CustomerServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Customer Filter Interface
 */
export interface CustomerFilters {
  is_active?: boolean;
  customer_type?: 'retail' | 'wholesale' | 'vip';
  search?: string;
  city?: string;
  state?: string;
  min_credit_limit?: number;
  max_credit_limit?: number;
}

/**
 * Customer Service
 * Handles all customer-related operations
 */
export class CustomerService {
  /**
   * Generate unique customer code
   * Format: CUST-YYYYMMDD-###
   */
  static async generateCustomerCode(): Promise<CustomerServiceResponse> {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      // Find the latest customer code for today
      const latestCustomer = await Customer.findOne({
        where: {
          customer_code: {
            [Op.like]: `CUST-${dateStr}%`,
          },
        },
        order: [['customer_code', 'DESC']],
      });

      let sequence = 1;
      if (latestCustomer) {
        const lastSequence = latestCustomer.customer_code.split('-')[2];
        sequence = parseInt(lastSequence) + 1;
      }

      const customerCode = `CUST-${dateStr}-${String(sequence).padStart(3, '0')}`;

      return {
        success: true,
        message: 'Customer code generated successfully',
        data: { customer_code: customerCode },
      };
    } catch (error: any) {
      console.error('Generate customer code error:', error);
      return {
        success: false,
        message: 'An error occurred while generating customer code',
      };
    }
  }

  /**
   * Create new customer
   */
  static async create(data: {
    customer_code?: string;
    customer_type: 'retail' | 'wholesale' | 'vip';
    first_name: string;
    last_name?: string;
    mobile: string;
    alternate_mobile?: string;
    email?: string;
    pan_number?: string;
    aadhar_number?: string;
    gstin?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    date_of_birth?: Date;
    anniversary_date?: Date;
    credit_limit?: number;
    credit_days?: number;
    discount_percentage?: number;
    notes?: string;
    created_by: number;
  }): Promise<CustomerServiceResponse> {
    try {
      // Check if mobile number already exists
      const existingMobile = await Customer.findOne({
        where: { mobile: data.mobile },
      });
      if (existingMobile) {
        return {
          success: false,
          message: 'Mobile number already exists',
        };
      }

      // Check if email already exists (if provided)
      if (data.email) {
        const existingEmail = await Customer.findOne({
          where: { email: data.email },
        });
        if (existingEmail) {
          return {
            success: false,
            message: 'Email already exists',
          };
        }
      }

      // Generate customer code if not provided
      let customerCode: string = data.customer_code || '';
      if (!customerCode) {
        const codeResponse = await this.generateCustomerCode();
        if (!codeResponse.success) {
          return codeResponse;
        }
        customerCode = codeResponse.data?.customer_code || '';
      } else {
        // Check if customer code is unique
        const existingCode = await Customer.findOne({
          where: { customer_code: customerCode },
        });
        if (existingCode) {
          return {
            success: false,
            message: 'Customer code already exists',
          };
        }
      }

      // Create customer
      const customer = await Customer.create({
        ...data,
        customer_code: customerCode,
        country: data.country || 'India',
        credit_limit: data.credit_limit || 0,
        credit_days: data.credit_days || 0,
        discount_percentage: data.discount_percentage || 0,
        outstanding_balance: 0,
        loyalty_points: 0,
        metal_account_balance: 0,
      });

      return {
        success: true,
        message: 'Customer created successfully',
        data: customer,
      };
    } catch (error: any) {
      console.error('Create customer error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while creating customer',
      };
    }
  }

  /**
   * Get all customers with optional filtering and pagination
   */
  static async getAll(
    filters?: CustomerFilters,
    pagination?: { page: number; limit: number }
  ): Promise<CustomerServiceResponse> {
    try {
      const where: any = {};

      // Apply filters
      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.customer_type) {
        where.customer_type = filters.customer_type;
      }

      if (filters?.city) {
        where.city = { [Op.iLike]: `%${filters.city}%` };
      }

      if (filters?.state) {
        where.state = { [Op.iLike]: `%${filters.state}%` };
      }

      if (filters?.search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${filters.search}%` } },
          { last_name: { [Op.iLike]: `%${filters.search}%` } },
          { mobile: { [Op.iLike]: `%${filters.search}%` } },
          { email: { [Op.iLike]: `%${filters.search}%` } },
          { customer_code: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      if (filters?.min_credit_limit !== undefined || filters?.max_credit_limit !== undefined) {
        where.credit_limit = {};
        if (filters.min_credit_limit !== undefined) {
          where.credit_limit[Op.gte] = filters.min_credit_limit;
        }
        if (filters.max_credit_limit !== undefined) {
          where.credit_limit[Op.lte] = filters.max_credit_limit;
        }
      }

      // Pagination
      const queryOptions: any = {
        where,
        order: [['created_at', 'DESC']],
      };

      if (pagination) {
        queryOptions.limit = pagination.limit;
        queryOptions.offset = (pagination.page - 1) * pagination.limit;
      }

      const { rows: customers, count: total } = await Customer.findAndCountAll(queryOptions);

      if (pagination) {
        const totalPages = Math.ceil(total / pagination.limit);
        return {
          success: true,
          message: 'Customers retrieved successfully',
          data: {
            customers,
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages,
          },
        };
      }

      return {
        success: true,
        message: 'Customers retrieved successfully',
        data: customers,
      };
    } catch (error: any) {
      console.error('Get all customers error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving customers',
      };
    }
  }

  /**
   * Get customer by ID
   */
  static async getById(id: number): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      return {
        success: true,
        message: 'Customer retrieved successfully',
        data: customer,
      };
    } catch (error: any) {
      console.error('Get customer by ID error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving customer',
      };
    }
  }

  /**
   * Update customer
   */
  static async update(
    id: number,
    data: Partial<{
      customer_code: string;
      customer_type: 'retail' | 'wholesale' | 'vip';
      first_name: string;
      last_name: string;
      mobile: string;
      alternate_mobile: string;
      email: string;
      pan_number: string;
      aadhar_number: string;
      gstin: string;
      address_line1: string;
      address_line2: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
      date_of_birth: Date;
      anniversary_date: Date;
      credit_limit: number;
      credit_days: number;
      discount_percentage: number;
      notes: string;
    }>,
    updated_by: number
  ): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      // Check if mobile number already exists (excluding current customer)
      if (data.mobile && data.mobile !== customer.mobile) {
        const existingMobile = await Customer.findOne({
          where: {
            mobile: data.mobile,
            id: { [Op.ne]: id },
          },
        });
        if (existingMobile) {
          return {
            success: false,
            message: 'Mobile number already exists',
          };
        }
      }

      // Check if email already exists (excluding current customer)
      if (data.email && data.email !== customer.email) {
        const existingEmail = await Customer.findOne({
          where: {
            email: data.email,
            id: { [Op.ne]: id },
          },
        });
        if (existingEmail) {
          return {
            success: false,
            message: 'Email already exists',
          };
        }
      }

      // Check if customer code already exists (excluding current customer)
      if (data.customer_code && data.customer_code !== customer.customer_code) {
        const existingCode = await Customer.findOne({
          where: {
            customer_code: data.customer_code,
            id: { [Op.ne]: id },
          },
        });
        if (existingCode) {
          return {
            success: false,
            message: 'Customer code already exists',
          };
        }
      }

      // Update customer
      await customer.update({
        ...data,
        updated_by,
      });

      return {
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      };
    } catch (error: any) {
      console.error('Update customer error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while updating customer',
      };
    }
  }

  /**
   * Delete customer (soft delete)
   */
  static async delete(id: number, deleted_by: number): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      // Soft delete
      await customer.update({
        is_active: false,
        updated_by: deleted_by,
      });

      return {
        success: true,
        message: 'Customer deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete customer error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting customer',
      };
    }
  }

  /**
   * Search customer by mobile
   */
  static async searchByMobile(mobile: string): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findOne({
        where: { mobile },
      });

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      return {
        success: true,
        message: 'Customer found',
        data: customer,
      };
    } catch (error: any) {
      console.error('Search customer by mobile error:', error);
      return {
        success: false,
        message: 'An error occurred while searching customer',
      };
    }
  }

  /**
   * Search customer by email
   */
  static async searchByEmail(email: string): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findOne({
        where: { email },
      });

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      return {
        success: true,
        message: 'Customer found',
        data: customer,
      };
    } catch (error: any) {
      console.error('Search customer by email error:', error);
      return {
        success: false,
        message: 'An error occurred while searching customer',
      };
    }
  }

  /**
   * Get customers by type
   */
  static async getByType(customerType: 'retail' | 'wholesale' | 'vip'): Promise<CustomerServiceResponse> {
    try {
      const customers = await Customer.findAll({
        where: {
          customer_type: customerType,
          is_active: true,
        },
        order: [['created_at', 'DESC']],
      });

      return {
        success: true,
        message: 'Customers retrieved successfully',
        data: customers,
      };
    } catch (error: any) {
      console.error('Get customers by type error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving customers',
      };
    }
  }

  /**
   * Update outstanding balance
   */
  static async updateOutstandingBalance(
    id: number,
    amount: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      let newBalance = customer.outstanding_balance;

      if (operation === 'add') {
        newBalance = Number(customer.outstanding_balance) + amount;
      } else if (operation === 'subtract') {
        newBalance = Number(customer.outstanding_balance) - amount;
      } else if (operation === 'set') {
        newBalance = amount;
      }

      // Check credit limit
      if (newBalance > customer.credit_limit) {
        return {
          success: false,
          message: `Outstanding balance exceeds credit limit of ₹${customer.credit_limit}`,
        };
      }

      await customer.update({
        outstanding_balance: newBalance,
      });

      return {
        success: true,
        message: 'Outstanding balance updated successfully',
        data: customer,
      };
    } catch (error: any) {
      console.error('Update outstanding balance error:', error);
      return {
        success: false,
        message: 'An error occurred while updating outstanding balance',
      };
    }
  }

  /**
   * Add loyalty points
   */
  static async addLoyaltyPoints(id: number, points: number): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      customer.addLoyaltyPoints(points);
      await customer.save();

      return {
        success: true,
        message: 'Loyalty points added successfully',
        data: customer,
      };
    } catch (error: any) {
      console.error('Add loyalty points error:', error);
      return {
        success: false,
        message: 'An error occurred while adding loyalty points',
      };
    }
  }

  /**
   * Redeem loyalty points
   */
  static async redeemLoyaltyPoints(id: number, points: number): Promise<CustomerServiceResponse> {
    try {
      const customer = await Customer.findByPk(id);

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      const redeemed = customer.redeemLoyaltyPoints(points);

      if (!redeemed) {
        return {
          success: false,
          message: 'Insufficient loyalty points',
        };
      }

      await customer.save();

      return {
        success: true,
        message: 'Loyalty points redeemed successfully',
        data: customer,
      };
    } catch (error: any) {
      console.error('Redeem loyalty points error:', error);
      return {
        success: false,
        message: 'An error occurred while redeeming loyalty points',
      };
    }
  }
}

export default CustomerService;
