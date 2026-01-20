// Product and Category Type Definitions

export interface Category {
  id: number;
  category_name: string;
  parent_id?: number | null;
  hsn_code?: string;
  description?: string;
  images?: string[];
  product_count?: number;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryData {
  category_name: string;
  category_code: string;
  parent_category_id?: number;
  description?: string;
  hsn_code?: string;
  tax_percentage?: number;
  created_by: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  is_active?: boolean;
}

export interface MetalType {
  id: number;
  metal_name: string;
  purity: number;
  current_rate: number;
  description?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Stone {
  id: number;
  stone_name: string;
  stone_type: string;
  carat_weight: number;
  price_per_carat: number;
  total_price: number;
  description?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductStone {
  id: number;
  product_id: number;
  stone_id: number;
  carat_weight: number;
  quantity: number;
  total_carat_weight: number;
  total_price: number;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category_id: number;
  metal_type_id?: number | null;
  gross_weight: number;
  net_weight: number;
  purity?: number;
  unit_price: number;
  making_charge?: number;
  other_charges?: number;
  total_price: number;
  current_stock: number;
  min_stock_level?: number;
  max_stock_level?: number;
  images?: string[];
  rfid_tag?: string;
  barcode?: string;
  description?: string;
  tags?: string[];
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;

  // Relations (optional)
  category?: Category;
  metalType?: MetalType;
  productStones?: ProductStone[];
  total_stone_value?: number;

  // Computed properties
  stock_alert?: boolean;
  fine_weight?: number;
}

export interface CreateProductData {
  category_id: number;
  metal_type_id: number;
  product_name: string;
  description?: string;
  design_number?: string;
  size?: string;
  gross_weight: number;
  net_weight: number;
  stone_weight?: number;
  wastage_percentage?: number;
  making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  making_charge?: number;
  purity: number;
  unit_price: number;
  mrp?: number;
  quantity?: number;
  current_stock?: number;
  min_stock_level?: number;
  reorder_level?: number;
  location?: string;
  rack_number?: string;
  shelf_number?: string;
  barcode?: string;
  rfid_tag?: string;
  huid?: string;
  hallmark_number?: string;
  hallmark_center?: string;
  images?: string[];
  tags?: string[];
  notes?: string;
  custom_fields?: any;
  created_by: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  is_active?: boolean;
}

export interface StockTransaction {
  id: number;
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type?: 'invoice' | 'purchase_order' | 'manual' | 'return';
  reference_id?: number;
  notes?: string;
  created_by?: number;
  created_at: Date;
}