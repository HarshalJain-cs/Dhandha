// @ts-nocheck
import { Stone } from '../database/models/Stone';
import { ProductStone } from '../database/models/ProductStone';
import { Op } from 'sequelize';

/**
 * Stone Service Response Interface
 */
export interface StoneServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Stone Service
 * Handles all stone/diamond operations including product-stone relationships
 */
export class StoneService {
  /**
   * Get all stones
   */
  static async getAll(filters?: {
    is_active?: boolean;
    stone_type?: string;
    search?: string;
  }): Promise<StoneServiceResponse> {
    try {
      const where: any = {};

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.stone_type) {
        where.stone_type = filters.stone_type;
      }

      if (filters?.search) {
        where[Op.or] = [
          { stone_name: { [Op.iLike]: `%${filters.search}%` } },
          { stone_code: { [Op.iLike]: `%${filters.search}%` } },
          { stone_type: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const stones = await Stone.findAll({
        where,
        order: [['stone_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Stones retrieved successfully',
        data: stones,
      };
    } catch (error: any) {
      console.error('Get stones error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stones',
      };
    }
  }

  /**
   * Get stone by ID
   */
  static async getById(id: number): Promise<StoneServiceResponse> {
    try {
      const stone = await Stone.findByPk(id);

      if (!stone) {
        return {
          success: false,
          message: 'Stone not found',
        };
      }

      return {
        success: true,
        message: 'Stone retrieved successfully',
        data: stone,
      };
    } catch (error: any) {
      console.error('Get stone error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stone',
      };
    }
  }

  /**
   * Create new stone
   */
  static async create(data: {
    stone_name: string;
    stone_code: string;
    stone_type: string;
    base_rate_per_carat: number;
    unit?: string;
    description?: string;
    created_by: number;
  }): Promise<StoneServiceResponse> {
    try {
      // Check if stone code already exists
      const existingCode = await Stone.findOne({
        where: { stone_code: data.stone_code },
      });

      if (existingCode) {
        return {
          success: false,
          message: 'Stone code already exists',
        };
      }

      if (data.base_rate_per_carat < 0) {
        return {
          success: false,
          message: 'Base rate cannot be negative',
        };
      }

      const stone = await Stone.create(data);

      return {
        success: true,
        message: 'Stone created successfully',
        data: stone,
      };
    } catch (error: any) {
      console.error('Create stone error:', error);
      return {
        success: false,
        message: 'An error occurred while creating stone',
      };
    }
  }

  /**
   * Update stone
   */
  static async update(
    id: number,
    data: Partial<{
      stone_name: string;
      stone_code: string;
      stone_type: string;
      base_rate_per_carat: number;
      unit: string;
      description: string;
      is_active: boolean;
    }>,
    updated_by: number
  ): Promise<StoneServiceResponse> {
    try {
      const stone = await Stone.findByPk(id);

      if (!stone) {
        return {
          success: false,
          message: 'Stone not found',
        };
      }

      // Check if updating to a code that already exists (excluding current)
      if (data.stone_code) {
        const existingCode = await Stone.findOne({
          where: {
            stone_code: data.stone_code,
            id: { [Op.ne]: id },
          },
        });

        if (existingCode) {
          return {
            success: false,
            message: 'Stone code already exists',
          };
        }
      }

      if (data.base_rate_per_carat !== undefined && data.base_rate_per_carat < 0) {
        return {
          success: false,
          message: 'Base rate cannot be negative',
        };
      }

      await stone.update({
        ...data,
        updated_by,
      });

      return {
        success: true,
        message: 'Stone updated successfully',
        data: stone,
      };
    } catch (error: any) {
      console.error('Update stone error:', error);
      return {
        success: false,
        message: 'An error occurred while updating stone',
      };
    }
  }

  /**
   * Delete stone (soft delete)
   */
  static async delete(id: number, deleted_by: number): Promise<StoneServiceResponse> {
    try {
      const stone = await Stone.findByPk(id);

      if (!stone) {
        return {
          success: false,
          message: 'Stone not found',
        };
      }

      await stone.update({
        is_active: false,
        updated_by: deleted_by,
      });

      return {
        success: true,
        message: 'Stone deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete stone error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting stone',
      };
    }
  }

  /**
   * Add stone to product
   */
  static async addStoneToProduct(data: {
    product_id: number;
    stone_id: number;
    quantity: number;
    carat_weight: number;
    rate_per_carat: number;
    cut_grade?: string;
    color_grade?: string;
    clarity_grade?: string;
    certificate_number?: string;
    certification_lab?: string;
    description?: string;
    created_by: number;
  }): Promise<StoneServiceResponse> {
    try {
      // Validate stone exists
      const stone = await Stone.findByPk(data.stone_id);
      if (!stone) {
        return {
          success: false,
          message: 'Stone not found',
        };
      }

      // Validate quantities
      if (data.quantity <= 0) {
        return {
          success: false,
          message: 'Quantity must be greater than 0',
        };
      }

      if (data.carat_weight <= 0) {
        return {
          success: false,
          message: 'Carat weight must be greater than 0',
        };
      }

      if (data.rate_per_carat < 0) {
        return {
          success: false,
          message: 'Rate per carat cannot be negative',
        };
      }

      const productStone = await ProductStone.create(data);

      return {
        success: true,
        message: 'Stone added to product successfully',
        data: productStone,
      };
    } catch (error: any) {
      console.error('Add stone to product error:', error);
      return {
        success: false,
        message: 'An error occurred while adding stone to product',
      };
    }
  }

  /**
   * Update product stone
   */
  static async updateProductStone(
    id: number,
    data: Partial<{
      quantity: number;
      carat_weight: number;
      rate_per_carat: number;
      cut_grade: string;
      color_grade: string;
      clarity_grade: string;
      certificate_number: string;
      certification_lab: string;
      description: string;
    }>,
    updated_by: number
  ): Promise<StoneServiceResponse> {
    try {
      const productStone = await ProductStone.findByPk(id);

      if (!productStone) {
        return {
          success: false,
          message: 'Product stone record not found',
        };
      }

      // Validate quantities if provided
      if (data.quantity !== undefined && data.quantity <= 0) {
        return {
          success: false,
          message: 'Quantity must be greater than 0',
        };
      }

      if (data.carat_weight !== undefined && data.carat_weight <= 0) {
        return {
          success: false,
          message: 'Carat weight must be greater than 0',
        };
      }

      if (data.rate_per_carat !== undefined && data.rate_per_carat < 0) {
        return {
          success: false,
          message: 'Rate per carat cannot be negative',
        };
      }

      await productStone.update({
        ...data,
        updated_by,
      });

      return {
        success: true,
        message: 'Product stone updated successfully',
        data: productStone,
      };
    } catch (error: any) {
      console.error('Update product stone error:', error);
      return {
        success: false,
        message: 'An error occurred while updating product stone',
      };
    }
  }

  /**
   * Remove stone from product
   */
  static async removeStoneFromProduct(id: number): Promise<StoneServiceResponse> {
    try {
      const productStone = await ProductStone.findByPk(id);

      if (!productStone) {
        return {
          success: false,
          message: 'Product stone record not found',
        };
      }

      await productStone.destroy();

      return {
        success: true,
        message: 'Stone removed from product successfully',
      };
    } catch (error: any) {
      console.error('Remove stone from product error:', error);
      return {
        success: false,
        message: 'An error occurred while removing stone from product',
      };
    }
  }

  /**
   * Get all stones for a product
   */
  static async getProductStones(productId: number): Promise<StoneServiceResponse> {
    try {
      const productStones = await ProductStone.findAll({
        where: { product_id: productId },
        include: [
          {
            model: Stone,
            as: 'stone',
          },
        ],
      });

      // Calculate total stone value and 4C values
      const stonesWithValue = productStones.map((ps) => {
        const baseValue = ps.quantity * ps.carat_weight * ps.rate_per_carat;
        const value4C = ps.calculate4CValue();

        return {
          id: ps.id,
          stone: ps.stone,
          quantity: ps.quantity,
          carat_weight: ps.carat_weight,
          rate_per_carat: ps.rate_per_carat,
          cut_grade: ps.cut_grade,
          color_grade: ps.color_grade,
          clarity_grade: ps.clarity_grade,
          certificate_number: ps.certificate_number,
          certification_lab: ps.certification_lab,
          description: ps.description,
          base_value: baseValue,
          value_with_4c: value4C,
        };
      });

      const totalStoneValue = stonesWithValue.reduce((sum, ps) => sum + ps.value_with_4c, 0);

      return {
        success: true,
        message: 'Product stones retrieved successfully',
        data: {
          stones: stonesWithValue,
          total_stone_value: totalStoneValue,
          total_stones: stonesWithValue.length,
        },
      };
    } catch (error: any) {
      console.error('Get product stones error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving product stones',
      };
    }
  }

  /**
   * Calculate stone value for given parameters
   */
  static async calculateStoneValue(
    stoneId: number,
    caratWeight: number,
    quantity: number = 1
  ): Promise<StoneServiceResponse> {
    try {
      const stone = await Stone.findByPk(stoneId);

      if (!stone) {
        return {
          success: false,
          message: 'Stone not found',
        };
      }

      if (caratWeight <= 0) {
        return {
          success: false,
          message: 'Carat weight must be greater than 0',
        };
      }

      if (quantity <= 0) {
        return {
          success: false,
          message: 'Quantity must be greater than 0',
        };
      }

      const valuePerStone = stone.calculateValue(caratWeight);
      const totalValue = valuePerStone * quantity;

      return {
        success: true,
        message: 'Stone value calculated successfully',
        data: {
          stone_name: stone.stone_name,
          stone_type: stone.stone_type,
          carat_weight: caratWeight,
          quantity,
          rate_per_carat: stone.base_rate_per_carat,
          value_per_stone: valuePerStone,
          total_value: totalValue,
        },
      };
    } catch (error: any) {
      console.error('Calculate stone value error:', error);
      return {
        success: false,
        message: 'An error occurred while calculating stone value',
      };
    }
  }

  /**
   * Get stones by type (Diamond, Ruby, Emerald, etc.)
   */
  static async getByType(stoneType: string): Promise<StoneServiceResponse> {
    try {
      const stones = await Stone.findAll({
        where: {
          stone_type: { [Op.iLike]: `%${stoneType}%` },
          is_active: true,
        },
        order: [['stone_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Stones retrieved successfully',
        data: stones,
      };
    } catch (error: any) {
      console.error('Get stones by type error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stones',
      };
    }
  }

  /**
   * Get unique stone types
   */
  static async getStoneTypes(): Promise<StoneServiceResponse> {
    try {
      const stones = await Stone.findAll({
        attributes: ['stone_type'],
        where: { is_active: true },
        group: ['stone_type'],
        order: [['stone_type', 'ASC']],
      });

      const types = stones.map((s) => s.stone_type);

      return {
        success: true,
        message: 'Stone types retrieved successfully',
        data: types,
      };
    } catch (error: any) {
      console.error('Get stone types error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving stone types',
      };
    }
  }
}

export default StoneService;
