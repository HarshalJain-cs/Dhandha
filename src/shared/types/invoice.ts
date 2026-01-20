// Customer and Invoice Type Definitions

export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  mobile?: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  customer_type: 'retail' | 'wholesale' | 'vip';
  credit_limit?: number;
  outstanding_balance: number;
  loyalty_points: number;
  date_of_birth?: Date;
  anniversary_date?: Date;
  notes?: string;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
  last_purchase_date?: Date;
  total_purchase_value?: number;

  // Additional properties that services might expect
  first_name?: string;
  last_name?: string;
  name: string; // Computed/virtual property
  address: string; // Computed/virtual property
  address_line1?: string;
  address_line2?: string;
  aadhar_number?: string;
  pan_number?: string;
}

export interface CreateCustomerData {
  customer_code?: string;
  customer_type: 'retail' | 'wholesale' | 'vip';
  first_name: string;
  last_name?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  pan_number?: string;
  aadhar_number?: string;
  gstin?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  date_of_birth?: Date;
  anniversary_date?: Date;
  credit_limit?: number;
  credit_days?: number;
  discount_percentage?: number;
  notes?: string;
  created_by: number;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  is_active?: boolean;
}

export interface InvoiceItemData {
  product_id: number;
  quantity: number;
  metal_rate: number;
  discount_percentage?: number;
  notes?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  taxable_amount: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;

  // Relations
  product?: {
    id: number;
    product_code: string;
    product_name: string;
    unit_price: number;
  };
}

export interface Payment {
  id?: number;
  invoice_id?: number;
  payment_date: Date;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'old_gold';
  amount: number;
  reference_number?: string;
  notes?: string;
  created_by?: number;
  created_at?: Date;
}

export interface OldGoldTransaction {
  id?: number;
  invoice_id?: number;
  gross_weight: number;
  net_weight: number;
  purity?: number;
  rate_per_gram: number;
  total_value: number;
  description?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  customer_id: number;
  total_quantity: number;
  subtotal_amount: number;
  discount_amount?: number;
  taxable_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  invoice_status: 'draft' | 'confirmed' | 'cancelled';
  due_date?: Date;
  notes?: string;
  terms_and_conditions?: string;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;

  // Relations
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
  oldGoldTransaction?: OldGoldTransaction;
}

export interface CreateInvoiceData {
  customer_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    discount_percentage?: number;
  }>;
  old_gold_data?: OldGoldTransaction;
  payments?: Array<{
    payment_method: Payment['payment_method'];
    amount: number;
    reference_number?: string;
    notes?: string;
  }>;
  invoice_data?: {
    discount_amount?: number;
    due_date?: Date;
    notes?: string;
    terms_and_conditions?: string;
  };
}

export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  period_start: string;
  period_end: string;
}