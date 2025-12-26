// @ts-nocheck
import { Category } from '../database/models/Category';
import { Op } from 'sequelize';

/**
 * Category Service Response Interface
 */
export interface CategoryServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Category Tree Interface
 */
export interface CategoryTreeNode {
  id: number;
  category_name: string;
  category_code: string;
  parent_category_id: number | null;
  description: string | null;
  hsn_code: string | null;
  tax_percentage: number;
  is_active: boolean;
  children: CategoryTreeNode[];
  level: number;
  path: string;
}

/**
 * Category Service
 * Handles all category-related operations including hierarchical management
 */
export class CategoryService {
  /**
   * Create new category
   */
  static async create(data: {
    category_name: string;
    category_code: string;
    parent_category_id?: number;
    description?: string;
    hsn_code?: string;
    tax_percentage?: number;
    created_by: number;
  }): Promise<CategoryServiceResponse> {
    try {
      // Check if category code already exists
      const existingCode = await Category.findOne({
        where: { category_code: data.category_code },
      });

      if (existingCode) {
        return {
          success: false,
          message: 'Category code already exists',
        };
      }

      // Check if category name already exists under the same parent
      const existingName = await Category.findOne({
        where: {
          category_name: data.category_name,
          parent_category_id: data.parent_category_id || null,
        },
      });

      if (existingName) {
        return {
          success: false,
          message: 'Category with this name already exists under the same parent',
        };
      }

      // Validate parent exists if provided
      if (data.parent_category_id) {
        const parent = await Category.findByPk(data.parent_category_id);
        if (!parent) {
          return {
            success: false,
            message: 'Parent category not found',
          };
        }
      }

      const category = await Category.create(data);

      return {
        success: true,
        message: 'Category created successfully',
        data: category,
      };
    } catch (error: any) {
      console.error('Create category error:', error);
      return {
        success: false,
        message: 'An error occurred while creating category',
      };
    }
  }

  /**
   * Get all categories (flat list)
   */
  static async getAll(filters?: {
    is_active?: boolean;
    parent_category_id?: number | null;
    search?: string;
  }): Promise<CategoryServiceResponse> {
    try {
      const where: any = {};

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.parent_category_id !== undefined) {
        where.parent_category_id = filters.parent_category_id;
      }

      if (filters?.search) {
        where[Op.or] = [
          { category_name: { [Op.iLike]: `%${filters.search}%` } },
          { category_code: { [Op.iLike]: `%${filters.search}%` } },
          { description: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const categories = await Category.findAll({
        where,
        order: [['category_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      };
    } catch (error: any) {
      console.error('Get categories error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving categories',
      };
    }
  }

  /**
   * Get category by ID
   */
  static async getById(id: number): Promise<CategoryServiceResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      return {
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      };
    } catch (error: any) {
      console.error('Get category error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category',
      };
    }
  }

  /**
   * Update category
   */
  static async update(
    id: number,
    data: Partial<{
      category_name: string;
      category_code: string;
      parent_category_id: number;
      description: string;
      hsn_code: string;
      tax_percentage: number;
      is_active: boolean;
    }>,
    updated_by: number
  ): Promise<CategoryServiceResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      // Check if updating to a code that already exists (excluding current)
      if (data.category_code) {
        const existingCode = await Category.findOne({
          where: {
            category_code: data.category_code,
            id: { [Op.ne]: id },
          },
        });

        if (existingCode) {
          return {
            success: false,
            message: 'Category code already exists',
          };
        }
      }

      // Prevent setting self as parent
      if (data.parent_category_id && data.parent_category_id === id) {
        return {
          success: false,
          message: 'Category cannot be its own parent',
        };
      }

      // Prevent circular parent-child relationships
      if (data.parent_category_id) {
        const isCircular = await this.checkCircularReference(id, data.parent_category_id);
        if (isCircular) {
          return {
            success: false,
            message: 'Cannot set parent: would create circular reference',
          };
        }
      }

      await category.update({
        ...data,
        updated_by,
      });

      return {
        success: true,
        message: 'Category updated successfully',
        data: category,
      };
    } catch (error: any) {
      console.error('Update category error:', error);
      return {
        success: false,
        message: 'An error occurred while updating category',
      };
    }
  }

  /**
   * Delete category (soft delete by setting is_active to false)
   */
  static async delete(id: number, deleted_by: number): Promise<CategoryServiceResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      // Check if category has children
      const children = await Category.findAll({
        where: {
          parent_category_id: id,
          is_active: true,
        },
      });

      if (children.length > 0) {
        return {
          success: false,
          message: 'Cannot delete category with active subcategories',
        };
      }

      await category.update({
        is_active: false,
        updated_by: deleted_by,
      });

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete category error:', error);
      return {
        success: false,
        message: 'An error occurred while deleting category',
      };
    }
  }

