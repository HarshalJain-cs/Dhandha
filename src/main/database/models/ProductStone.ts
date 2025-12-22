import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * ProductStone Attributes Interface
 * Junction table for many-to-many relationship between Products and Stones
 */
export interface ProductStoneAttributes {
  id: number;
  product_id: number;
  stone_id: number;
  carat_weight: number;
  quantity: number;
  cut_grade: string | null;
  color_grade: string | null;
  clarity_grade: string | null;
  certificate_number: string | null;
  certificate_authority: string | null;
  certificate_url: string | null;
  stone_weight: number;
  rate_per_carat: number;
  total_value: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * ProductStone Creation Attributes
 */
export interface ProductStoneCreationAttributes
  extends Optional<
    ProductStoneAttributes,
    | 'id'
    | 'quantity'
    | 'cut_grade'
    | 'color_grade'
    | 'clarity_grade'
    | 'certificate_number'
    | 'certificate_authority'
    | 'certificate_url'
    | 'stone_weight'
    | 'total_value'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * ProductStone Model Class
 * Tracks stones/diamonds embedded in products with grading details (4C's)
 */
export class ProductStone
  extends Model<ProductStoneAttributes, ProductStoneCreationAttributes>
  implements ProductStoneAttributes
{
  public id!: number;
  public product_id!: number;
  public stone_id!: number;
  public carat_weight!: number;
  public quantity!: number;
  public cut_grade!: string | null;
  public color_grade!: string | null;
  public clarity_grade!: string | null;
  public certificate_number!: string | null;
  public certificate_authority!: string | null;
  public certificate_url!: string | null;
  public stone_weight!: number;
  public rate_per_carat!: number;
  public total_value!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Calculate 4C value (Cut, Color, Clarity, Carat)
   * Enhanced value based on diamond grading
   */
  public calculate4CValue(): number {
    let baseValue = this.carat_weight * this.rate_per_carat * this.quantity;

    // Apply multipliers based on grades (simplified logic)
    // In production, use actual diamond pricing tables

    // Cut grade multiplier
    const cutMultipliers: { [key: string]: number } = {
      Excellent: 1.2,
      'Very Good': 1.1,
      Good: 1.0,
      Fair: 0.9,
      Poor: 0.8,
    };

    // Color grade multiplier (D is best, Z is worst)
    const colorMultipliers: { [key: string]: number } = {
      D: 1.3,
      E: 1.25,
      F: 1.2,
      G: 1.15,
      H: 1.1,
      I: 1.05,
      J: 1.0,
    };

    // Clarity grade multiplier
    const clarityMultipliers: { [key: string]: number } = {
      FL: 1.4,
      IF: 1.35,
      VVS1: 1.3,
      VVS2: 1.25,
      VS1: 1.2,
      VS2: 1.15,
      SI1: 1.1,
      SI2: 1.05,
      I1: 1.0,
    };

    if (this.cut_grade && cutMultipliers[this.cut_grade]) {
      baseValue *= cutMultipliers[this.cut_grade];
    }

    if (this.color_grade && colorMultipliers[this.color_grade]) {
      baseValue *= colorMultipliers[this.color_grade];
    }

    if (this.clarity_grade && clarityMultipliers[this.clarity_grade]) {
      baseValue *= clarityMultipliers[this.clarity_grade];
    }

    return baseValue;
  }

  /**
   * Validate certificate number format
   */
  public validateCertificate(): boolean {
    if (!this.certificate_number || !this.certificate_authority) {
      return true; // Optional fields
    }

    // GIA certificate: 10-17 digits
    if (this.certificate_authority === 'GIA') {
      return /^[0-9]{10,17}$/.test(this.certificate_number);
    }

    // IGI certificate: alphanumeric
    if (this.certificate_authority === 'IGI') {
      return /^[A-Z0-9]{8,15}$/.test(this.certificate_number);
    }

    return true; // Other authorities
  }

  /**
   * Get 4C's summary string
   */
  public get4CSummary(): string {
    const parts: string[] = [];

    if (this.carat_weight) parts.push(`${this.carat_weight}ct`);
    if (this.cut_grade) parts.push(`Cut: ${this.cut_grade}`);
    if (this.color_grade) parts.push(`Color: ${this.color_grade}`);
    if (this.clarity_grade) parts.push(`Clarity: ${this.clarity_grade}`);

    return parts.join(', ');
  }
}

/**
 * Initialize ProductStone Model
 */
ProductStone.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    stone_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stones',
        key: 'id',
      },
    },
    carat_weight: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    cut_grade: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    color_grade: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    clarity_grade: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    certificate_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    certificate_authority: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    certificate_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stone_weight: {
      type: DataTypes.DECIMAL(6, 3),
      allowNull: false,
      defaultValue: 0,
    },
    rate_per_carat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'product_stones',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeSave: (productStone: ProductStone) => {
        // Auto-calculate total value
        productStone.total_value = productStone.calculate4CValue();

        // Auto-calculate stone weight (carat to grams: 1 carat = 0.2 grams)
        productStone.stone_weight = productStone.carat_weight * 0.2 * productStone.quantity;
      },
    },
    indexes: [
      {
        fields: ['product_id'],
      },
      {
        fields: ['stone_id'],
      },
    ],
  }
);

export default ProductStone;
