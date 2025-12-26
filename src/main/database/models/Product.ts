import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Product Attributes Interface
 */
export interface ProductAttributes {
  id: number;
  product_code: string;
  barcode: string | null;
  rfid_tag: string | null;
  huid: string | null;
  category_id: number;
  metal_type_id: number;
  product_name: string;
  description: string | null;
  design_number: string | null;
  size: string | null;
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  wastage_percentage: number;
  making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  making_charge: number;
  hallmark_number: string | null;
  hallmark_center: string | null;
  purity: number;
  fine_weight: number;
  quantity: number;
  current_stock: number;
  min_stock_level: number;
  reorder_level: number;
  unit_price: number;
  mrp: number | null;
  location: string | null;
  rack_number: string | null;
  shelf_number: string | null;
  status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  images: string[] | null;
  tags: string[] | null;
  notes: string | null;
  custom_fields: any | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Product Creation Attributes
 */
export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'barcode' | 'rfid_tag' | 'huid' | 'description' | 'design_number' | 'size' | 'stone_weight' | 'fine_weight' | 'wastage_percentage' | 'making_charge' | 'hallmark_number' | 'hallmark_center' | 'quantity' | 'current_stock' | 'min_stock_level' | 'reorder_level' | 'mrp' | 'location' | 'rack_number' | 'shelf_number' | 'status' | 'images' | 'tags' | 'notes' | 'custom_fields' | 'is_active' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'> {}

/**
 * Product Model Class
 */
export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public product_code!: string;
  public barcode!: string | null;
  public rfid_tag!: string | null;
  public huid!: string | null;
  public category_id!: number;
  public metal_type_id!: number;
  public product_name!: string;
  public description!: string | null;
  public design_number!: string | null;
  public size!: string | null;
  public gross_weight!: number;
  public net_weight!: number;
  public stone_weight!: number;
  public wastage_percentage!: number;
  public making_charge_type!: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  public making_charge!: number;
  public hallmark_number!: string | null;
  public hallmark_center!: string | null;
  public purity!: number;
  public fine_weight!: number;
  public quantity!: number;
  public current_stock!: number;
  public min_stock_level!: number;
  public reorder_level!: number;
  public unit_price!: number;
  public mrp!: number | null;
  public location!: string | null;
  public rack_number!: string | null;
  public shelf_number!: string | null;
  public status!: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  public images!: string[] | null;
  public tags!: string[] | null;
  public notes!: string | null;
  public custom_fields!: any | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Calculate total making charge based on type
   */
  public calculateMakingCharge(metalRate: number): number {
    switch (this.making_charge_type) {
      case 'per_gram':
        return this.making_charge * this.net_weight;
      case 'percentage':
        return (this.net_weight * metalRate * this.making_charge) / 100;
      case 'fixed':
        return this.making_charge;
      case 'slab':
        // Slab-based calculation would require additional slab data
        return this.making_charge;
      default:
        return 0;
    }
  }

  /**
   * Calculate total product value
   */
  public calculateTotalValue(metalRate: number, stoneValue: number = 0): number {
    const metalValue = this.net_weight * metalRate;
    const makingCharge = this.calculateMakingCharge(metalRate);
    return metalValue + makingCharge + stoneValue;
  }

  /**
   * Calculate fine weight (pure metal weight)
   */
  public calculateFineWeight(): number {
    return (this.net_weight * this.purity) / 100;
  }

  /**
   * Check if stock is below minimum level
   */
  public checkStockLevel(): { alert: boolean; message: string } {
    if (this.current_stock <= 0) {
      return { alert: true, message: 'Out of stock' };
    }
    if (this.current_stock <= this.min_stock_level) {
      return { alert: true, message: 'Low stock - below minimum level' };
    }
    if (this.current_stock <= this.reorder_level) {
      return { alert: true, message: 'Stock at reorder level' };
    }
    return { alert: false, message: 'Stock level normal' };
  }

  /**
   * Generate unique product code
   * Format: CAT-METAL-YYYYMMDD-###
   * Example: RNG-G22-20250121-001
   */
  public static async generateProductCode(categoryCode: string, metalCode: string): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Find highest sequence number for today
    const pattern = `${categoryCode}-${metalCode}-${dateStr}-%`;
    const products = await Product.findAll({
      where: {
        product_code: {
          [Op.like]: pattern,
        },
      },
      order: [['product_code', 'DESC']],
      limit: 1,
    });

    let sequence = 1;
    if (products.length > 0) {
      const lastCode = products[0].product_code;
      const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `${categoryCode}-${metalCode}-${dateStr}-${seqStr}`;
  }

  /**
   * Validate barcode format (EAN-13)
   */
  public validateBarcode(): boolean {
    if (!this.barcode) return true; // Optional field

    // EAN-13: 13 digits
    const ean13Pattern = /^\d{13}$/;
    if (ean13Pattern.test(this.barcode)) {
      return true;
    }

    // Also allow EAN-8, UPC-A, Code 128
    const ean8Pattern = /^\d{8}$/;
    const upcPattern = /^\d{12}$/;

    return ean8Pattern.test(this.barcode) || upcPattern.test(this.barcode);
  }

  /**
   * Validate RFID tag format (EPC)
   */
  public validateRFID(): boolean {
    if (!this.rfid_tag) return true; // Optional field

    // EPC format: typically 24 or 96 bits in hex
    // Allowing alphanumeric with minimum 8 chars
    const rfidPattern = /^[A-F0-9]{8,}$/i;
    return rfidPattern.test(this.rfid_tag);
  }
}

/**
 * Initialize Product Model
 */
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    rfid_tag: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    huid: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    metal_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'metal_types',
        key: 'id',
      },
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    design_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    gross_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    net_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    stone_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    wastage_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    making_charge_type: {
      type: DataTypes.ENUM('per_gram', 'percentage', 'fixed', 'slab'),
      allowNull: false,
    },
    making_charge: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    hallmark_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    hallmark_center: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    purity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    current_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    min_stock_level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    mrp: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rack_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    shelf_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('in_stock', 'sold', 'reserved', 'in_repair', 'with_karigar'),
      defaultValue: 'in_stock',
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    custom_fields: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    tableName: 'products',
    underscored: true,
    timestamps: true,
  }
);

export default Product;
