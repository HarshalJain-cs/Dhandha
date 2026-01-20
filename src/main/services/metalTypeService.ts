// @ts-nocheck
import { MetalType } from '../database/models/MetalType';
import { Op } from 'sequelize';

/**
 * Metal Type Service Response Interface
 */
export interface MetalTypeServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Metal Type Service
 * Handles all metal type operations including rate management
 */
export class MetalTypeService {
  /**
   * Get all metal types
   */
  static async getAll(filters?: {
    is_active?: boolean;
    search?: string;
  }): Promise<MetalTypeServiceResponse> {
    try {
      const where: any = {};

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.search) {
        where[Op.or] = [
          { metal_name: { [Op.iLike]: `%${filters.search}%` } },
          { metal_code: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const metalTypes = await MetalType.findAll({
        where,
        order: [['metal_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Metal types retrieved successfully',
        data: metalTypes,
      };
    } catch (error: any) {
      console.error('Get metal types error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving metal types',
      };
    }
  }

  /**
   * Get metal type by ID
   */
  static async getById(id: number): Promise<MetalTypeServiceResponse<any>> {
    try {
      const metalType = await MetalType.findByPk(id);

      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      return {
        success: true,
        message: 'Metal type retrieved successfully',
        data: metalType,
      };
    } catch (error: any) {
      console.error('Get metal type error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving metal type',
      };
    }
  }

  /**
   * Create new metal type
   */
  static async create(data: {
    metal_name: string;
    metal_code: string;
    purity_percentage: number;
    current_rate_per_gram: number;
    unit?: string;
    created_by: number;
  }): Promise<MetalTypeServiceResponse> {
    try {
      // Check if metal code already exists
      const existingCode = await MetalType.findOne({
        where: { metal_code: data.metal_code },
      });

      if (existingCode) {
        return {
          success: false,
          message: 'Metal code already exists',
        };
      }

      // Validate purity percentage (0-100)
      if (data.purity_percentage < 0 || data.purity_percentage > 100) {
        return {
          success: false,
          message: 'Purity percentage must be between 0 and 100',
        };
      }

      const metalType = await MetalType.create(data);

      return {
        success: true,
        message: 'Metal type created successfully',
        data: metalType,
      };
    } catch (error: any) {
      console.error('Create metal type error:', error);
      return {
        success: false,
        message: 'An error occurred while creating metal type',
      };
    }
  }

  /**
   * Update metal type
   */
  static async update(
    id: number,
    data: Partial<{
      metal_name: string;
      metal_code: string;
      purity_percentage: number;
      current_rate_per_gram: number;
      unit: string;
      is_active: boolean;
    }>,
    updated_by: number
  ): Promise<MetalTypeServiceResponse> {
    try {
      const metalType = await MetalType.findByPk(id);

      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      // Check if updating to a code that already exists (excluding current)
      if (data.metal_code) {
        const existingCode = await MetalType.findOne({
          where: {
            metal_code: data.metal_code,
            id: { [Op.ne]: id },
          },
        });

        if (existingCode) {
          return {
            success: false,
            message: 'Metal code already exists',
          };
        }
      }

      // Validate purity percentage if provided
      if (data.purity_percentage !== undefined) {
        if (data.purity_percentage < 0 || data.purity_percentage > 100) {
          return {
            success: false,
            message: 'Purity percentage must be between 0 and 100',
          };
        }
      }

      await metalType.update({
        ...data,
        updated_by,
      });

      return {
        success: true,
        message: 'Metal type updated successfully',
        data: metalType,
      };
    } catch (error: any) {
      console.error('Update metal type error:', error);
      return {
        success: false,
        message: 'An error occurred while updating metal type',
      };
    }
  }

  /**
   * Delete metal type (soft delete)
   */
  static async delete(id: number, deleted_by: number): Promise<MetalTypeServiceResponse<any>> {
    try {
      const metalType = await MetalType.findByPk(id);

      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      await metalType.update({
        is_active: false,
        updated_by: deleted_by,
      });

      return {
        success: true,
        message: 'Metal type deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete metal type error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting metal type',
      };
    }
  }

  /**
   * Update current rate for a metal type
   */
  static async updateRate(
    id: number,
    newRate: number,
    updated_by: number
  ): Promise<MetalTypeServiceResponse> {
    try {
      const metalType = await MetalType.findByPk(id);

      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      if (newRate < 0) {
        return {
          success: false,
          message: 'Rate cannot be negative',
        };
      }

      await metalType.update({
        current_rate_per_gram: newRate,
        updated_by,
      });

      return {
        success: true,
        message: 'Metal rate updated successfully',
        data: metalType,
      };
    } catch (error: any) {
      console.error('Update metal rate error:', error);
      return {
        success: false,
        message: 'An error occurred while updating metal rate',
      };
    }
  }

  /**
   * Get current rates for all active metal types
   */
  static async getCurrentRates(): Promise<MetalTypeServiceResponse<any>> {
    try {
      const metalTypes = await MetalType.findAll({
        where: { is_active: true },
        attributes: ['id', 'metal_name', 'metal_code', 'purity_percentage', 'current_rate_per_gram', 'unit'],
        order: [['metal_name', 'ASC']],
      });

      const rates = await Promise.all(
        metalTypes.map(async (metalType) => {
          const currentRate = await metalType.getCurrentRate();
          return {
            id: metalType.id,
            metal_name: metalType.metal_name,
            metal_code: metalType.metal_code,
            purity_percentage: metalType.purity_percentage,
            rate_per_gram: currentRate,
            unit: metalType.unit,
          };
        })
      );

      return {
        success: true,
        message: 'Current rates retrieved successfully',
        data: rates,
      };
    } catch (error: any) {
      console.error('Get current rates error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving current rates',
      };
    }
  }

  /**
   * Calculate fine weight for given gross weight and metal type
   */
  static async calculateFineWeight(
    metalTypeId: number,
    grossWeight: number
  ): Promise<MetalTypeServiceResponse> {
    try {
      const metalType = await MetalType.findByPk(metalTypeId);

      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      if (grossWeight < 0) {
        return {
          success: false,
          message: 'Gross weight cannot be negative',
        };
      }

      const fineWeight = metalType.calculateFineWeight(grossWeight);

      return {
        success: true,
        message: 'Fine weight calculated successfully',
        data: {
          metal_type: metalType.metal_name,
          purity_percentage: metalType.purity_percentage,
          gross_weight: grossWeight,
          fine_weight: fineWeight,
        },
      };
    } catch (error: any) {
      console.error('Calculate fine weight error:', error);
      return {
        success: false,
        message: 'An error occurred while calculating fine weight',
      };
    }
  }

  /**
   * Get metal types by metal name (e.g., all Gold variants)
   */
  static async getByMetalName(metalName: string): Promise<MetalTypeServiceResponse> {
    try {
      const metalTypes = await MetalType.findAll({
        where: {
          metal_name: { [Op.iLike]: `%${metalName}%` },
          is_active: true,
        },
        order: [['purity_percentage', 'DESC']],
      });

      return {
        success: true,
        message: 'Metal types retrieved successfully',
        data: metalTypes,
      };
    } catch (error: any) {
      console.error('Get metal types by name error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving metal types',
      };
    }
  }

  /**
   * Calculate metal value
   */
  static async calculateMetalValue(
    metalTypeId: number,
    grossWeight: number
  ): Promise<MetalTypeServiceResponse> {
    try {
      const metalType = await MetalType.findByPk(metalTypeId);

      if (!metalType) {
        return {
          success: false,
          message: 'Metal type not found',
        };
      }

      if (grossWeight < 0) {
        return {
          success: false,
          message: 'Gross weight cannot be negative',
        };
      }

      const fineWeight = metalType.calculateFineWeight(grossWeight);
      const currentRate = await metalType.getCurrentRate();
      const metalValue = fineWeight * currentRate;

      return {
        success: true,
        message: 'Metal value calculated successfully',
        data: {
          metal_type: metalType.metal_name,
          purity_percentage: metalType.purity_percentage,
          gross_weight: grossWeight,
          fine_weight: fineWeight,
          rate_per_gram: currentRate,
          metal_value: metalValue,
        },
      };
    } catch (error: any) {
      console.error('Calculate metal value error:', error);
      return {
        success: false,
        message: 'An error occurred while calculating metal value',
      };
    }
  }
}

export default MetalTypeService;
