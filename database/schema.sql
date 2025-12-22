-- ============================================
-- JEWELLERY ERP - COMPLETE DATABASE SCHEMA
-- PostgreSQL 15
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE SYSTEM TABLES
-- ============================================

-- Roles & Permissions
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Branches
CREATE TABLE branches (
    branch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    gstin VARCHAR(15),
    is_head_office BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users & Authentication
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(role_id),
    branch_id UUID REFERENCES branches(branch_id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_branch ON users(branch_id);

-- Audit Log
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Company Settings
CREATE TABLE company_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    financial_year_start DATE,
    currency_code VARCHAR(3) DEFAULT 'INR',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_start_number INTEGER DEFAULT 1,
    tax_type VARCHAR(20) DEFAULT 'GST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. INVENTORY - PRODUCTS & CATEGORIES
-- ============================================

CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id UUID REFERENCES categories(category_id),
    description TEXT,
    hsn_code VARCHAR(10),
    default_making_charge_percentage DECIMAL(5,2),
    default_wastage_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metal_types (
    metal_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metal_name VARCHAR(50) NOT NULL,
    purity VARCHAR(20) NOT NULL,
    purity_percentage DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metal_name, purity)
);

-- Insert default metal types
INSERT INTO metal_types (metal_name, purity, purity_percentage) VALUES
('Gold', '24K', 99.9),
('Gold', '22K', 91.6),
('Gold', '18K', 75.0),
('Gold', '14K', 58.3),
('Silver', '92.5%', 92.5),
('Platinum', '95%', 95.0);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    rfid_tag VARCHAR(100) UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(category_id),
    metal_type_id UUID REFERENCES metal_types(metal_type_id),
    gross_weight DECIMAL(10,3) NOT NULL,
    stone_weight DECIMAL(10,3) DEFAULT 0,
    net_weight DECIMAL(10,3) NOT NULL,
    fine_weight DECIMAL(10,3),
    metal_rate DECIMAL(10,2),
    making_charge_type VARCHAR(20),
    making_charge_value DECIMAL(10,2),
    wastage_percentage DECIMAL(5,2),
    stone_value DECIMAL(10,2) DEFAULT 0,
    huid_code VARCHAR(20) UNIQUE,
    bis_hallmark BOOLEAN DEFAULT false,
    hallmark_center VARCHAR(100),
    hallmark_date DATE,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    branch_id UUID REFERENCES branches(branch_id),
    rack_number VARCHAR(20),
    shelf_number VARCHAR(20),
    image_url TEXT,
    additional_images JSONB,
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    tags TEXT[],
    custom_fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_rfid ON products(rfid_tag);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_metal_type ON products(metal_type_id);
CREATE INDEX idx_products_branch ON products(branch_id);
CREATE INDEX idx_products_status ON products(status);

-- ============================================
-- 3. DIAMOND & STONES
-- ============================================

CREATE TABLE stones (
    stone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stone_name VARCHAR(100) NOT NULL,
    stone_type VARCHAR(50),
    hsn_code VARCHAR(10),
    rate_per_carat DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_stones (
    product_stone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    stone_id UUID REFERENCES stones(stone_id),
    carat_weight DECIMAL(6,3),
    cut_grade VARCHAR(20),
    color_grade VARCHAR(10),
    clarity_grade VARCHAR(10),
    certificate_number VARCHAR(100),
    certificate_authority VARCHAR(50),
    certificate_url TEXT,
    stone_weight DECIMAL(6,3),
    rate_per_carat DECIMAL(10,2),
    total_value DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_stones_product ON product_stones(product_id);

-- ============================================
-- 4. CUSTOMERS & VENDORS
-- ============================================

CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'retail',
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    country VARCHAR(50) DEFAULT 'India',
    aadhar_number VARCHAR(12),
    pan_number VARCHAR(10),
    gstin VARCHAR(15),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    last_purchase_date DATE,
    total_purchases DECIMAL(15,2) DEFAULT 0,
    preferred_metal VARCHAR(50),
    preferred_purity VARCHAR(20),
    date_of_birth DATE,
    anniversary_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_gstin ON customers(gstin);

-- Customer Metal Account (for bhav cutting)
CREATE TABLE customer_metal_account (
    metal_account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    metal_type_id UUID REFERENCES metal_types(metal_type_id),
    balance_weight DECIMAL(10,3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, metal_type_id)
);

CREATE TABLE vendors (
    vendor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR(50) UNIQUE NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type VARCHAR(50),
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    gstin VARCHAR(15),
    pan_number VARCHAR(10),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    payment_terms VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_code ON vendors(vendor_code);

-- ============================================
-- 5. SALES & INVOICING
-- ============================================

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_type VARCHAR(20) DEFAULT 'sales',
    customer_id UUID REFERENCES customers(customer_id),
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    customer_gstin VARCHAR(15),
    branch_id UUID REFERENCES branches(branch_id),
    subtotal DECIMAL(15,2) NOT NULL,
    total_making_charges DECIMAL(15,2) DEFAULT 0,
    total_wastage_charges DECIMAL(15,2) DEFAULT 0,
    total_stone_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    old_gold_value DECIMAL(15,2) DEFAULT 0,
    old_gold_weight DECIMAL(10,3) DEFAULT 0,
    taxable_amount DECIMAL(15,2),
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    total_tax DECIMAL(15,2) DEFAULT 0,
    round_off DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(15,2) NOT NULL,
    amount_in_words TEXT,
    payment_mode VARCHAR(50),
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    irn_number VARCHAR(100),
    irn_date TIMESTAMP,
    qr_code TEXT,
    eway_bill_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'draft',
    is_cancelled BOOLEAN DEFAULT false,
    cancel_reason TEXT,
    cancelled_at TIMESTAMP,
    quotation_number VARCHAR(50),
    purchase_order_number VARCHAR(50),
    notes TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_branch ON invoices(branch_id);

CREATE TABLE invoice_items (
    invoice_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id),
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    hsn_code VARCHAR(10),
    gross_weight DECIMAL(10,3),
    stone_weight DECIMAL(10,3),
    net_weight DECIMAL(10,3),
    purity VARCHAR(20),
    purity_percentage DECIMAL(5,2),
    fine_weight DECIMAL(10,3),
    metal_rate DECIMAL(10,2),
    metal_value DECIMAL(15,2),
    making_charge_type VARCHAR(20),
    making_charge_value DECIMAL(10,2),
    making_charges DECIMAL(15,2),
    wastage_percentage DECIMAL(5,2),
    wastage_charges DECIMAL(15,2),
    stone_value DECIMAL(15,2),
    tax_percentage DECIMAL(5,2),
    cgst_percentage DECIMAL(5,2),
    sgst_percentage DECIMAL(5,2),
    igst_percentage DECIMAL(5,2),
    cgst_amount DECIMAL(15,2),
    sgst_amount DECIMAL(15,2),
    igst_amount DECIMAL(15,2),
    item_total DECIMAL(15,2),
    quantity INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- ============================================
-- 6. BHAV CUTTING (OLD GOLD EXCHANGE)
-- ============================================

CREATE TABLE old_gold_transactions (
    old_gold_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id),
    item_description TEXT,
    gross_weight DECIMAL(10,3) NOT NULL,
    stone_weight DECIMAL(10,3) DEFAULT 0,
    net_weight DECIMAL(10,3),
    test_purity VARCHAR(20),
    test_purity_percentage DECIMAL(5,2),
    fine_weight DECIMAL(10,3),
    rate_per_gram DECIMAL(10,2),
    metal_value DECIMAL(15,2),
    melting_charges DECIMAL(10,2) DEFAULT 0,
    testing_charges DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    final_value DECIMAL(15,2),
    settlement_type VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_old_gold_invoice ON old_gold_transactions(invoice_id);
CREATE INDEX idx_old_gold_customer ON old_gold_transactions(customer_id);

-- ============================================
-- 7. KARIGAR (GOLDSMITH) MANAGEMENT
-- ============================================

CREATE TABLE karigars (
    karigar_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    karigar_code VARCHAR(50) UNIQUE NOT NULL,
    karigar_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    aadhar_number VARCHAR(12),
    pan_number VARCHAR(10),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    average_wastage_percentage DECIMAL(5,2),
    specialty TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_karigars_code ON karigars(karigar_code);

CREATE TABLE karigar_orders (
    karigar_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    karigar_id UUID REFERENCES karigars(karigar_id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    product_category VARCHAR(100),
    product_description TEXT,
    design_number VARCHAR(50),
    reference_image_url TEXT,
    metal_type_id UUID REFERENCES metal_types(metal_type_id),
    issued_weight DECIMAL(10,3) NOT NULL,
    issued_purity VARCHAR(20),
    issued_value DECIMAL(15,2),
    issue_date DATE,
    received_weight DECIMAL(10,3),
    received_date DATE,
    expected_wastage_percentage DECIMAL(5,2),
    actual_wastage DECIMAL(10,3),
    wastage_percentage DECIMAL(5,2),
    wastage_charges DECIMAL(10,2) DEFAULT 0,
    labour_charge_type VARCHAR(20),
    labour_charge_value DECIMAL(10,2),
    total_labour_charges DECIMAL(10,2),
    labour_payment_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    quality_check_done BOOLEAN DEFAULT false,
    quality_check_by UUID REFERENCES users(user_id),
    quality_check_date DATE,
    quality_remarks TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_karigar_orders_number ON karigar_orders(order_number);
CREATE INDEX idx_karigar_orders_karigar ON karigar_orders(karigar_id);
CREATE INDEX idx_karigar_orders_status ON karigar_orders(status);
CREATE INDEX idx_karigar_orders_date ON karigar_orders(order_date);

-- ============================================
-- 8. ACCOUNTING & LEDGERS
-- ============================================

CREATE TABLE ledger_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(100) UNIQUE NOT NULL,
    parent_group_id UUID REFERENCES ledger_groups(group_id),
    group_type VARCHAR(50),
    is_system_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default ledger groups
INSERT INTO ledger_groups (group_name, group_type, is_system_group) VALUES
('Assets', 'Asset', true),
('Current Assets', 'Asset', true),
('Fixed Assets', 'Asset', true),
('Liabilities', 'Liability', true),
('Current Liabilities', 'Liability', true),
('Income', 'Income', true),
('Expenses', 'Expense', true),
('Equity', 'Equity', true);

CREATE TABLE ledgers (
    ledger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ledger_code VARCHAR(50) UNIQUE NOT NULL,
    ledger_name VARCHAR(200) NOT NULL,
    ledger_group_id UUID REFERENCES ledger_groups(group_id),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    opening_balance_type VARCHAR(10) DEFAULT 'Dr',
    current_balance DECIMAL(15,2) DEFAULT 0,
    current_balance_type VARCHAR(10) DEFAULT 'Dr',
    customer_id UUID REFERENCES customers(customer_id),
    vendor_id UUID REFERENCES vendors(vendor_id),
    karigar_id UUID REFERENCES karigars(karigar_id),
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    branch_name VARCHAR(100),
    ifsc_code VARCHAR(11),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledgers_code ON ledgers(ledger_code);
CREATE INDEX idx_ledgers_group ON ledgers(ledger_group_id);
CREATE INDEX idx_ledgers_customer ON ledgers(customer_id);
CREATE INDEX idx_ledgers_vendor ON ledgers(vendor_id);

CREATE TABLE journal_vouchers (
    voucher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
    voucher_type VARCHAR(50) DEFAULT 'Journal',
    reference_number VARCHAR(100),
    reference_date DATE,
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    narration TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_vouchers_number ON journal_vouchers(voucher_number);
CREATE INDEX idx_vouchers_type ON journal_vouchers(voucher_type);
CREATE INDEX idx_vouchers_date ON journal_vouchers(voucher_date);

CREATE TABLE voucher_entries (
    entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES journal_vouchers(voucher_id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES ledgers(ledger_id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voucher_entries_voucher ON voucher_entries(voucher_id);
CREATE INDEX idx_voucher_entries_ledger ON voucher_entries(ledger_id);

-- ============================================
-- 9. PAYMENTS & RECEIPTS
-- ============================================

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL,
    customer_id UUID REFERENCES customers(customer_id),
    vendor_id UUID REFERENCES vendors(vendor_id),
    karigar_id UUID REFERENCES karigars(karigar_id),
    amount DECIMAL(15,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    bank_account_id UUID REFERENCES ledgers(ledger_id),
    transaction_reference VARCHAR(100),
    cheque_number VARCHAR(20),
    cheque_date DATE,
    invoice_id UUID REFERENCES invoices(invoice_id),
    voucher_id UUID REFERENCES journal_vouchers(voucher_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_vendor ON payments(vendor_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

CREATE TABLE payment_splits (
    split_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(payment_id) ON DELETE CASCADE,
    payment_mode VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    bank_account_id UUID REFERENCES ledgers(ledger_id),
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. INVENTORY MOVEMENTS
-- ============================================

CREATE TABLE stock_adjustments (
    adjustment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    adjustment_type VARCHAR(50) NOT NULL,
    product_id UUID REFERENCES products(product_id),
    branch_id UUID REFERENCES branches(branch_id),
    quantity_change INTEGER NOT NULL,
    current_stock_before INTEGER NOT NULL,
    current_stock_after INTEGER NOT NULL,
    unit_value DECIMAL(15,2),
    total_value DECIMAL(15,2),
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE TABLE stock_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    from_branch_id UUID REFERENCES branches(branch_id),
    to_branch_id UUID REFERENCES branches(branch_id),
    status VARCHAR(20) DEFAULT 'pending',
    shipped_date DATE,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

CREATE TABLE stock_transfer_items (
    transfer_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID REFERENCES stock_transfers(transfer_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_value DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. GST & TAX CONFIGURATION
-- ============================================

CREATE TABLE tax_rates (
    tax_rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_name VARCHAR(100) NOT NULL,
    hsn_code VARCHAR(10),
    product_category VARCHAR(100),
    cgst_percentage DECIMAL(5,2) NOT NULL,
    sgst_percentage DECIMAL(5,2) NOT NULL,
    igst_percentage DECIMAL(5,2) NOT NULL,
    cess_percentage DECIMAL(5,2) DEFAULT 0,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default GST rates for jewellery
INSERT INTO tax_rates (tax_name, hsn_code, cgst_percentage, sgst_percentage, igst_percentage, effective_from) VALUES
('Gold Jewellery', '7113', 1.5, 1.5, 3.0, '2017-07-01'),
('Silver Jewellery', '7114', 1.5, 1.5, 3.0, '2017-07-01'),
('Imitation Jewellery', '7117', 6.0, 6.0, 12.0, '2017-07-01'),
('Making Charges', '9999', 2.5, 2.5, 5.0, '2017-07-01'),
('Diamonds', '7102', 0.125, 0.125, 0.25, '2017-07-01');

-- ============================================
-- 12. GOLD & METAL RATES
-- ============================================

CREATE TABLE metal_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metal_type_id UUID REFERENCES metal_types(metal_type_id),
    rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rate_24k DECIMAL(10,2),
    rate_22k DECIMAL(10,2),
    rate_18k DECIMAL(10,2),
    rate_per_gram DECIMAL(10,2),
    market VARCHAR(50),
    buying_rate DECIMAL(10,2),
    selling_rate DECIMAL(10,2),
    is_manual BOOLEAN DEFAULT true,
    api_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    UNIQUE(metal_type_id, rate_date)
);

CREATE INDEX idx_metal_rates_date ON metal_rates(rate_date);
CREATE INDEX idx_metal_rates_type ON metal_rates(metal_type_id);

-- ============================================
-- 13. SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id)
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category) VALUES
('invoice_prefix', 'INV', 'string', 'invoicing'),
('invoice_start_number', '1', 'number', 'invoicing'),
('auto_backup_enabled', 'true', 'boolean', 'backup'),
('backup_frequency_hours', '1', 'number', 'backup'),
('backup_retention_days', '30', 'number', 'backup'),
('low_stock_threshold', '5', 'number', 'inventory'),
('enable_rfid', 'true', 'boolean', 'hardware'),
('enable_weighing_scale', 'true', 'boolean', 'hardware'),
('default_gst_rate', '3.0', 'number', 'tax'),
('enable_multi_branch_sync', 'false', 'boolean', 'sync');

-- ============================================
-- 14. NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_type VARCHAR(50),
    action_url TEXT,
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- 15. TRIGGERS FOR AUTO-UPDATES
-- ============================================

-- Update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_karigars_updated_at BEFORE UPDATE ON karigars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. VIEWS FOR COMMON REPORTS
-- ============================================

-- Stock Summary View
CREATE VIEW v_stock_summary AS
SELECT
    p.product_id,
    p.product_code,
    p.product_name,
    c.category_name,
    mt.metal_name,
    mt.purity,
    p.gross_weight,
    p.net_weight,
    p.current_stock,
    p.min_stock_level,
    CASE
        WHEN p.current_stock <= p.min_stock_level THEN 'Low Stock'
        WHEN p.current_stock = 0 THEN 'Out of Stock'
        ELSE 'In Stock'
    END as stock_status,
    p.metal_rate * p.fine_weight * p.current_stock as total_value,
    b.branch_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN metal_types mt ON p.metal_type_id = mt.metal_type_id
LEFT JOIN branches b ON p.branch_id = b.branch_id
WHERE p.is_active = true;

-- Sales Summary View
CREATE VIEW v_sales_summary AS
SELECT
    i.invoice_id,
    i.invoice_number,
    i.invoice_date,
    c.customer_name,
    c.phone as customer_phone,
    i.subtotal,
    i.total_making_charges,
    i.old_gold_value,
    i.total_tax,
    i.grand_total,
    i.paid_amount,
    i.balance_amount,
    i.payment_status,
    b.branch_name,
    u.full_name as created_by_name
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.customer_id
LEFT JOIN branches b ON i.branch_id = b.branch_id
LEFT JOIN users u ON i.created_by = u.user_id
WHERE i.status = 'finalized' AND i.is_cancelled = false;

-- Karigar Pending Orders View
CREATE VIEW v_karigar_pending_orders AS
SELECT
    ko.karigar_order_id,
    ko.order_number,
    ko.order_date,
    ko.expected_completion_date,
    k.karigar_name,
    k.phone as karigar_phone,
    mt.metal_name,
    mt.purity,
    ko.issued_weight,
    ko.status,
    ko.priority,
    CURRENT_DATE - ko.expected_completion_date as days_overdue
FROM karigar_orders ko
JOIN karigars k ON ko.karigar_id = k.karigar_id
JOIN metal_types mt ON ko.metal_type_id = mt.metal_type_id
WHERE ko.status IN ('pending', 'in_progress');

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Create default branch
INSERT INTO branches (branch_code, branch_name, is_head_office, is_active)
VALUES ('HO001', 'Head Office', true, true);

-- Create default admin role
INSERT INTO roles (role_name, description, is_system_role)
VALUES ('Administrator', 'Full system access', true);

-- Create default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash, full_name, role_id, branch_id, is_active)
SELECT 'admin', 'admin@jewellerysoftware.com', '$2a$10$rLZ4jqcqKX8rJz6qhF3FEu7E5S8QnL7YQX.3mWvTzqWqF8vHf8XgG', 'System Administrator', r.role_id, b.branch_id, true
FROM roles r, branches b
WHERE r.role_name = 'Administrator' AND b.branch_code = 'HO001';
