import { Product } from '../database/models/Product';
import { Category } from '../database/models/Category';
import { MetalType } from '../database/models/MetalType';
import { ProductStone } from '../database/models/ProductStone';
import { Stone } from '../database/models/Stone';
import { Op } from 'sequelize';

/**
 * Product Service Response Interface
 */
export interface ProductServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Product Filter Interface
 */
export interface ProductFilters {
  is_active?: boolean;
  category_id?: number;
  metal_type_id?: number;
  status?: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  search?: string;
  min_price?: number;
  max_price?: number;
  min_weight?: number;
  max_weight?: number;
  tags?: string[];
  low_stock?: boolean;
  out_of_stock?: boolean;
}

/**
 * Product Service
 * Handles all product-related operations
 */
export class ProductService {
  /**
   * Create new product
   */
  static async create(data: {
    category_id: number;
    metal_type_id: number;
    product_name: string;
    description?: string;
    design_number?: string;
    size?: string;
    gross_weight: number;
    net_weight: number;
    stone_weight?: number;
    wastage_percentage?: number;
    making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
    making_charge?: number;
    purity: number;
    unit_price: number;
    mrp?: number;
    quantity?: number;
    current_stock?: number;
    min_stock_level?: number;
    reorder_level?: number;
    location?: string;
    rack_number?: string;
    shelf_number?: string;
    barcode?: string;
    rfid_tag?: string;
    huid?: string;
    hallmark_number?: string;
    hallmark_center?: string;
    images?: string[];
    tags?: string[];
    notes?: string;
    custom_fields?: any;
    created_by: number;
  }): Promise<ProductServiceResponse> {
    try {
      // Validate category exists
      const category = await Category.findByPk(data.category_id);
      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      // Validate metal type exists
      const metalType = await MetalType.findByPk(data.metal_type_id);
      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      // Generate product code
      const productCode = await Product.generateProductCode(
        category.category_code,
        metalType.metal_code
      );

      // Validate barcode uniqueness if provided
      if (data.barcode) {
        const existingBarcode = await Product.findOne({
          where: { barcode: data.barcode },
        });
        if (existingBarcode) {
          return {
            success: false,
            message: 'Barcode already exists',
          };
        }
      }

      // Validate RFID uniqueness if provided
      if (data.rfid_tag) {
        const existingRFID = await Product.findOne({
          where: { rfid_tag: data.rfid_tag },
        });
        if (existingRFID) {
          return {
            success: false,
            message: 'RFID tag already exists',
          };
        }
      }

      // Calculate fine weight
      const fineWeight = (data.net_weight * data.purity) / 100;

      // Create product
      const product = await Product.create({
        ...data,
        product_code: productCode,
        fine_weight: fineWeight,
        status: 'in_stock',
      });

      // Validate barcode and RFID formats
      if (!product.validateBarcode()) {
        await product.destroy();
        return {
          success: false,
          message: 'Invalid barcode format',
        };
      }

      if (!product.validateRFID()) {
        await product.destroy();
        return {
          success: false,
          message: 'Invalid RFID tag format',
        };
      }

      return {
        success: true,
        message: 'Product created successfully',
        data: product,
      };
    } catch (error: any) {
      console.error('Create product error:', error);
      return {
        success: false,
        message: 'An error occurred while creating product',
      };
    }
  }

