import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Category Attributes Interface
 */
export interface CategoryAttributes {
  id: number;
  category_code: string;
  category_name: string;
  parent_category_id: number | null;
  hsn_code: string | null;
  description: string | null;
  default_making_charge_percentage: number;
  default_wastage_percentage: number;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Category Creation Attributes
 */
export interface CategoryCreationAttributes
  extends Optional<
    CategoryAttributes,
    | 'id'
    | 'parent_category_id'
    | 'hsn_code'
    | 'description'
    | 'default_making_charge_percentage'
    | 'default_wastage_percentage'
    | 'is_active'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * Category Model Class
 * Manages product categories with hierarchical structure
 */
export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public category_code!: string;
  public category_name!: string;
  public parent_category_id!: number | null;
  public hsn_code!: string | null;
  public description!: string | null;
  public default_making_charge_percentage!: number;
  public default_wastage_percentage!: number;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Get full category path (e.g., "Jewellery > Gold > Rings")
   */
  public async getFullPath(): Promise<string> {
    const path: string[] = [this.category_name];
    let current: Category = this;

    while (current.parent_category_id) {
      const parent = await Category.findByPk(current.parent_category_id);
      if (parent) {
        path.unshift(parent.category_name);
        current = parent;
      } else {
        break;
      }
    }

    return path.join(' > ');
  }

  /**
   * Get all children categories
   */
  public async getChildren(): Promise<Category[]> {
    return Category.findAll({
      where: {
        parent_category_id: this.id,
        is_active: true,
      },
      order: [['category_name', 'ASC']],
    });
  }

  /**
   * Check if category has children
   */
  public async hasChildren(): Promise<boolean> {
    const count = await Category.count({
      where: {
        parent_category_id: this.id,
        is_active: true,
      },
    });
    return count > 0;
  }
}

/**
 * Initialize Category Model
 */
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    parent_category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    hsn_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    default_making_charge_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    default_wastage_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['category_code'],
        unique: true,
      },
      {
        fields: ['parent_category_id'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Category;
