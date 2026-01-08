# Dhandha Database Schema - Comprehensive Analysis

## Document Overview
This document provides a complete analysis of all 27 database models in the Dhandha application, extracted from TypeScript Sequelize model definitions. This analysis is designed for generating PostgreSQL migration files.

---

## Table of Contents
1. [Model Definitions](#model-definitions)
2. [ENUM Types](#enum-types)
3. [Dependency Graph](#dependency-graph)
4. [Foreign Key Relationships](#foreign-key-relationships)
5. [Creation Order](#creation-order)

---

## Model Definitions

### 1. User
**File:** `src/main/database/models/User.ts`
**Table Name:** `users`
**Description:** System users with authentication and role management

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| username | STRING(50) | NO | YES | - | NOT EMPTY |
| password | STRING(255) | NO | NO | - | NOT EMPTY, Len 6-255 |
| email | STRING(100) | NO | YES | - | VALID EMAIL |
| full_name | STRING(100) | NO | NO | - | NOT EMPTY |
| role_id | INTEGER | NO | NO | - | FK -> roles(id) |
| branch_id | INTEGER | YES | NO | NULL | FK -> branches(id) |
| is_active | BOOLEAN | NO | NO | true | - |
| last_login | DATE | YES | NO | NULL | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) [Self-referencing] |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) [Self-referencing] |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_users_username` UNIQUE
- `idx_users_email` UNIQUE

#### Foreign Keys:
- `role_id` -> `roles(id)` (EXTERNAL - not defined)
- `branch_id` -> `branches(id)` (EXTERNAL - not defined)
- `created_by` -> `users(id)` (Self-referencing)
- `updated_by` -> `users(id)` (Self-referencing)

#### Special Features:
- Password hashing before create/update via bcrypt
- Hook: `beforeCreate`, `beforeUpdate` for password hashing

---

### 2. License
**File:** `src/main/database/models/License.ts`
**Table Name:** `licenses`
**Description:** Application license management with offline grace period support

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| license_key | STRING(255) | NO | YES | - | UNIQUE |
| hardware_id | STRING(255) | NO | NO | - | - |
| activation_date | DATE | NO | NO | NOW() | - |
| grace_period_days | INTEGER | NO | NO | 30 | - |
| license_type | STRING(50) | NO | NO | - | ENUM: trial, perpetual, subscription |
| status | STRING(50) | NO | NO | active | ENUM: active, grace_period, expired, revoked |
| last_verified_at | DATE | YES | NO | NULL | - |
| verification_failures | INTEGER | NO | NO | 0 | - |
| offline_grace_remaining_days | INTEGER | NO | NO | 30 | - |
| expiry_date | DATE | YES | NO | NULL | - |
| metadata | JSONB | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_licenses_hardware_id` on hardware_id
- `idx_licenses_status` on status
- `idx_licenses_license_key` UNIQUE on license_key

#### ENUM Types:
- `license_type`: trial | perpetual | subscription
- `license_status`: active | grace_period | expired | revoked

---

### 3. Category
**File:** `src/main/database/models/Category.ts`
**Table Name:** `categories`
**Description:** Product categories with hierarchical structure

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| category_code | STRING(20) | NO | YES | - | NOT EMPTY |
| category_name | STRING(100) | NO | NO | - | NOT EMPTY |
| parent_category_id | INTEGER | YES | NO | NULL | FK -> categories(id) [Self-referencing] |
| hsn_code | STRING(10) | YES | NO | NULL | - |
| description | TEXT | YES | NO | NULL | - |
| default_making_charge_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| default_wastage_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_categories_code` UNIQUE on category_code
- `idx_categories_parent` on parent_category_id
- `idx_categories_active` on is_active

#### Foreign Keys:
- `parent_category_id` -> `categories(id)` (Self-referencing hierarchy)
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 4. MetalType
**File:** `src/main/database/models/MetalType.ts`
**Table Name:** `metal_types`
**Description:** Metal types and purity levels (Gold 24K, 22K, Silver, etc.)

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| metal_name | STRING(50) | NO | NO | - | NOT EMPTY |
| purity_name | STRING(20) | NO | NO | - | NOT EMPTY |
| purity_percentage | DECIMAL(5,2) | NO | NO | - | Min 0, Max 100 |
| current_rate_per_gram | DECIMAL(10,2) | NO | NO | 0 | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_metal_types_name_purity` UNIQUE on (metal_name, purity_name)
- `idx_metal_types_active` on is_active

---

### 5. Stone
**File:** `src/main/database/models/Stone.ts`
**Table Name:** `stones`
**Description:** Master data for stones/diamonds

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| stone_name | STRING(100) | NO | NO | - | NOT EMPTY |
| stone_type | STRING(50) | NO | NO | - | NOT EMPTY |
| hsn_code | STRING(10) | YES | NO | NULL | - |
| base_rate_per_carat | DECIMAL(10,2) | NO | NO | 0 | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_stones_type` on stone_type
- `idx_stones_active` on is_active

#### Foreign Keys:
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 6. Vendor
**File:** `src/main/database/models/Vendor.ts`
**Table Name:** `vendors`
**Description:** Vendor/Supplier management

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| vendor_id | INTEGER | NO | YES | Auto-increment | PK |
| vendor_code | STRING(50) | NO | YES | - | UNIQUE |
| vendor_name | STRING(200) | NO | NO | - | - |
| contact_person | STRING(100) | YES | NO | NULL | - |
| phone | STRING(20) | NO | NO | - | - |
| email | STRING(100) | YES | NO | NULL | - |
| gstin | STRING(15) | YES | NO | NULL | - |
| address | TEXT | YES | NO | NULL | - |
| city | STRING(100) | YES | NO | NULL | - |
| state | STRING(100) | YES | NO | NULL | - |
| pincode | STRING(10) | YES | NO | NULL | - |
| vendor_type | STRING(50) | NO | NO | metal_supplier | ENUM: metal_supplier, diamond_supplier, stone_supplier, other |
| current_balance | DECIMAL(15,2) | NO | NO | 0 | - |
| credit_limit | DECIMAL(15,2) | NO | NO | 0 | - |
| payment_terms | STRING(200) | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | - |
| updated_by | INTEGER | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `vendor_type`: metal_supplier | diamond_supplier | stone_supplier | other

---

### 7. Karigar
**File:** `src/main/database/models/Karigar.ts`
**Table Name:** `karigars`
**Description:** Craftsman/Artisan management with payment tracking and metal accounts

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| karigar_code | STRING(50) | NO | YES | - | UNIQUE |
| name | STRING(200) | NO | NO | - | - |
| mobile | STRING(15) | NO | NO | - | - |
| alternate_mobile | STRING(15) | YES | NO | NULL | - |
| email | STRING(255) | YES | NO | NULL | VALID EMAIL |
| address | TEXT | YES | NO | NULL | - |
| city | STRING(100) | YES | NO | NULL | - |
| state | STRING(100) | YES | NO | NULL | - |
| pincode | STRING(10) | YES | NO | NULL | - |
| specialization | ENUM | NO | NO | general | ENUM: general, stone_setting, polishing, casting, designing, engraving |
| experience_years | INTEGER | NO | NO | 0 | - |
| skill_level | ENUM | NO | NO | beginner | ENUM: beginner, intermediate, expert, master |
| payment_type | ENUM | NO | NO | - | ENUM: per_piece, per_gram, daily_wage, monthly_salary |
| payment_rate | DECIMAL(10,2) | NO | NO | - | - |
| advance_given | DECIMAL(10,2) | NO | NO | 0 | - |
| outstanding_balance | DECIMAL(10,2) | NO | NO | 0 | - |
| metal_account_gold | DECIMAL(10,3) | NO | NO | 0 | - |
| metal_account_silver | DECIMAL(10,3) | NO | NO | 0 | - |
| total_orders_completed | INTEGER | NO | NO | 0 | - |
| total_orders_pending | INTEGER | NO | NO | 0 | - |
| average_completion_days | INTEGER | NO | NO | 0 | - |
| aadhar_number | STRING(12) | YES | NO | NULL | Len 12-12 |
| pan_number | STRING(10) | YES | NO | NULL | REGEX: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$ |
| photo_url | TEXT | YES | NO | NULL | - |
| documents | ARRAY(TEXT) | YES | NO | NULL | - |
| status | ENUM | NO | NO | active | ENUM: active, inactive, suspended |
| suspension_reason | TEXT | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `karigar_specialization`: general | stone_setting | polishing | casting | designing | engraving
- `karigar_skill_level`: beginner | intermediate | expert | master
- `karigar_payment_type`: per_piece | per_gram | daily_wage | monthly_salary
- `karigar_status`: active | inactive | suspended

#### Foreign Keys:
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 8. Customer
**File:** `src/main/database/models/Customer.ts`
**Table Name:** `customers`
**Description:** Customer management with credit and loyalty tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| customer_code | STRING(50) | NO | YES | - | UNIQUE |
| customer_type | ENUM | NO | NO | retail | ENUM: retail, wholesale, vip |
| first_name | STRING(100) | NO | NO | - | - |
| last_name | STRING(100) | YES | NO | NULL | - |
| mobile | STRING(15) | NO | NO | - | REGEX: ^[0-9]{10,15}$ |
| alternate_mobile | STRING(15) | YES | NO | NULL | - |
| email | STRING(100) | YES | NO | NULL | VALID EMAIL |
| pan_number | STRING(10) | YES | NO | NULL | REGEX: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$ |
| aadhar_number | STRING(12) | YES | NO | NULL | REGEX: ^[0-9]{12}$ |
| gstin | STRING(15) | YES | NO | NULL | REGEX: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$ |
| address_line1 | STRING(255) | YES | NO | NULL | - |
| address_line2 | STRING(255) | YES | NO | NULL | - |
| city | STRING(100) | YES | NO | NULL | - |
| state | STRING(100) | YES | NO | NULL | - |
| pincode | STRING(10) | YES | NO | NULL | - |
| country | STRING(100) | NO | NO | India | - |
| date_of_birth | DATE | YES | NO | NULL | - |
| anniversary_date | DATE | YES | NO | NULL | - |
| credit_limit | DECIMAL(12,2) | NO | NO | 0 | - |
| credit_days | INTEGER | NO | NO | 0 | - |
| outstanding_balance | DECIMAL(12,2) | NO | NO | 0 | - |
| loyalty_points | INTEGER | NO | NO | 0 | - |
| discount_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| metal_account_balance | DECIMAL(10,3) | NO | NO | 0 | - |
| notes | TEXT | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `customer_type`: retail | wholesale | vip

#### Foreign Keys:
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 9. Product
**File:** `src/main/database/models/Product.ts`
**Table Name:** `products`
**Description:** Product inventory management with weight, pricing, and status tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| product_code | STRING(50) | NO | YES | - | UNIQUE |
| barcode | STRING(100) | YES | YES | NULL | UNIQUE |
| rfid_tag | STRING(100) | YES | YES | NULL | UNIQUE |
| huid | STRING(50) | YES | NO | NULL | - |
| category_id | INTEGER | NO | NO | - | FK -> categories(id) |
| metal_type_id | INTEGER | NO | NO | - | FK -> metal_types(id) |
| product_name | STRING(200) | NO | NO | - | - |
| description | TEXT | YES | NO | NULL | - |
| design_number | STRING(100) | YES | NO | NULL | - |
| size | STRING(20) | YES | NO | NULL | - |
| gross_weight | DECIMAL(10,3) | NO | NO | - | - |
| net_weight | DECIMAL(10,3) | NO | NO | - | - |
| stone_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| wastage_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| making_charge_type | ENUM | NO | NO | - | ENUM: per_gram, percentage, fixed, slab |
| making_charge | DECIMAL(10,2) | NO | NO | 0 | - |
| hallmark_number | STRING(50) | YES | NO | NULL | - |
| hallmark_center | STRING(100) | YES | NO | NULL | - |
| purity | DECIMAL(5,2) | NO | NO | - | - |
| fine_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| quantity | INTEGER | NO | NO | 1 | - |
| current_stock | INTEGER | NO | NO | 0 | - |
| min_stock_level | INTEGER | NO | NO | 0 | - |
| reorder_level | INTEGER | NO | NO | 0 | - |
| unit_price | DECIMAL(12,2) | NO | NO | - | - |
| mrp | DECIMAL(12,2) | YES | NO | NULL | - |
| location | STRING(100) | YES | NO | NULL | - |
| rack_number | STRING(50) | YES | NO | NULL | - |
| shelf_number | STRING(50) | YES | NO | NULL | - |
| status | ENUM | NO | NO | in_stock | ENUM: in_stock, sold, reserved, in_repair, with_karigar |
| images | ARRAY(TEXT) | YES | NO | NULL | - |
| tags | ARRAY(TEXT) | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| custom_fields | JSONB | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `making_charge_type`: per_gram | percentage | fixed | slab
- `product_status`: in_stock | sold | reserved | in_repair | with_karigar

#### Foreign Keys:
- `category_id` -> `categories(id)`
- `metal_type_id` -> `metal_types(id)`
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 10. ProductStone
**File:** `src/main/database/models/ProductStone.ts`
**Table Name:** `product_stones`
**Description:** Junction table for products and stones with diamond 4C grading

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| product_id | INTEGER | NO | NO | - | FK -> products(id) CASCADE |
| stone_id | INTEGER | NO | NO | - | FK -> stones(id) |
| carat_weight | DECIMAL(6,3) | NO | NO | - | Min 0 |
| quantity | INTEGER | NO | NO | 1 | Min 1 |
| cut_grade | STRING(20) | YES | NO | NULL | - |
| color_grade | STRING(10) | YES | NO | NULL | - |
| clarity_grade | STRING(10) | YES | NO | NULL | - |
| certificate_number | STRING(100) | YES | NO | NULL | - |
| certificate_authority | STRING(50) | YES | NO | NULL | - |
| certificate_url | TEXT | YES | NO | NULL | - |
| stone_weight | DECIMAL(6,3) | NO | NO | 0 | - |
| rate_per_carat | DECIMAL(10,2) | NO | NO | - | - |
| total_value | DECIMAL(10,2) | NO | NO | 0 | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_product_stones_product_id` on product_id
- `idx_product_stones_stone_id` on stone_id

#### Foreign Keys:
- `product_id` -> `products(id)` CASCADE
- `stone_id` -> `stones(id)`

#### Hooks:
- `beforeSave`: Auto-calculate total value and stone weight

---

### 11. Invoice
**File:** `src/main/database/models/Invoice.ts`
**Table Name:** `invoices`
**Description:** Invoice management with GST, old gold, and e-invoice support

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| invoice_number | STRING(50) | NO | YES | - | UNIQUE |
| invoice_date | DATE | NO | NO | NOW() | - |
| customer_id | INTEGER | NO | NO | - | FK -> customers(id) |
| invoice_type | ENUM | NO | NO | sale | ENUM: sale, estimate, return |
| payment_status | ENUM | NO | NO | pending | ENUM: pending, partial, paid, overdue |
| customer_name | STRING(200) | NO | NO | - | - |
| customer_mobile | STRING(15) | NO | NO | - | - |
| customer_email | STRING(255) | YES | NO | NULL | - |
| customer_address | TEXT | YES | NO | NULL | - |
| customer_gstin | STRING(15) | YES | NO | NULL | - |
| customer_pan | STRING(10) | YES | NO | NULL | - |
| customer_state | STRING(100) | NO | NO | - | - |
| subtotal | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| stone_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| making_charges | DECIMAL(12,2) | NO | NO | 0 | - |
| wastage_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| gst_type | ENUM | NO | NO | intra | ENUM: intra, inter |
| cgst_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| sgst_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| igst_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| total_gst | DECIMAL(12,2) | NO | NO | 0 | - |
| making_cgst | DECIMAL(12,2) | NO | NO | 0 | - |
| making_sgst | DECIMAL(12,2) | NO | NO | 0 | - |
| making_igst | DECIMAL(12,2) | NO | NO | 0 | - |
| total_making_gst | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_cgst | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_sgst | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_igst | DECIMAL(12,2) | NO | NO | 0 | - |
| total_metal_gst | DECIMAL(12,2) | NO | NO | 0 | - |
| discount_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| discount_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| round_off | DECIMAL(10,2) | NO | NO | 0 | - |
| old_gold_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| old_gold_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| taxable_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| grand_total | DECIMAL(12,2) | NO | NO | 0 | - |
| balance_due | DECIMAL(12,2) | NO | NO | 0 | - |
| amount_paid | DECIMAL(12,2) | NO | NO | 0 | - |
| payment_mode | ENUM | YES | NO | NULL | ENUM: cash, card, upi, cheque, bank_transfer, mixed |
| transaction_ref | STRING(100) | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| terms_conditions | TEXT | YES | NO | NULL | - |
| irn | STRING(100) | YES | YES | NULL | UNIQUE |
| ack_no | STRING(50) | YES | NO | NULL | - |
| ack_date | DATE | YES | NO | NULL | - |
| qr_code | TEXT | YES | NO | NULL | - |
| einvoice_status | ENUM | NO | NO | not_generated | ENUM: not_generated, generated, cancelled |
| is_cancelled | BOOLEAN | NO | NO | false | - |
| cancelled_at | DATE | YES | NO | NULL | - |
| cancelled_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| cancellation_reason | TEXT | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `invoice_type`: sale | estimate | return
- `invoice_payment_status`: pending | partial | paid | overdue
- `gst_type`: intra | inter
- `invoice_payment_mode`: cash | card | upi | cheque | bank_transfer | mixed
- `einvoice_status`: not_generated | generated | cancelled

#### Foreign Keys:
- `customer_id` -> `customers(id)`
- `cancelled_by` -> `users(id)`
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 12. InvoiceItem
**File:** `src/main/database/models/InvoiceItem.ts`
**Table Name:** `invoice_items`
**Description:** Line items in invoices with detailed pricing and GST breakdown

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| invoice_id | INTEGER | NO | NO | - | FK -> invoices(id) CASCADE |
| product_id | INTEGER | NO | NO | - | FK -> products(id) |
| product_code | STRING(50) | NO | NO | - | - |
| product_name | STRING(200) | NO | NO | - | - |
| barcode | STRING(100) | YES | NO | NULL | - |
| huid | STRING(50) | YES | NO | NULL | - |
| category_name | STRING(100) | NO | NO | - | - |
| metal_type_name | STRING(100) | NO | NO | - | - |
| gross_weight | DECIMAL(10,3) | NO | NO | - | - |
| net_weight | DECIMAL(10,3) | NO | NO | - | - |
| stone_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| fine_weight | DECIMAL(10,3) | NO | NO | - | - |
| purity | DECIMAL(5,2) | NO | NO | - | - |
| metal_rate | DECIMAL(10,2) | NO | NO | - | - |
| quantity | INTEGER | NO | NO | 1 | - |
| wastage_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| wastage_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| making_charge_type | ENUM | NO | NO | - | ENUM: per_gram, percentage, fixed, slab |
| making_charge_rate | DECIMAL(10,2) | NO | NO | - | - |
| making_charge_amount | DECIMAL(12,2) | NO | NO | - | - |
| stone_details | JSONB | YES | NO | NULL | - |
| stone_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| hsn_code | STRING(8) | NO | NO | - | - |
| tax_rate | DECIMAL(5,2) | NO | NO | - | - |
| metal_amount | DECIMAL(12,2) | NO | NO | - | - |
| subtotal | DECIMAL(12,2) | NO | NO | - | - |
| metal_cgst | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_sgst | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_igst | DECIMAL(12,2) | NO | NO | 0 | - |
| metal_gst_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| making_cgst | DECIMAL(12,2) | NO | NO | 0 | - |
| making_sgst | DECIMAL(12,2) | NO | NO | 0 | - |
| making_igst | DECIMAL(12,2) | NO | NO | 0 | - |
| making_gst_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| total_gst | DECIMAL(12,2) | NO | NO | 0 | - |
| line_total | DECIMAL(12,2) | NO | NO | - | - |
| discount_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| discount_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| notes | TEXT | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Foreign Keys:
- `invoice_id` -> `invoices(id)` CASCADE
- `product_id` -> `products(id)`

---

### 13. Payment
**File:** `src/main/database/models/Payment.ts`
**Table Name:** `payments`
**Description:** Invoice payment tracking with multiple payment modes

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| invoice_id | INTEGER | NO | NO | - | FK -> invoices(id) CASCADE |
| payment_date | DATE | NO | NO | NOW() | - |
| payment_mode | ENUM | NO | NO | - | ENUM: cash, card, upi, cheque, bank_transfer, metal_account |
| amount | DECIMAL(12,2) | NO | NO | - | - |
| transaction_ref | STRING(100) | YES | NO | NULL | - |
| card_last4 | STRING(4) | YES | NO | NULL | - |
| card_type | STRING(50) | YES | NO | NULL | - |
| upi_id | STRING(100) | YES | NO | NULL | - |
| cheque_number | STRING(50) | YES | NO | NULL | - |
| cheque_date | DATE | YES | NO | NULL | - |
| bank_name | STRING(100) | YES | NO | NULL | - |
| bank_account | STRING(50) | YES | NO | NULL | - |
| metal_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| metal_rate | DECIMAL(10,2) | NO | NO | 0 | - |
| metal_type | STRING(50) | YES | NO | NULL | - |
| payment_status | ENUM | NO | NO | cleared | ENUM: pending, cleared, failed, cancelled |
| cleared_date | DATE | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| receipt_number | STRING(50) | YES | YES | NULL | UNIQUE |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `payment_mode`: cash | card | upi | cheque | bank_transfer | metal_account
- `payment_status`: pending | cleared | failed | cancelled

#### Foreign Keys:
- `invoice_id` -> `invoices(id)` CASCADE
- `created_by` -> `users(id)`

---

### 14. OldGoldTransaction
**File:** `src/main/database/models/OldGoldTransaction.ts`
**Table Name:** `old_gold_transactions`
**Description:** Old gold evaluation and settlement transactions

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| invoice_id | INTEGER | NO | NO | - | FK -> invoices(id) CASCADE |
| customer_id | INTEGER | NO | NO | - | FK -> customers(id) |
| transaction_date | DATE | NO | NO | NOW() | - |
| metal_type | STRING(50) | NO | NO | - | - |
| gross_weight | DECIMAL(10,3) | NO | NO | - | - |
| stone_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| net_weight | DECIMAL(10,3) | NO | NO | - | - |
| purity | DECIMAL(5,2) | NO | NO | - | - |
| fine_weight | DECIMAL(10,3) | NO | NO | - | - |
| test_method | ENUM | NO | NO | - | ENUM: touchstone, acid_test, xrf_machine, fire_assay, hallmark |
| tested_purity | DECIMAL(5,2) | NO | NO | - | - |
| tested_by | STRING(100) | YES | NO | NULL | - |
| current_rate | DECIMAL(10,2) | NO | NO | - | - |
| metal_value | DECIMAL(12,2) | NO | NO | - | - |
| melting_loss_percentage | DECIMAL(5,2) | NO | NO | 0.5 | - |
| melting_loss_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| melting_loss_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| final_weight | DECIMAL(10,3) | NO | NO | - | - |
| final_value | DECIMAL(12,2) | NO | NO | - | - |
| item_description | TEXT | YES | NO | NULL | - |
| item_photos | ARRAY(TEXT) | YES | NO | NULL | - |
| status | ENUM | NO | NO | accepted | ENUM: accepted, tested, valued, settled, rejected |
| rejection_reason | TEXT | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `test_method`: touchstone | acid_test | xrf_machine | fire_assay | hallmark
- `old_gold_status`: accepted | tested | valued | settled | rejected

#### Foreign Keys:
- `invoice_id` -> `invoices(id)` CASCADE
- `customer_id` -> `customers(id)`
- `created_by` -> `users(id)`

---

### 15. GoldLoan
**File:** `src/main/database/models/GoldLoan.ts`
**Table Name:** `gold_loans`
**Description:** Gold loan management with collateral and repayment tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| loan_number | STRING(50) | NO | YES | - | UNIQUE |
| loan_date | DATE | NO | NO | NOW() | - |
| customer_id | INTEGER | NO | NO | - | FK -> customers(id) |
| customer_name | STRING(200) | NO | NO | - | - |
| customer_mobile | STRING(15) | NO | NO | - | - |
| customer_address | TEXT | YES | NO | NULL | - |
| customer_aadhar | STRING(12) | YES | NO | NULL | - |
| customer_pan | STRING(10) | YES | NO | NULL | - |
| item_description | TEXT | NO | NO | - | - |
| gross_weight | DECIMAL(10,3) | NO | NO | - | - |
| stone_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| net_weight | DECIMAL(10,3) | NO | NO | - | - |
| purity_percentage | DECIMAL(5,2) | NO | NO | - | - |
| fine_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| current_gold_rate | DECIMAL(10,2) | NO | NO | - | - |
| appraised_value | DECIMAL(12,2) | NO | NO | 0 | - |
| ltv_ratio | DECIMAL(5,2) | NO | NO | 75.0 | - |
| loan_amount | DECIMAL(12,2) | NO | NO | - | - |
| interest_rate | DECIMAL(5,2) | NO | NO | - | - |
| interest_calculation_type | ENUM | NO | NO | monthly | ENUM: monthly, quarterly, maturity |
| tenure_months | INTEGER | NO | NO | - | - |
| disbursement_date | DATE | YES | NO | NULL | - |
| maturity_date | DATE | NO | NO | - | - |
| total_interest | DECIMAL(12,2) | NO | NO | 0 | - |
| processing_fee | DECIMAL(10,2) | NO | NO | 0 | - |
| total_payable | DECIMAL(12,2) | NO | NO | 0 | - |
| amount_paid | DECIMAL(12,2) | NO | NO | 0 | - |
| balance_due | DECIMAL(12,2) | NO | NO | 0 | - |
| status | ENUM | NO | NO | sanctioned | ENUM: sanctioned, disbursed, active, partial_repaid, closed, defaulted, foreclosed |
| payment_status | ENUM | NO | NO | pending | ENUM: pending, partial, paid |
| approved_date | DATE | YES | NO | NULL | - |
| disbursed_date | DATE | YES | NO | NULL | - |
| last_payment_date | DATE | YES | NO | NULL | - |
| closed_date | DATE | YES | NO | NULL | - |
| defaulted_date | DATE | YES | NO | NULL | - |
| item_photos | JSON | YES | NO | NULL | - |
| customer_photo | STRING(500) | YES | NO | NULL | - |
| documents | JSON | YES | NO | NULL | - |
| agreement_terms | TEXT | YES | NO | NULL | - |
| special_conditions | TEXT | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| requires_approval | BOOLEAN | NO | NO | true | - |
| approved_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| approved_at | DATE | YES | NO | NULL | - |
| is_overdue | BOOLEAN | NO | NO | false | - |
| days_overdue | INTEGER | NO | NO | 0 | - |
| risk_level | ENUM | NO | NO | low | ENUM: low, medium, high |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_gold_loans_number` UNIQUE on loan_number
- `idx_gold_loans_customer_id` on customer_id
- `idx_gold_loans_status` on status
- `idx_gold_loans_maturity_date` on maturity_date
- `idx_gold_loans_loan_date` on loan_date
- `idx_gold_loans_overdue` on is_overdue

#### ENUM Types:
- `interest_calculation_type`: monthly | quarterly | maturity
- `loan_status`: sanctioned | disbursed | active | partial_repaid | closed | defaulted | foreclosed
- `loan_payment_status`: pending | partial | paid
- `risk_level`: low | medium | high

#### Foreign Keys:
- `customer_id` -> `customers(id)`
- `approved_by` -> `users(id)`
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 16. LoanPayment
**File:** `src/main/database/models/LoanPayment.ts`
**Table Name:** `loan_payments`
**Description:** Gold loan payment tracking with multiple payment modes

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| payment_number | STRING(50) | NO | YES | - | UNIQUE |
| loan_id | INTEGER | NO | NO | - | FK -> gold_loans(id) |
| payment_date | DATE | NO | NO | NOW() | - |
| payment_type | ENUM | NO | NO | partial | ENUM: partial, full, interest_only, principal_only |
| payment_mode | ENUM | NO | NO | cash | ENUM: cash, card, upi, bank_transfer, cheque |
| principal_amount | DECIMAL(12,2) | NO | NO | - | - |
| interest_amount | DECIMAL(12,2) | NO | NO | - | - |
| penalty_amount | DECIMAL(12,2) | NO | NO | 0 | - |
| total_amount | DECIMAL(12,2) | NO | NO | - | - |
| transaction_reference | STRING(200) | YES | NO | NULL | - |
| bank_name | STRING(200) | YES | NO | NULL | - |
| cheque_number | STRING(50) | YES | NO | NULL | - |
| cheque_date | DATE | YES | NO | NULL | - |
| card_last_4_digits | STRING(4) | YES | NO | NULL | - |
| upi_transaction_id | STRING(200) | YES | NO | NULL | - |
| payment_status | ENUM | NO | NO | pending | ENUM: pending, verified, cleared, bounced |
| verified_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| verified_at | DATE | YES | NO | NULL | - |
| loan_balance_before | DECIMAL(12,2) | NO | NO | - | - |
| loan_balance_after | DECIMAL(12,2) | NO | NO | - | - |
| notes | TEXT | YES | NO | NULL | - |
| receipt_url | STRING(500) | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_loan_payments_number` UNIQUE on payment_number
- `idx_loan_payments_loan_id` on loan_id
- `idx_loan_payments_date` on payment_date
- `idx_loan_payments_status` on payment_status

#### ENUM Types:
- `payment_type`: partial | full | interest_only | principal_only
- `payment_mode`: cash | card | upi | bank_transfer | cheque
- `payment_status`: pending | verified | cleared | bounced

#### Foreign Keys:
- `loan_id` -> `gold_loans(id)`
- `verified_by` -> `users(id)`
- `created_by` -> `users(id)`

---

### 17. PurchaseOrder
**File:** `src/main/database/models/PurchaseOrder.ts`
**Table Name:** `purchase_orders`
**Description:** Vendor purchase order tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| purchase_order_id | INTEGER | NO | YES | Auto-increment | PK |
| po_number | STRING(50) | NO | YES | - | UNIQUE |
| vendor_id | INTEGER | NO | NO | - | - |
| po_date | DATE | NO | NO | NOW() | - |
| expected_delivery_date | DATE | YES | NO | NULL | - |
| metal_type_id | INTEGER | YES | NO | NULL | - |
| quantity | DECIMAL(10,3) | NO | NO | - | - |
| rate_per_gram | DECIMAL(10,2) | NO | NO | - | - |
| total_amount | DECIMAL(15,2) | NO | NO | - | - |
| cgst_amount | DECIMAL(15,2) | NO | NO | 0 | - |
| sgst_amount | DECIMAL(15,2) | NO | NO | 0 | - |
| igst_amount | DECIMAL(15,2) | NO | NO | 0 | - |
| grand_total | DECIMAL(15,2) | NO | NO | - | - |
| status | STRING(20) | NO | NO | pending | - |
| received_quantity | DECIMAL(10,3) | NO | NO | 0 | - |
| notes | TEXT | YES | NO | NULL | - |
| created_by | INTEGER | YES | NO | NULL | - |
| updated_by | INTEGER | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

---

### 18. Quotation
**File:** `src/main/database/models/Quotation.ts`
**Table Name:** `quotations`
**Description:** Sales quotation management

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| quotation_id | INTEGER | NO | YES | Auto-increment | PK |
| quotation_number | STRING(50) | NO | YES | - | UNIQUE |
| customer_id | INTEGER | NO | NO | - | - |
| quotation_date | DATE | NO | NO | NOW() | - |
| valid_until | DATE | NO | NO | - | - |
| subtotal | DECIMAL(15,2) | NO | NO | - | - |
| discount_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| discount_amount | DECIMAL(15,2) | NO | NO | 0 | - |
| total_tax | DECIMAL(15,2) | NO | NO | - | - |
| grand_total | DECIMAL(15,2) | NO | NO | - | - |
| status | STRING(20) | NO | NO | pending | - |
| converted_invoice_id | INTEGER | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| created_by | INTEGER | YES | NO | NULL | - |
| updated_by | INTEGER | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

---

### 19. QuotationItem
**File:** `src/main/database/models/QuotationItem.ts`
**Table Name:** `quotation_items`
**Description:** Line items in quotations

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| item_id | INTEGER | NO | YES | Auto-increment | PK |
| quotation_id | INTEGER | NO | NO | - | - |
| product_id | INTEGER | YES | NO | NULL | - |
| product_name | STRING(200) | NO | NO | - | - |
| description | TEXT | YES | NO | NULL | - |
| hsn_code | STRING(20) | YES | NO | NULL | - |
| quantity | INTEGER | NO | NO | 1 | - |
| unit_price | DECIMAL(15,2) | NO | NO | - | - |
| discount | DECIMAL(15,2) | NO | NO | 0 | - |
| tax_rate | DECIMAL(5,2) | NO | NO | - | - |
| item_total | DECIMAL(15,2) | NO | NO | - | - |

---

### 20. SalesReturn
**File:** `src/main/database/models/SalesReturn.ts`
**Table Name:** `sales_returns`
**Description:** Sales return and exchange management

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| return_id | INTEGER | NO | YES | Auto-increment | PK |
| return_number | STRING(50) | NO | YES | - | UNIQUE |
| original_invoice_id | INTEGER | NO | NO | - | - |
| customer_id | INTEGER | NO | NO | - | - |
| return_date | DATE | NO | NO | NOW() | - |
| return_type | STRING(20) | NO | NO | - | - |
| reason | TEXT | YES | NO | NULL | - |
| refund_amount | DECIMAL(15,2) | NO | NO | - | - |
| exchange_invoice_id | INTEGER | YES | NO | NULL | - |
| status | STRING(20) | NO | NO | pending | - |
| approved_by | INTEGER | YES | NO | NULL | - |
| approved_at | DATE | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| created_by | INTEGER | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

---

### 21. KarigarOrder
**File:** `src/main/database/models/KarigarOrder.ts`
**Table Name:** `karigar_orders`
**Description:** Work orders for karigars with metal tracking and payment

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| order_number | STRING(50) | NO | YES | - | UNIQUE |
| karigar_id | INTEGER | NO | NO | - | FK -> karigars(id) |
| order_date | DATE | NO | NO | NOW() | - |
| expected_delivery_date | DATE | NO | NO | - | - |
| actual_delivery_date | DATE | YES | NO | NULL | - |
| order_type | ENUM | NO | NO | - | ENUM: new_making, repair, stone_setting, polishing, designing, custom |
| description | TEXT | NO | NO | - | - |
| design_reference | STRING(200) | YES | NO | NULL | - |
| design_images | ARRAY(TEXT) | YES | NO | NULL | - |
| product_id | INTEGER | YES | NO | NULL | FK -> products(id) |
| product_code | STRING(50) | YES | NO | NULL | - |
| product_name | STRING(200) | YES | NO | NULL | - |
| quantity | INTEGER | NO | NO | 1 | - |
| metal_type | STRING(50) | NO | NO | - | - |
| metal_issued_weight | DECIMAL(10,3) | NO | NO | - | - |
| metal_issued_purity | DECIMAL(5,2) | NO | NO | - | - |
| metal_issued_fine_weight | DECIMAL(10,3) | NO | NO | - | - |
| metal_received_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| metal_received_purity | DECIMAL(5,2) | NO | NO | 0 | - |
| metal_received_fine_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| wastage_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| wastage_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| wastage_amount | DECIMAL(10,2) | NO | NO | 0 | - |
| labour_charges | DECIMAL(10,2) | NO | NO | - | - |
| payment_type | ENUM | NO | NO | - | ENUM: per_piece, per_gram, fixed |
| payment_rate | DECIMAL(10,2) | NO | NO | - | - |
| total_payment | DECIMAL(10,2) | NO | NO | - | - |
| payment_status | ENUM | NO | NO | pending | ENUM: pending, partial, paid |
| amount_paid | DECIMAL(10,2) | NO | NO | 0 | - |
| status | ENUM | NO | NO | pending | ENUM: pending, in_progress, completed, delivered, cancelled |
| priority | ENUM | NO | NO | medium | ENUM: low, medium, high, urgent |
| progress_percentage | INTEGER | NO | NO | 0 | - |
| remarks | TEXT | YES | NO | NULL | - |
| cancellation_reason | TEXT | YES | NO | NULL | - |
| quality_check_done | BOOLEAN | NO | NO | false | - |
| quality_check_passed | BOOLEAN | NO | NO | false | - |
| quality_remarks | TEXT | YES | NO | NULL | - |
| started_at | DATE | YES | NO | NULL | - |
| completed_at | DATE | YES | NO | NULL | - |
| delivered_at | DATE | YES | NO | NULL | - |
| cancelled_at | DATE | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| updated_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `order_type`: new_making | repair | stone_setting | polishing | designing | custom
- `payment_type`: per_piece | per_gram | fixed
- `payment_status`: pending | partial | paid
- `status`: pending | in_progress | completed | delivered | cancelled
- `priority`: low | medium | high | urgent

#### Foreign Keys:
- `karigar_id` -> `karigars(id)`
- `product_id` -> `products(id)`
- `created_by` -> `users(id)`
- `updated_by` -> `users(id)`

---

### 22. MetalRate
**File:** `src/main/database/models/MetalRate.ts`
**Table Name:** `metal_rates`
**Description:** Historical metal rate tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| rate_id | INTEGER | NO | YES | Auto-increment | PK |
| rate_date | DATE | NO | NO | NOW() | - |
| gold_24k | DECIMAL(10,2) | NO | NO | - | - |
| gold_22k | DECIMAL(10,2) | NO | NO | - | - |
| gold_18k | DECIMAL(10,2) | NO | NO | - | - |
| silver | DECIMAL(10,2) | NO | NO | - | - |
| platinum | DECIMAL(10,2) | NO | NO | - | - |
| source | STRING(20) | NO | NO | manual | - |
| created_by | INTEGER | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |

---

### 23. MetalTransaction
**File:** `src/main/database/models/MetalTransaction.ts`
**Table Name:** `metal_transactions`
**Description:** Metal issue/receive transactions with karigars

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| transaction_number | STRING(50) | NO | YES | - | UNIQUE |
| transaction_date | DATE | NO | NO | NOW() | - |
| transaction_type | ENUM | NO | NO | - | ENUM: issue, receive, adjustment |
| karigar_id | INTEGER | NO | NO | - | FK -> karigars(id) |
| karigar_name | STRING(200) | NO | NO | - | - |
| karigar_order_id | INTEGER | YES | NO | NULL | FK -> karigar_orders(id) |
| order_number | STRING(50) | YES | NO | NULL | - |
| metal_type | STRING(50) | NO | NO | - | - |
| metal_purity | DECIMAL(5,2) | NO | NO | - | - |
| gross_weight | DECIMAL(10,3) | NO | NO | - | - |
| stone_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| net_weight | DECIMAL(10,3) | NO | NO | - | - |
| fine_weight | DECIMAL(10,3) | NO | NO | - | - |
| metal_rate | DECIMAL(10,2) | NO | NO | - | - |
| metal_value | DECIMAL(12,2) | NO | NO | - | - |
| expected_weight | DECIMAL(10,3) | YES | NO | NULL | - |
| actual_weight | DECIMAL(10,3) | YES | NO | NULL | - |
| wastage_weight | DECIMAL(10,3) | NO | NO | 0 | - |
| wastage_percentage | DECIMAL(5,2) | NO | NO | 0 | - |
| wastage_value | DECIMAL(10,2) | NO | NO | 0 | - |
| status | ENUM | NO | NO | pending | ENUM: pending, completed, cancelled |
| reference_number | STRING(100) | YES | NO | NULL | - |
| description | TEXT | YES | NO | NULL | - |
| notes | TEXT | YES | NO | NULL | - |
| requires_approval | BOOLEAN | NO | NO | false | - |
| approved_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| approved_at | DATE | YES | NO | NULL | - |
| photos | ARRAY(TEXT) | YES | NO | NULL | - |
| is_active | BOOLEAN | NO | NO | true | - |
| created_by | INTEGER | YES | NO | NULL | FK -> users(id) |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### ENUM Types:
- `transaction_type`: issue | receive | adjustment
- `status`: pending | completed | cancelled

#### Foreign Keys:
- `karigar_id` -> `karigars(id)`
- `karigar_order_id` -> `karigar_orders(id)`
- `approved_by` -> `users(id)`
- `created_by` -> `users(id)`

---

### 24. AuditLog
**File:** `src/main/database/models/AuditLog.ts`
**Table Name:** `audit_logs`
**Description:** System audit trail for compliance and tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| log_id | INTEGER | NO | YES | Auto-increment | PK |
| user_id | INTEGER | NO | NO | - | - |
| action | STRING(50) | NO | NO | - | ENUM: CREATE, UPDATE, DELETE, LOGIN, LOGOUT |
| entity_type | STRING(50) | YES | NO | NULL | - |
| entity_id | STRING(50) | YES | NO | NULL | - |
| old_values | JSONB | YES | NO | NULL | - |
| new_values | JSONB | YES | NO | NULL | - |
| ip_address | STRING(50) | YES | NO | NULL | - |
| user_agent | TEXT | YES | NO | NULL | - |
| timestamp | DATE | NO | NO | NOW() | - |

---

### 25. Notification
**File:** `src/main/database/models/Notification.ts`
**Table Name:** `notifications`
**Description:** User notifications system

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| notification_id | INTEGER | NO | YES | Auto-increment | PK |
| user_id | INTEGER | NO | NO | - | - |
| title | STRING(200) | NO | NO | - | - |
| message | TEXT | NO | NO | - | - |
| type | STRING(20) | NO | NO | info | - |
| priority | STRING(20) | NO | NO | medium | - |
| is_read | BOOLEAN | NO | NO | false | - |
| read_at | DATE | YES | NO | NULL | - |
| entity_type | STRING(50) | YES | NO | NULL | - |
| entity_id | STRING(50) | YES | NO | NULL | - |
| created_at | DATE | NO | NO | NOW() | - |

---

### 26. SyncQueue
**File:** `src/main/database/models/SyncQueue.ts`
**Table Name:** `sync_queue`
**Description:** Offline change tracking for synchronization

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| table_name | STRING(100) | NO | NO | - | - |
| operation | ENUM | NO | NO | - | ENUM: insert, update, delete |
| record_id | INTEGER | NO | NO | - | - |
| data | JSONB | NO | NO | - | - |
| branch_id | INTEGER | NO | NO | - | FK -> branches(id) |
| created_at | DATE | NO | NO | NOW() | - |
| synced_at | DATE | YES | NO | NULL | - |
| sync_status | ENUM | NO | NO | pending | ENUM: pending, syncing, synced, failed |
| sync_error | TEXT | YES | NO | NULL | - |
| retry_count | INTEGER | NO | NO | 0 | - |

#### Indexes:
- `idx_sync_queue_status` on sync_status
- `idx_sync_queue_branch_id` on branch_id
- `idx_sync_queue_table_record` on (table_name, record_id)

#### ENUM Types:
- `operation`: insert | update | delete
- `sync_status`: pending | syncing | synced | failed

#### Foreign Keys:
- `branch_id` -> `branches(id)` (EXTERNAL - not defined)

---

### 27. SyncStatus
**File:** `src/main/database/models/SyncStatus.ts`
**Table Name:** `sync_status`
**Description:** Branch synchronization status tracking

#### Fields:
| Field | Type | Nullable | Unique | Default | Constraints |
|-------|------|----------|--------|---------|-------------|
| id | INTEGER | NO | YES | Auto-increment | PK |
| branch_id | INTEGER | NO | YES | - | FK -> branches(id) UNIQUE |
| last_sync_at | DATE | YES | NO | NULL | - |
| last_push_at | DATE | YES | NO | NULL | - |
| last_pull_at | DATE | YES | NO | NULL | - |
| sync_enabled | BOOLEAN | NO | NO | true | - |
| sync_interval_minutes | INTEGER | NO | NO | 5 | - |
| pending_changes_count | INTEGER | NO | NO | 0 | - |
| failed_changes_count | INTEGER | NO | NO | 0 | - |
| last_sync_error | TEXT | YES | NO | NULL | - |
| is_syncing | BOOLEAN | NO | NO | false | - |
| created_at | DATE | NO | NO | NOW() | - |
| updated_at | DATE | NO | NO | NOW() | - |

#### Indexes:
- `idx_sync_status_branch_id` UNIQUE on branch_id

#### Foreign Keys:
- `branch_id` -> `branches(id)` UNIQUE (EXTERNAL - not defined)

---

## ENUM Types

### Complete List of ENUM Types to Create

```sql
-- License ENUMs
CREATE TYPE license_type AS ENUM ('trial', 'perpetual', 'subscription');
CREATE TYPE license_status AS ENUM ('active', 'grace_period', 'expired', 'revoked');

-- Vendor ENUMs
CREATE TYPE vendor_type AS ENUM ('metal_supplier', 'diamond_supplier', 'stone_supplier', 'other');

-- Karigar ENUMs
CREATE TYPE karigar_specialization AS ENUM ('general', 'stone_setting', 'polishing', 'casting', 'designing', 'engraving');
CREATE TYPE karigar_skill_level AS ENUM ('beginner', 'intermediate', 'expert', 'master');
CREATE TYPE karigar_payment_type AS ENUM ('per_piece', 'per_gram', 'daily_wage', 'monthly_salary');
CREATE TYPE karigar_status AS ENUM ('active', 'inactive', 'suspended');

-- Customer ENUMs
CREATE TYPE customer_type AS ENUM ('retail', 'wholesale', 'vip');

-- Product ENUMs
CREATE TYPE making_charge_type AS ENUM ('per_gram', 'percentage', 'fixed', 'slab');
CREATE TYPE product_status AS ENUM ('in_stock', 'sold', 'reserved', 'in_repair', 'with_karigar');

-- Invoice ENUMs
CREATE TYPE invoice_type AS ENUM ('sale', 'estimate', 'return');
CREATE TYPE invoice_payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE gst_type AS ENUM ('intra', 'inter');
CREATE TYPE invoice_payment_mode AS ENUM ('cash', 'card', 'upi', 'cheque', 'bank_transfer', 'mixed');
CREATE TYPE einvoice_status AS ENUM ('not_generated', 'generated', 'cancelled');

-- Payment ENUMs
CREATE TYPE payment_mode AS ENUM ('cash', 'card', 'upi', 'cheque', 'bank_transfer', 'metal_account');
CREATE TYPE payment_status AS ENUM ('pending', 'cleared', 'failed', 'cancelled');

-- Old Gold ENUMs
CREATE TYPE test_method AS ENUM ('touchstone', 'acid_test', 'xrf_machine', 'fire_assay', 'hallmark');
CREATE TYPE old_gold_status AS ENUM ('accepted', 'tested', 'valued', 'settled', 'rejected');

-- Gold Loan ENUMs
CREATE TYPE interest_calculation_type AS ENUM ('monthly', 'quarterly', 'maturity');
CREATE TYPE loan_status AS ENUM ('sanctioned', 'disbursed', 'active', 'partial_repaid', 'closed', 'defaulted', 'foreclosed');
CREATE TYPE loan_payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Karigar Order ENUMs
CREATE TYPE karigar_order_type AS ENUM ('new_making', 'repair', 'stone_setting', 'polishing', 'designing', 'custom');
CREATE TYPE karigar_order_payment_type AS ENUM ('per_piece', 'per_gram', 'fixed');
CREATE TYPE karigar_order_status AS ENUM ('pending', 'in_progress', 'completed', 'delivered', 'cancelled');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Metal Transaction ENUMs
CREATE TYPE transaction_type AS ENUM ('issue', 'receive', 'adjustment');
CREATE TYPE metal_transaction_status AS ENUM ('pending', 'completed', 'cancelled');

-- Sync ENUMs
CREATE TYPE sync_operation AS ENUM ('insert', 'update', 'delete');
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');
```

---

## Dependency Graph

### Model Dependencies (Foreign Keys)

```
External Dependencies:
├── roles (referenced by User.role_id)
├── branches (referenced by User.branch_id, SyncQueue.branch_id, SyncStatus.branch_id)

Core Master Data:
├── Users
├── License
├── MetalType
├── MetalRate
├── Stone
├── Category
│   └── Depends on: Users
└── Vendor

People/Entities:
├── Karigar
│   └── Depends on: Users
├── Customer
│   └── Depends on: Users
└── Product
    ├── Depends on: Category, MetalType, Users
    └── ProductStone (many-to-many junction)
        └── Depends on: Product (CASCADE), Stone

Transactions:
├── Invoice
│   ├── Depends on: Customer, Users
│   ├── InvoiceItem (child)
│   │   └── Depends on: Invoice (CASCADE), Product
│   └── Payment (child)
│       └── Depends on: Invoice (CASCADE), Users
├── OldGoldTransaction
│   └── Depends on: Invoice (CASCADE), Customer, Users
├── GoldLoan
│   ├── Depends on: Customer, Users
│   └── LoanPayment (child)
│       └── Depends on: GoldLoan, Users

Orders:
├── PurchaseOrder
│   └── Depends on: Vendor
├── Quotation
│   ├── Depends on: Customer
│   └── QuotationItem (child)
│       └── Depends on: Quotation
├── KarigarOrder
│   ├── Depends on: Karigar, Product, Users
│   └── MetalTransaction (related)
│       └── Depends on: Karigar, KarigarOrder, Users
└── SalesReturn
    └── Depends on: Customer

System Tables:
├── MetalTransaction
│   └── Depends on: Karigar, KarigarOrder, Users
├── AuditLog
│   └── No direct dependencies
├── Notification
│   └── No direct dependencies
├── SyncQueue
│   └── Depends on: Branches (external)
└── SyncStatus
    └── Depends on: Branches (external)
```

---

## Foreign Key Relationships Summary

### Tables with Self-Referencing Foreign Keys:
1. **User**: `created_by` -> `users(id)`, `updated_by` -> `users(id)`
2. **Category**: `parent_category_id` -> `categories(id)` (Hierarchical)

### Cascade Delete Relationships:
1. **Product** -> **ProductStone**: Deleting a product cascades to delete product_stones
2. **Invoice** -> **InvoiceItem**: Deleting an invoice cascades to delete invoice_items
3. **Invoice** -> **Payment**: Deleting an invoice cascades to delete payments
4. **Invoice** -> **OldGoldTransaction**: Deleting an invoice cascades to delete old_gold_transactions

### Foreign Keys to External Tables (NOT DEFINED):
1. **User.role_id** -> `roles(id)`
2. **User.branch_id** -> `branches(id)`
3. **SyncQueue.branch_id** -> `branches(id)`
4. **SyncStatus.branch_id** -> `branches(id)`

---

## Creation Order

### Order to Create Tables (Respecting Dependencies):

1. **Foundation Tables** (No dependencies)
   - licenses
   - metal_types
   - metal_rates
   - stones

2. **External Reference Tables** (Assumed to exist)
   - roles (external)
   - branches (external)

3. **User Management**
   - users (has self-referencing FKs and external refs)

4. **Master Data**
   - categories (has self-referencing FK, depends on users)
   - vendors (depends on nothing)

5. **Entity Masters**
   - karigars (depends on users)
   - customers (depends on users)

6. **Products**
   - products (depends on categories, metal_types, users)
   - product_stones (depends on products, stones)

7. **Transactions - Invoicing**
   - invoices (depends on customers, users)
   - invoice_items (depends on invoices, products)
   - payments (depends on invoices, users)

8. **Transactions - Gold**
   - old_gold_transactions (depends on invoices, customers, users)
   - gold_loans (depends on customers, users)
   - loan_payments (depends on gold_loans, users)

9. **Orders**
   - purchase_orders (depends on vendors)
   - quotations (depends on customers)
   - quotation_items (depends on quotations)
   - karigar_orders (depends on karigars, products, users)
   - sales_returns (depends on customers)

10. **Metal Management**
    - metal_transactions (depends on karigars, karigar_orders, users)

11. **System Tables**
    - audit_logs
    - notifications
    - sync_queue (depends on branches - external)
    - sync_status (depends on branches - external)

---

## Summary Statistics

- **Total Models**: 27
- **Total Fields**: ~550+ (across all models)
- **ENUM Types**: 28+
- **Self-Referencing Tables**: 2 (users, categories)
- **Cascade Delete Relationships**: 4
- **External Dependencies**: 4 tables (roles, branches)
- **Tables with Indexes**: 18+
- **JSONB/JSON Fields**: 8
- **ARRAY Fields**: 7
- **Unique Constraints**: 35+

