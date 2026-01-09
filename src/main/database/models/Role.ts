import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Role Attributes Interface
 */
export interface RoleAttributes {
  id: number;
  role_name: string;
  description: string | null;
  permissions: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Role Creation Attributes
 */
export interface RoleCreationAttributes
  extends Optional<RoleAttributes, 'id' | 'description' | 'permissions' | 'is_active' | 'created_at' | 'updated_at'> {}

/**
 * Role Model Class
 * Manages user roles and permissions
 */
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public role_name!: string;
  public description!: string | null;
  public permissions!: string[];
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Check if role has a specific permission
   * @param permission - Permission to check (e.g., 'sales:create', 'users:read')
   */
  public hasPermission(permission: string): boolean {
    if (!this.permissions || this.permissions.length === 0) {
      return false;
    }

    // Check for exact match
    if (this.permissions.includes(permission)) {
      return true;
    }

    // Check for wildcard match (e.g., 'sales:*' matches 'sales:create')
    const [resource, action] = permission.split(':');
    const wildcardPermission = `${resource}:*`;

    return this.permissions.includes(wildcardPermission);
  }

  /**
   * Grant a permission to this role
   * @param permission - Permission to grant
   */
  public grantPermission(permission: string): void {
    if (!this.permissions) {
      this.permissions = [];
    }

    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  /**
   * Revoke a permission from this role
   * @param permission - Permission to revoke
   */
  public revokePermission(permission: string): void {
    if (!this.permissions) {
      return;
    }

    this.permissions = this.permissions.filter((p) => p !== permission);
  }

  /**
   * Get all permissions as a formatted list
   */
  public getPermissionsList(): string[] {
    return this.permissions || [];
  }

  /**
   * Check if this is an admin role (has all permissions)
   */
  public isAdmin(): boolean {
    return this.role_name.toLowerCase() === 'admin' || this.hasPermission('*:*');
  }
}

/**
 * Initialize Role Model
 */
Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Role name is required',
        },
        len: {
          args: [2, 50],
          msg: 'Role name must be between 2 and 50 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        // @ts-ignore - Custom validator function
        isValidArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Permissions must be an array');
          }
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'roles',
    underscored: true,
    timestamps: true,
  }
);

export default Role;
