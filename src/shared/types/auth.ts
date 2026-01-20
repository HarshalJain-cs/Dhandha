// Shared Type Definitions for Jewellery ERP
// These types are used across main and renderer processes

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  branch_id?: number;
  is_active: boolean;
  last_login?: Date;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  username: string;
  password: string;
  email: string;
  full_name: string;
  role_id: number;
  branch_id?: number;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  is_active?: boolean;
}

export interface Role {
  id: number;
  role_name: string;
  permissions: string[];
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Branch {
  id: number;
  branch_name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}