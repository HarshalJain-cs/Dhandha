import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../connection';

/**
 * User Attributes Interface
 */
export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  email: string;
  full_name: string;
  role_id: number;
  branch_id: number | null;
  is_active: boolean;
  last_login: Date | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * User Creation Attributes (password is required during creation)
 */
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'last_login' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at' | 'branch_id'> {}

/**
 * User Model Class
 */
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public email!: string;
  public full_name!: string;
  public role_id!: number;
  public branch_id!: number | null;
  public is_active!: boolean;
  public last_login!: Date | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Hash password before saving
   */
  public async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * Compare password with hashed password
   */
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Get user without password
   */
  public toSafeObject(): Omit<UserAttributes, 'password'> {
    const { password, ...userWithoutPassword } = this.get({ plain: true });
    return userWithoutPassword;
  }
}

/**
 * Initialize User Model
 */
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255],
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        await user.hashPassword();
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          await user.hashPassword();
        }
      },
    },
  }
);

export default User;
