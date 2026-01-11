// @ts-nocheck
import jwt from 'jsonwebtoken';
import { User } from '../database/models/User';

/**
 * JWT Payload Interface
 */
export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  role_id: number;
  branch_id: number | null;
}

/**
 * Login Response Interface
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: Omit<JWTPayload, 'id'> & { id: number; full_name: string };
  token?: string;
}

/**
 * Authentication Service
 * Handles user authentication, token generation, and validation
 */
export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'jewellery-erp-secret-key-2024';
  private static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  /**
   * Authenticate user with username and password
   */
  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      // Trim whitespace from inputs
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      // Find user by username
      const user = await User.findOne({
        where: { username: trimmedUsername, is_active: true },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(trimmedPassword);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid username or password',
        };
      }

      // Update last login timestamp
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = this.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        branch_id: user.branch_id,
      });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role_id: user.role_id,
          branch_id: user.branch_id,
        },
        token,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login',
      };
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Validate token and get user
   */
  static async validateTokenAndGetUser(token: string): Promise<User | null> {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      const user = await User.findOne({
        where: { id: decoded.id, is_active: true },
      });

      return user;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'An error occurred while changing password',
      };
    }
  }

  /**
   * Create new user (admin only)
   */
  static async createUser(userData: {
    username: string;
    password: string;
    email: string;
    full_name: string;
    role_id: number;
    branch_id?: number;
    created_by: number;
  }): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Check if username already exists
      const existingUser = await User.findOne({
        where: { username: userData.username },
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Username already exists',
        };
      }

      // Check if email already exists
      const existingEmail = await User.findOne({
        where: { email: userData.email },
      });

      if (existingEmail) {
        return {
          success: false,
          message: 'Email already exists',
        };
      }

      // Create user
      const user = await User.create(userData);

      return {
        success: true,
        message: 'User created successfully',
        user: user.toSafeObject(),
      };
    } catch (error: any) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: 'An error occurred while creating user',
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Update user details
   */
  static async updateUser(
    userId: number,
    updateData: Partial<{
      email: string;
      full_name: string;
      role_id: number;
      branch_id: number;
      is_active: boolean;
    }>,
    updatedBy: number
  ): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      await user.update({
        ...updateData,
        updated_by: updatedBy,
      });

      return {
        success: true,
        message: 'User updated successfully',
        user: user.toSafeObject(),
      };
    } catch (error: any) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: 'An error occurred while updating user',
      };
    }
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(
    userId: number,
    updatedBy: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      await user.update({
        is_active: false,
        updated_by: updatedBy,
      });

      return {
        success: true,
        message: 'User deactivated successfully',
      };
    } catch (error: any) {
      console.error('Deactivate user error:', error);
      return {
        success: false,
        message: 'An error occurred while deactivating user',
      };
    }
  }

  /**
   * Get all active users
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await User.findAll({
        where: { is_active: true },
        order: [['created_at', 'DESC']],
      });
      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }
}

export default AuthService;