  /**
   * Get category tree (hierarchical structure)
   */
  static async getTree(parentId: number | null = null): Promise<CategoryServiceResponse> {
    try {
      const buildTree = async (parentId: number | null, level: number = 0): Promise<CategoryTreeNode[]> => {
        const categories = await Category.findAll({
          where: {
            parent_category_id: parentId,
            is_active: true,
          },
          order: [['category_name', 'ASC']],
        });

        const treeNodes: CategoryTreeNode[] = [];

        for (const category of categories) {
          const path = await category.getFullPath();
          const children = await buildTree(category.id, level + 1);

          treeNodes.push({
            id: category.id,
            category_name: category.category_name,
            category_code: category.category_code,
            parent_category_id: category.parent_category_id,
            description: category.description,
            hsn_code: category.hsn_code,
            tax_percentage: category.tax_percentage,
            is_active: category.is_active,
            children,
            level,
            path,
          });
        }

        return treeNodes;
      };

      const tree = await buildTree(parentId);

      return {
        success: true,
        message: 'Category tree retrieved successfully',
        data: tree,
      };
    } catch (error: any) {
      console.error('Get category tree error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category tree',
      };
    }
  }

  /**
   * Get children of a category
   */
  static async getChildren(parentId: number): Promise<CategoryServiceResponse> {
    try {
      const parent = await Category.findByPk(parentId);

      if (!parent) {
        return {
          success: false,
          message: 'Parent category not found',
        };
      }

      const children = await parent.getChildren();

      return {
        success: true,
        message: 'Child categories retrieved successfully',
        data: children,
      };
    } catch (error: any) {
      console.error('Get children error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving child categories',
      };
    }
  }

  /**
   * Get full path of a category
   */
  static async getFullPath(id: number): Promise<CategoryServiceResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      const path = await category.getFullPath();

      return {
        success: true,
        message: 'Category path retrieved successfully',
        data: { path },
      };
    } catch (error: any) {
      console.error('Get category path error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category path',
      };
    }
  }

  /**
   * Check for circular reference in category hierarchy
   */
  private static async checkCircularReference(categoryId: number, newParentId: number): Promise<boolean> {
    let currentId: number | null = newParentId;

    while (currentId !== null) {
      if (currentId === categoryId) {
        return true; // Circular reference detected
      }

      const parent = await Category.findByPk(currentId);
      if (!parent) {
        break;
      }

      currentId = parent.parent_category_id;
    }

    return false;
  }

  /**
   * Get root categories (top-level categories with no parent)
   */
  static async getRootCategories(): Promise<CategoryServiceResponse> {
    try {
      const categories = await Category.findAll({
        where: {
          parent_category_id: null,
          is_active: true,
        },
        order: [['category_name', 'ASC']],
      });

      return {
        success: true,
        message: 'Root categories retrieved successfully',
        data: categories,
      };
    } catch (error: any) {
      console.error('Get root categories error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving root categories',
      };
    }
  }

  /**
   * Get category breadcrumb (path as array of categories)
   */
  static async getBreadcrumb(id: number): Promise<CategoryServiceResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      const breadcrumb: Array<{ id: number; name: string; code: string }> = [];
      let current: Category | null = category;

      while (current) {
        breadcrumb.unshift({
          id: current.id,
          name: current.category_name,
          code: current.category_code,
        });

        if (current.parent_category_id) {
          current = await Category.findByPk(current.parent_category_id);
        } else {
          current = null;
        }
      }

      return {
        success: true,
        message: 'Category breadcrumb retrieved successfully',
        data: breadcrumb,
      };
    } catch (error: any) {
      console.error('Get category breadcrumb error:', error);
      return {
        success: false,
        message: 'An error occurred while retrieving category breadcrumb',
      };
    }
  }
}

export default CategoryService;
