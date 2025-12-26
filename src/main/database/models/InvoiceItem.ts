import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * InvoiceItem Attributes Interface
 */
export interface InvoiceItemAttributes {
  id: number;
  invoice_id: number;
  product_id: number;

  // Product Details (snapshot at time of sale)
  product_code: string;
  product_name: string;
  barcode: string | null;
  huid: string | null;
  category_name: string;
  metal_type_name: string;

  // Weight Details
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  fine_weight: number;
  purity: number;

  // Pricing
  metal_rate: number; // Rate per gram at time of sale
  quantity: number;
  wastage_percentage: number;
  wastage_amount: number;

  // Making Charges
  making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  making_charge_rate: number;
  making_charge_amount: number;

  // Stone Details
  stone_details: any | null; // JSON with stone information
  stone_amount: number;

  // HSN and Tax
  hsn_code: string;
  tax_rate: number; // GST rate (3% for metal, 5% for making)

  // Line Item Amounts
  metal_amount: number; // net_weight * metal_rate
  subtotal: number; // metal_amount + making_charge_amount + stone_amount + wastage_amount

  // GST on Metal (3%)
  metal_cgst: number;
  metal_sgst: number;
  metal_igst: number;
  metal_gst_amount: number;

  // GST on Making Charges (5%)
  making_cgst: number;
  making_sgst: number;
  making_igst: number;
  making_gst_amount: number;

  // Total GST for this line item
  total_gst: number;

  // Line Total
  line_total: number; // subtotal + total_gst

  // Discount
  discount_percentage: number;
  discount_amount: number;

  // Additional Info
  notes: string | null;

  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * InvoiceItem Creation Attributes
 */
export interface InvoiceItemCreationAttributes extends Optional<InvoiceItemAttributes,
  'id' | 'barcode' | 'huid' | 'stone_weight' | 'wastage_percentage' | 'wastage_amount' |
  'stone_details' | 'stone_amount' | 'metal_cgst' | 'metal_sgst' | 'metal_igst' |
  'metal_gst_amount' | 'making_cgst' | 'making_sgst' | 'making_igst' | 'making_gst_amount' |
  'total_gst' | 'discount_percentage' | 'discount_amount' | 'notes' | 'is_active' |
  'created_at' | 'updated_at'
> {}

/**
 * InvoiceItem Model Class
 */
export class InvoiceItem extends Model<InvoiceItemAttributes, InvoiceItemCreationAttributes> implements InvoiceItemAttributes {
  public id!: number;
  public invoice_id!: number;
  public product_id!: number;

  public product_code!: string;
  public product_name!: string;
  public barcode!: string | null;
  public huid!: string | null;
  public category_name!: string;
  public metal_type_name!: string;

  public gross_weight!: number;
  public net_weight!: number;
  public stone_weight!: number;
  public fine_weight!: number;
  public purity!: number;

  public metal_rate!: number;
  public quantity!: number;
  public wastage_percentage!: number;
  public wastage_amount!: number;

  public making_charge_type!: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  public making_charge_rate!: number;
  public making_charge_amount!: number;

  public stone_details!: any | null;
  public stone_amount!: number;

  public hsn_code!: string;
  public tax_rate!: number;

  public metal_amount!: number;
  public subtotal!: number;

  public metal_cgst!: number;
  public metal_sgst!: number;
  public metal_igst!: number;
  public metal_gst_amount!: number;

  public making_cgst!: number;
  public making_sgst!: number;
  public making_igst!: number;
  public making_gst_amount!: number;

  public total_gst!: number;

  public line_total!: number;

  public discount_percentage!: number;
  public discount_amount!: number;

  public notes!: string | null;

  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Calculate metal amount (net weight × metal rate)
   */
  public calculateMetalAmount(): number {
    return this.net_weight * this.metal_rate;
  }

  /**
   * Calculate wastage amount
   */
  public calculateWastageAmount(): number {
    if (this.wastage_percentage > 0) {
      return (this.net_weight * this.wastage_percentage / 100) * this.metal_rate;
    }
    return 0;
  }

  /**
   * Calculate making charge based on type
   */
  public calculateMakingCharge(): number {
    switch (this.making_charge_type) {
      case 'per_gram':
        return this.making_charge_rate * this.net_weight;
      case 'percentage':
        return (this.metal_amount * this.making_charge_rate) / 100;
      case 'fixed':
        return this.making_charge_rate;
      case 'slab':
        // Slab-based would require additional slab data
        return this.making_charge_rate;
      default:
        return 0;
    }
  }

