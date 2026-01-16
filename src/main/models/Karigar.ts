import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface KarigarAttributes {
  id: number;
  name: string;
  contactNumber: string;
  email?: string;
  address?: string;
  panNumber?: string;
  aadharNumber?: string;
  gstNumber?: string;
  specialization: string; // e.g., "Ring Making", "Chain Making", "Stone Setting"
  ratePerGram?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface KarigarCreationAttributes extends Optional<KarigarAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Karigar extends Model<KarigarAttributes, KarigarCreationAttributes> implements KarigarAttributes {
  public id!: number;
  public name!: string;
  public contactNumber!: string;
  public email?: string;
  public address?: string;
  public panNumber?: string;
  public aadharNumber?: string;
  public gstNumber?: string;
  public specialization!: string;
  public ratePerGram?: number;
  public bankName?: string;
  public accountNumber?: string;
  public ifscCode?: string;
  public isActive!: boolean;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Karigar.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    panNumber: {
      type: DataTypes.STRING,
    },
    aadharNumber: {
      type: DataTypes.STRING,
    },
    gstNumber: {
      type: DataTypes.STRING,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ratePerGram: {
      type: DataTypes.DECIMAL(10, 2),
    },
    bankName: {
      type: DataTypes.STRING,
    },
    accountNumber: {
      type: DataTypes.STRING,
    },
    ifscCode: {
      type: DataTypes.STRING,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'karigars',
    timestamps: true,
  }
);

export default Karigar;
