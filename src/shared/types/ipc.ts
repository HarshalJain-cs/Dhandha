// IPC Communication Type Definitions
// Used for main-renderer process communication

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface ListQuery extends PaginationParams {
  filters?: FilterParams;
  sort?: SortParams;
  search?: string;
}

// Common filter interfaces
export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

export interface StatusFilter {
  is_active?: boolean;
  status?: string | string[];
}

export interface UserFilter extends StatusFilter {
  role_id?: number;
  branch_id?: number;
}

// IPC Handler response types
export interface ListResponse<T> extends IPCResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DetailResponse<T> extends IPCResponse<T> {}

export interface CreateResponse<T> extends IPCResponse<T> {}

export interface UpdateResponse<T> extends IPCResponse<T> {}

export interface DeleteResponse extends IPCResponse<{ message: string }> {}

// Authentication IPC types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: {
    id: number;
    role_name: string;
    permissions: string[];
  };
  branch?: {
    id: number;
    branch_name: string;
  };
}

// Hardware IPC types
export interface HardwareSettings {
  mode: 'real' | 'mock';
  ports: {
    barcode?: string;
    rfid?: string;
    scale?: string;
  };
  enabled: {
    barcode: boolean;
    rfid: boolean;
    scale: boolean;
  };
}

export interface WeighingScaleData {
  weight: number;
  stable: boolean;
  timestamp: Date;
}

export interface RFIDData {
  tag: string;
  rssi: number;
  timestamp: Date;
}

export interface BarcodeData {
  barcode: string;
  timestamp: Date;
}

// Sync IPC types
export interface SyncStatus {
  is_enabled: boolean;
  last_sync?: Date;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  pending_changes: number;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  errors: string[];
  duration: number;
}

// License IPC types
export interface LicenseInfo {
  is_valid: boolean;
  license_key?: string;
  activated_at?: Date;
  expires_at?: Date;
  max_users?: number;
  current_users?: number;
  features: string[];
  warnings?: string[];
}

export interface HardwareIdInfo {
  id: string;
  components: Array<{
    type: string;
    value: string;
    weight: number;
  }>;
}

// Report IPC types
export interface ReportFilters extends DateRangeFilter {
  customer_id?: number;
  category_id?: number;
  metal_type_id?: number;
  branch_id?: number;
  status?: string;
}

export interface SalesReportData {
  period: string;
  total_sales: number;
  total_quantity: number;
  total_customers: number;
  average_order_value: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export interface StockReportData {
  total_products: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  total_value: number;
  categories: Array<{
    category_name: string;
    product_count: number;
    total_value: number;
  }>;
}

// Dashboard IPC types
export interface DashboardStats {
  total_sales: number;
  total_customers: number;
  total_products: number;
  low_stock_products: number;
  pending_orders: number;
  monthly_revenue: number;
  monthly_growth: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}