  /**
   * Calculate GST for metal (3% - split as CGST 1.5% + SGST 1.5% for intra-state)
   */
  public calculateMetalGST(gstType: 'intra' | 'inter'): {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  } {
    const taxableAmount = this.metal_amount + this.wastage_amount;
    const metalTaxRate = 3; // 3% for gold/silver

    if (gstType === 'intra') {
      const cgst = (taxableAmount * metalTaxRate / 2) / 100; // 1.5%
      const sgst = (taxableAmount * metalTaxRate / 2) / 100; // 1.5%
      return {
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: 0,
        total: parseFloat((cgst + sgst).toFixed(2)),
      };
    } else {
      const igst = (taxableAmount * metalTaxRate) / 100; // 3%
      return {
        cgst: 0,
        sgst: 0,
        igst: parseFloat(igst.toFixed(2)),
        total: parseFloat(igst.toFixed(2)),
      };
    }
  }

  /**
   * Calculate GST for making charges (5% - split as CGST 2.5% + SGST 2.5% for intra-state)
   */
  public calculateMakingGST(gstType: 'intra' | 'inter'): {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  } {
    const taxableAmount = this.making_charge_amount;
    const makingTaxRate = 5; // 5% for making charges

    if (gstType === 'intra') {
      const cgst = (taxableAmount * makingTaxRate / 2) / 100; // 2.5%
      const sgst = (taxableAmount * makingTaxRate / 2) / 100; // 2.5%
      return {
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: 0,
        total: parseFloat((cgst + sgst).toFixed(2)),
      };
    } else {
      const igst = (taxableAmount * makingTaxRate) / 100; // 5%
      return {
        cgst: 0,
        sgst: 0,
        igst: parseFloat(igst.toFixed(2)),
        total: parseFloat(igst.toFixed(2)),
      };
    }
  }

  /**
   * Calculate line total with all charges and taxes
   */
  public calculateLineTotal(gstType: 'intra' | 'inter'): number {
    // Base amounts
    this.metal_amount = this.calculateMetalAmount();
    this.wastage_amount = this.calculateWastageAmount();
    this.making_charge_amount = this.calculateMakingCharge();

    // Subtotal before GST
    this.subtotal = this.metal_amount + this.wastage_amount + this.making_charge_amount + this.stone_amount;

    // Calculate GST for metal
    const metalGST = this.calculateMetalGST(gstType);
    this.metal_cgst = metalGST.cgst;
    this.metal_sgst = metalGST.sgst;
    this.metal_igst = metalGST.igst;
    this.metal_gst_amount = metalGST.total;

    // Calculate GST for making charges
    const makingGST = this.calculateMakingGST(gstType);
    this.making_cgst = makingGST.cgst;
    this.making_sgst = makingGST.sgst;
    this.making_igst = makingGST.igst;
    this.making_gst_amount = makingGST.total;

    // Total GST
    this.total_gst = this.metal_gst_amount + this.making_gst_amount;

    // Apply discount
    if (this.discount_percentage > 0) {
      this.discount_amount = (this.subtotal * this.discount_percentage) / 100;
    }

    // Line total
    this.line_total = this.subtotal + this.total_gst - this.discount_amount;

    return this.line_total;
  }
}

/**
 * Initialize InvoiceItem Model
 */
InvoiceItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },

    // Product Details
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    huid: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    metal_type_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Weight Details
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
    fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    purity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    // Pricing
    metal_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    wastage_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    wastage_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Making Charges
    making_charge_type: {
      type: DataTypes.ENUM('per_gram', 'percentage', 'fixed', 'slab'),
      allowNull: false,
    },
    making_charge_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    making_charge_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Stone Details
    stone_details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    stone_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // HSN and Tax
    hsn_code: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    // Line Item Amounts
    metal_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // GST on Metal
    metal_cgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    metal_sgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    metal_igst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    metal_gst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // GST on Making Charges
    making_cgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    making_sgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    making_igst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    making_gst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Total GST
    total_gst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Line Total
    line_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Discount
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Additional Info
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'invoice_items',
    underscored: true,
    timestamps: true,
  }
);

export default InvoiceItem;