  /**
   * Get all products with filtering
   */
  static async getAll(filters?: ProductFilters, pagination?: {
    page: number;
    limit: number;
  }): Promise<ProductServiceResponse> {
    try {
      const where: any = {};

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.category_id) {
        where.category_id = filters.category_id;
      }

      if (filters?.metal_type_id) {
        where.metal_type_id = filters.metal_type_id;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.search) {
        where[Op.or] = [
          { product_name: { [Op.iLike]: `%${filters.search}%` } },
          { product_code: { [Op.iLike]: `%${filters.search}%` } },
          { barcode: { [Op.iLike]: `%${filters.search}%` } },
          { description: { [Op.iLike]: `%${filters.search}%` } },
          { design_number: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      if (filters?.min_price !== undefined || filters?.max_price !== undefined) {
        where.unit_price = {};
        if (filters.min_price !== undefined) {
          where.unit_price[Op.gte] = filters.min_price;
        }
        if (filters.max_price !== undefined) {
          where.unit_price[Op.lte] = filters.max_price;
        }
      }

      if (filters?.min_weight !== undefined || filters?.max_weight !== undefined) {
        where.gross_weight = {};
        if (filters.min_weight !== undefined) {
          where.gross_weight[Op.gte] = filters.min_weight;
        }
        if (filters.max_weight !== undefined) {
          where.gross_weight[Op.lte] = filters.max_weight;
        }
      }

      if (filters?.tags && filters.tags.length > 0) {
        where.tags = {
          [Op.overlap]: filters.tags,
        };
      }

      if (filters?.low_stock) {
        where[Op.and] = [
          { current_stock: { [Op.gt]: 0 } },
          { current_stock: { [Op.lte]: Op.col('min_stock_level') } },
        ];
      }

      if (filters?.out_of_stock) {
        where.current_stock = 0;
      }

      const queryOptions: any = {
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name', 'category_code'],
          },
          {
            model: MetalType,
            as: 'metalType',
            attributes: ['id', 'metal_name', 'metal_code', 'purity_percentage'],
          },
        ],
        order: [['created_at', 'DESC']],
      };

      if (pagination) {
        queryOptions.limit = pagination.limit;
        queryOptions.offset = (pagination.page - 1) * pagination.limit;
      }

      const { rows: products, count: total } = await Product.findAndCountAll(queryOptions);

      return {
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products,
          total,
          page: pagination?.page || 1,
          limit: pagination?.limit || total,
          totalPages: pagination ? Math.ceil(total / pagination.limit) : 1,
        },
      };
    } catch (error: any) {
      console.error('Get products error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving products',
      };
    }
  }

  /**
   * Get product by ID with full details
   */
  static async getById(id: number): Promise<ProductServiceResponse> {
    try {
      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
          },
          {
            model: MetalType,
            as: 'metalType',
          },
          {
            model: ProductStone,
            as: 'stones',
            include: [
              {
                model: Stone,
                as: 'stone',
              },
            ],
          },
        ],
      });

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      // Calculate stock level alert
      const stockAlert = product.checkStockLevel();

      // Calculate total stone value if stones exist
      let totalStoneValue = 0;
      if (product.stones && product.stones.length > 0) {
        totalStoneValue = product.stones.reduce((sum, ps) => {
          return sum + ps.calculate4CValue();
        }, 0);
      }

      return {
        success: true,
        message: 'Product retrieved successfully',
        data: {
          ...product.toJSON(),
          stock_alert: stockAlert,
          total_stone_value: totalStoneValue,
        },
      };
    } catch (error: any) {
      console.error('Get product error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving product',
      };
    }
  }

  /**
   * Update product
   */
  static async update(
    id: number,
    data: Partial<{
      category_id: number;
      metal_type_id: number;
      product_name: string;
      description: string;
      design_number: string;
      size: string;
      gross_weight: number;
      net_weight: number;
      stone_weight: number;
      wastage_percentage: number;
      making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
      making_charge: number;
      purity: number;
      unit_price: number;
      mrp: number;
      current_stock: number;
      min_stock_level: number;
      reorder_level: number;
      location: string;
      rack_number: string;
      shelf_number: string;
      barcode: string;
      rfid_tag: string;
      huid: string;
      hallmark_number: string;
      hallmark_center: string;
      status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
      images: string[];
      tags: string[];
      notes: string;
      custom_fields: any;
      is_active: boolean;
    }>,
    updated_by: number
  ): Promise<ProductServiceResponse> {
    try {
      const product = await Product.findByPk(id);

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      // Validate category if being updated
      if (data.category_id) {
        const category = await Category.findByPk(data.category_id);
        if (!category) {
          return {
            success: false,
            message: 'Category not found',
          };
        }
      }

      // Validate metal type if being updated
      if (data.metal_type_id) {
        const metalType = await MetalType.findByPk(data.metal_type_id);
        if (!metalType) {
          return {
            success: false,
            message: 'Metal type not found',
          };
        }
      }

      // Check barcode uniqueness if being updated
      if (data.barcode) {
        const existingBarcode = await Product.findOne({
          where: {
            barcode: data.barcode,
            id: { [Op.ne]: id },
          },
        });
        if (existingBarcode) {
          return {
            success: false,
            message: 'Barcode already exists',
          };
        }
      }

      // Check RFID uniqueness if being updated
      if (data.rfid_tag) {
        const existingRFID = await Product.findOne({
          where: {
            rfid_tag: data.rfid_tag,
            id: { [Op.ne]: id },
          },
        });
        if (existingRFID) {
          return {
            success: false,
            message: 'RFID tag already exists',
          };
        }
      }

      // Recalculate fine weight if net_weight or purity changed
      if (data.net_weight !== undefined || data.purity !== undefined) {
        const newNetWeight = data.net_weight !== undefined ? data.net_weight : product.net_weight;
        const newPurity = data.purity !== undefined ? data.purity : product.purity;
        data.fine_weight = (newNetWeight * newPurity) / 100;
      }

      await product.update({
        ...data,
        updated_by,
      });

      return {
        success: true,
        message: 'Product updated successfully',
        data: product,
      };
    } catch (error: any) {
      console.error('Update product error:', error);
      return {
        success: false,
        message: 'An error occurred while updating product',
      };
    }
  }

  /**
   * Delete product (soft delete)
   */
  static async delete(id: number, deleted_by: number): Promise<ProductServiceResponse> {
    try {
      const product = await Product.findByPk(id);

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      await product.update({
        is_active: false,
        updated_by: deleted_by,
      });

      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete product error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting product',
      };
    }
  }

  /**
   * Update stock quantity
   */
  static async updateStock(
    id: number,
    quantity: number,
    operation: 'add' | 'subtract' | 'set',
    updated_by: number
  ): Promise<ProductServiceResponse> {
    try {
      const product = await Product.findByPk(id);

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      let newStock = product.current_stock;

      switch (operation) {
        case 'add':
          newStock += quantity;
          break;
        case 'subtract':
          newStock -= quantity;
          if (newStock < 0) {
            return {
              success: false,
              message: 'Insufficient stock',
            };
          }
          break;
        case 'set':
          newStock = quantity;
          break;
      }

      await product.update({
        current_stock: newStock,
        updated_by,
      });

      const stockAlert = product.checkStockLevel();

      return {
        success: true,
        message: 'Stock updated successfully',
        data: {
          product,
          stock_alert: stockAlert,
        },
      };
    } catch (error: any) {
      console.error('Update stock error:', error);
      return {
        success: false,
        message: 'An error occurred while updating stock',
      };
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(): Promise<ProductServiceResponse> {
    try {
      const products = await Product.findAll({
        where: {
          is_active: true,
          current_stock: {
            [Op.and]: [
              { [Op.gt]: 0 },
              { [Op.lte]: Op.col('min_stock_level') },
            ],
          },
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name', 'category_code'],
          },
          {
            model: MetalType,
            as: 'metalType',
            attributes: ['id', 'metal_name', 'metal_code'],
          },
        ],
        order: [['current_stock', 'ASC']],
      });

      return {
        success: true,
        message: 'Low stock products retrieved successfully',
        data: products,
      };
    } catch (error: any) {
      console.error('Get low stock products error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving low stock products',
      };
    }
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts(): Promise<ProductServiceResponse> {
    try {
      const products = await Product.findAll({
        where: {
          is_active: true,
          current_stock: 0,
        },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'category_name', 'category_code'],
          },
          {
            model: MetalType,
            as: 'metalType',
            attributes: ['id', 'metal_name', 'metal_code'],
          },
        ],
        order: [['product_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Out of stock products retrieved successfully',
        data: products,
      };
    } catch (error: any) {
      console.error('Get out of stock products error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving out of stock products',
      };
    }
  }

  /**
   * Search products by barcode
   */
  static async searchByBarcode(barcode: string): Promise<ProductServiceResponse> {
    try {
      const product = await Product.findOne({
        where: { barcode },
        include: [
          {
            model: Category,
            as: 'category',
          },
          {
            model: MetalType,
            as: 'metalType',
          },
          {
            model: ProductStone,
            as: 'stones',
            include: [
              {
                model: Stone,
                as: 'stone',
              },
            ],
          },
        ],
      });

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      return {
        success: true,
        message: 'Product found',
        data: product,
      };
    } catch (error: any) {
      console.error('Search by barcode error:', error);
      return {
        success: false,
        message: 'An error occurred while searching product',
      };
    }
  }

  /**
   * Search products by RFID
   */
  static async searchByRFID(rfidTag: string): Promise<ProductServiceResponse> {
    try {
      const product = await Product.findOne({
        where: { rfid_tag: rfidTag },
        include: [
          {
            model: Category,
            as: 'category',
          },
          {
            model: MetalType,
            as: 'metalType',
          },
          {
            model: ProductStone,
            as: 'stones',
            include: [
              {
                model: Stone,
                as: 'stone',
              },
            ],
          },
        ],
      });

      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      return {
        success: true,
        message: 'Product found',
        data: product,
      };
    } catch (error: any) {
      console.error('Search by RFID error:', error);
      return {
        success: false,
        message: 'An error occurred while searching product',
      };
    }
  }

  /**
   * Get products by category
   */
  static async getByCategory(categoryId: number): Promise<ProductServiceResponse> {
    try {
      const products = await Product.findAll({
        where: {
          category_id: categoryId,
          is_active: true,
        },
        include: [
          {
            model: MetalType,
            as: 'metalType',
          },
        ],
        order: [['product_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      };
    } catch (error: any) {
      console.error('Get products by category error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving products',
      };
    }
  }

  /**
   * Get products by tags
   */
  static async getByTags(tags: string[]): Promise<ProductServiceResponse> {
    try {
      const products = await Product.findAll({
        where: {
          tags: {
            [Op.overlap]: tags,
          },
          is_active: true,
        },
        include: [
          {
            model: Category,
            as: 'category',
          },
          {
            model: MetalType,
            as: 'metalType',
          },
        ],
        order: [['product_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      };
    } catch (error: any) {
      console.error('Get products by tags error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving products',
      };
    }
  }

  /**
   * Generate product code
   */
  static async generateCode(categoryId: number, metalTypeId: number): Promise<ProductServiceResponse> {
    try {
      const category = await Category.findByPk(categoryId);
      const metalType = await MetalType.findByPk(metalTypeId);

      if (!category || !metalType) {
        return {
          success: false,
          message: 'Category or Metal Type not found',
        };
      }

      const productCode = await Product.generateProductCode(
        category.category_code,
        metalType.metal_code
      );

      return {
        success: true,
        message: 'Product code generated successfully',
        data: { product_code: productCode },
      };
    } catch (error: any) {
      console.error('Generate product code error:', error);
      return {
        success: false,
        message: 'An error occurred while generating product code',
      };
    }
  }
}

export default ProductService;
