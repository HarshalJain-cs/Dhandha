import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Karigar (Craftsman/Artisan) Attributes Interface
 */
export interface KarigarAttributes {
  id: number;
  karigar_code: string;
  name: string;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;

  // Specialization
  specialization: 'general' | 'stone_setting' | 'polishing' | 'casting' | 'designing' | 'engraving';
  experience_years: number;
  skill_level: 'beginner' | 'intermediate' | 'expert' | 'master';

  // Payment details
  payment_type: 'per_piece' | 'per_gram' | 'daily_wage' | 'monthly_salary';
  payment_rate: number;
  advance_given: number;
  outstanding_balance: number;

  // Metal account (for tracking metal issued to karigar)
  metal_account_gold: number; // Grams of gold with karigar
  metal_account_silver: number; // Grams of silver with karigar

  // Work statistics
  total_orders_completed: number;
  total_orders_pending: number;
  average_completion_days: number;

  // Aadhar/PAN for GST compliance
  aadhar_number: string | null;
  pan_number: string | null;

  // Photos & documents
  photo_url: string | null;
  documents: string[] | null;

  // Status
  status: 'active' | 'inactive' | 'suspended';
  suspension_reason: string | null;
  notes: string | null;

  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Karigar Creation Attributes
 */
export interface KarigarCreationAttributes extends Optional<KarigarAttributes,
  'id' | 'alternate_mobile' | 'email' | 'address' | 'city' | 'state' | 'pincode' |
  'experience_years' | 'skill_level' | 'advance_given' | 'outstanding_balance' |
  'metal_account_gold' | 'metal_account_silver' | 'total_orders_completed' |
  'total_orders_pending' | 'average_completion_days' | 'aadhar_number' | 'pan_number' |
  'photo_url' | 'documents' | 'status' | 'suspension_reason' | 'notes' | 'is_active' |
  'created_by' | 'updated_by' | 'created_at' | 'updated_at'
> {}

/**
 * Karigar Model Class
 */
export class Karigar extends Model<KarigarAttributes, KarigarCreationAttributes> implements KarigarAttributes {
  public id!: number;
  public karigar_code!: string;
  public name!: string;
  public mobile!: string;
  public alternate_mobile!: string | null;
  public email!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public pincode!: string | null;

  public specialization!: 'general' | 'stone_setting' | 'polishing' | 'casting' | 'designing' | 'engraving';
  public experience_years!: number;
  public skill_level!: 'beginner' | 'intermediate' | 'expert' | 'master';

  public payment_type!: 'per_piece' | 'per_gram' | 'daily_wage' | 'monthly_salary';
  public payment_rate!: number;
  public advance_given!: number;
  public outstanding_balance!: number;

  public metal_account_gold!: number;
  public metal_account_silver!: number;

  public total_orders_completed!: number;
  public total_orders_pending!: number;
  public average_completion_days!: number;

  public aadhar_number!: string | null;
  public pan_number!: string | null;

  public photo_url!: string | null;
  public documents!: string[] | null;

  public status!: 'active' | 'inactive' | 'suspended';
  public suspension_reason!: string | null;
  public notes!: string | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate unique karigar code
   * Format: KAR-YYYYMMDD-###
   */
  public static async generateKarigarCode(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const pattern = `KAR-${dateStr}-%`;
    const karigars = await Karigar.findAll({
      where: {
        karigar_code: {
          [Op.like]: pattern,
        },
      },
      order: [['karigar_code', 'DESC']],
      limit: 1,
    });

    let sequence = 1;
    if (karigars.length > 0) {
      const lastCode = karigars[0].karigar_code;
      const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `KAR-${dateStr}-${seqStr}`;
  }

  /**
   * Calculate metal balance (total metal with karigar)
   */
  public getTotalMetalBalance(): { gold: number; silver: number; total_value: number } {
    // Assuming gold rate ~6000/g and silver rate ~80/g for value calculation
    const goldRate = 6000;
    const silverRate = 80;

    return {
      gold: this.metal_account_gold,
      silver: this.metal_account_silver,
      total_value: (this.metal_account_gold * goldRate) + (this.metal_account_silver * silverRate),
    };
  }

  /**
   * Issue metal to karigar
   */
  public issueMetal(metalType: 'gold' | 'silver', weight: number): void {
    if (metalType === 'gold') {
      this.metal_account_gold += weight;
    } else {
      this.metal_account_silver += weight;
    }
  }

  /**
   * Receive metal from karigar
   */
  public receiveMetal(metalType: 'gold' | 'silver', weight: number): boolean {
    if (metalType === 'gold') {
      if (this.metal_account_gold >= weight) {
        this.metal_account_gold -= weight;
        return true;
      }
      return false;
    } else {
      if (this.metal_account_silver >= weight) {
        this.metal_account_silver -= weight;
        return true;
      }
      return false;
    }
  }

  /**
   * Update work statistics
   */
  public updateWorkStats(ordersCompleted: number, ordersPending: number, avgDays: number): void {
    this.total_orders_completed = ordersCompleted;
    this.total_orders_pending = ordersPending;
    this.average_completion_days = avgDays;
  }

  /**
   * Suspend karigar
   */
  public suspend(reason: string): void {
    this.status = 'suspended';
    this.suspension_reason = reason;
  }

  /**
   * Reactivate karigar
   */
  public reactivate(): void {
    this.status = 'active';
    this.suspension_reason = null;
  }

  /**
   * Get skill level display
   */
  public getSkillLevelDisplay(): string {
    const levels: Record<string, string> = {
      beginner: 'Beginner (0-2 years)',
      intermediate: 'Intermediate (2-5 years)',
      expert: 'Expert (5-10 years)',
      master: 'Master (10+ years)',
    };
    return levels[this.skill_level] || this.skill_level;
  }
}

/**
 * Initialize Karigar Model
 */
Karigar.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    karigar_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    alternate_mobile: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    // Specialization
    specialization: {
      type: DataTypes.ENUM('general', 'stone_setting', 'polishing', 'casting', 'designing', 'engraving'),
      allowNull: false,
      defaultValue: 'general',
    },
    experience_years: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    skill_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'expert', 'master'),
      defaultValue: 'beginner',
    },

    // Payment details
    payment_type: {
      type: DataTypes.ENUM('per_piece', 'per_gram', 'daily_wage', 'monthly_salary'),
      allowNull: false,
    },
    payment_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    advance_given: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    outstanding_balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Metal account
    metal_account_gold: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    metal_account_silver: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },

    // Work statistics
    total_orders_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_orders_pending: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    average_completion_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // Documents
    aadhar_number: {
      type: DataTypes.STRING(12),
      allowNull: true,
      validate: {
        len: [12, 12],
      },
    },
    pan_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      },
    },

    // Photos & documents
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    documents: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    // Status
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    suspension_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Standard fields
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
    tableName: 'karigars',
    underscored: true,
    timestamps: true,
  }
);

export default Karigar;
