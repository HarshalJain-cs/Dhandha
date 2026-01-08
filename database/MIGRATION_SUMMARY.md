# PostgreSQL Migration Files - Summary

## Overview
Successfully generated all 27 PostgreSQL migration files for the Dhandha application based on the DATABASE_SCHEMA_ANALYSIS.md document.

## Migration Files Created

### 1. Foundation Tables (No Dependencies)
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 1 | 20260107120001 | create-users.js | users | System users with authentication |
| 2 | 20260107120002 | create-categories.js | categories | Product categories (self-referencing) |
| 3 | 20260107120003 | create-metal-types.js | metal_types | Metal types and purity levels |
| 4 | 20260107120004 | create-stones.js | stones | Stone/diamond master data |
| 5 | 20260107120005 | create-vendors.js | vendors | Vendor/supplier management |

### 2. Entity Masters (Depend on Users)
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 6 | 20260107120006 | create-karigars.js | karigars | Craftsman/artisan management |
| 7 | 20260107120007 | create-customers.js | customers | Customer management |

### 3. Product Management
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 8 | 20260107120008 | create-products.js | products | Product inventory |
| 9 | 20260107120009 | create-product-stones.js | product_stones | Product-stone junction table |

### 4. Invoice & Payment Management
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 10 | 20260107120010 | create-invoices.js | invoices | Invoice management with GST |
| 11 | 20260107120011 | create-invoice-items.js | invoice_items | Invoice line items |
| 12 | 20260107120012 | create-payments.js | payments | Payment tracking |

### 5. Gold Transactions
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 13 | 20260107120013 | create-old-gold-transactions.js | old_gold_transactions | Old gold evaluation |
| 14 | 20260107120014 | create-gold-loans.js | gold_loans | Gold loan management |
| 15 | 20260107120015 | create-loan-payments.js | loan_payments | Loan payment tracking |

### 6. Order Management
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 16 | 20260107120016 | create-purchase-orders.js | purchase_orders | Vendor purchase orders |
| 17 | 20260107120017 | create-quotations.js | quotations | Sales quotations |
| 18 | 20260107120018 | create-quotation-items.js | quotation_items | Quotation line items |
| 19 | 20260107120019 | create-sales-returns.js | sales_returns | Sales returns & exchanges |
| 20 | 20260107120020 | create-karigar-orders.js | karigar_orders | Karigar work orders |

### 7. Metal & Rate Management
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 21 | 20260107120021 | create-metal-rates.js | metal_rates | Historical metal rates |
| 22 | 20260107120022 | create-metal-transactions.js | metal_transactions | Metal issue/receive transactions |

### 8. System Tables
| # | Timestamp | File | Table | Description |
|---|-----------|------|-------|-------------|
| 23 | 20260107120023 | create-audit-logs.js | audit_logs | System audit trail |
| 24 | 20260107120024 | create-notifications.js | notifications | User notifications |
| 25 | 20260107120025 | create-sync-queues.js | sync_queue | Offline sync queue |
| 26 | 20260107120026 | create-sync-statuses.js | sync_status | Branch sync status |
| 27 | 20260107120027 | create-licenses.js | licenses | License management |

## PostgreSQL ENUM Types Created

### License ENUMs
- `license_type`: trial, perpetual, subscription
- `license_status`: active, grace_period, expired, revoked

### Vendor ENUMs
- `vendor_type`: metal_supplier, diamond_supplier, stone_supplier, other

### Karigar ENUMs
- `karigar_specialization`: general, stone_setting, polishing, casting, designing, engraving
- `karigar_skill_level`: beginner, intermediate, expert, master
- `karigar_payment_type`: per_piece, per_gram, daily_wage, monthly_salary
- `karigar_status`: active, inactive, suspended

### Customer ENUMs
- `customer_type`: retail, wholesale, vip

### Product ENUMs
- `making_charge_type`: per_gram, percentage, fixed, slab
- `product_status`: in_stock, sold, reserved, in_repair, with_karigar

### Invoice ENUMs
- `invoice_type`: sale, estimate, return
- `invoice_payment_status`: pending, partial, paid, overdue
- `gst_type`: intra, inter
- `invoice_payment_mode`: cash, card, upi, cheque, bank_transfer, mixed
- `einvoice_status`: not_generated, generated, cancelled

### Payment ENUMs
- `payment_mode`: cash, card, upi, cheque, bank_transfer, metal_account
- `payment_status`: pending, cleared, failed, cancelled

### Old Gold ENUMs
- `test_method`: touchstone, acid_test, xrf_machine, fire_assay, hallmark
- `old_gold_status`: accepted, tested, valued, settled, rejected

### Gold Loan ENUMs
- `interest_calculation_type`: monthly, quarterly, maturity
- `loan_status`: sanctioned, disbursed, active, partial_repaid, closed, defaulted, foreclosed
- `loan_payment_status`: pending, partial, paid
- `risk_level`: low, medium, high

### Karigar Order ENUMs
- `karigar_order_type`: new_making, repair, stone_setting, polishing, designing, custom
- `karigar_order_payment_type`: per_piece, per_gram, fixed
- `karigar_order_payment_status`: pending, partial, paid
- `karigar_order_status`: pending, in_progress, completed, delivered, cancelled
- `priority`: low, medium, high, urgent

### Loan Payment ENUMs
- `loan_payment_type`: partial, full, interest_only, principal_only
- `loan_payment_mode`: cash, card, upi, bank_transfer, cheque
- `loan_payment_verification_status`: pending, verified, cleared, bounced

### Metal Transaction ENUMs
- `transaction_type`: issue, receive, adjustment
- `metal_transaction_status`: pending, completed, cancelled

### Sync ENUMs
- `sync_operation`: insert, update, delete
- `sync_status`: pending, syncing, synced, failed

## Key Features Implemented

### 1. Foreign Key Constraints
- Proper CASCADE, RESTRICT, and SET NULL actions
- Self-referencing foreign keys (users, categories)
- CASCADE delete for child tables (invoice_items, payments, etc.)

### 2. Indexes
- Unique indexes on code/number fields
- Composite indexes for frequently queried combinations
- Foreign key indexes for performance
- Status and date indexes for filtering

### 3. PostgreSQL-Specific Types
- **JSONB**: Used for custom_fields, metadata, old_values, new_values
- **ARRAY**: Used for images, tags, documents, photos
- **DECIMAL**: Proper precision for money (12,2) and weights (10,3)
- **ENUM**: Custom types created as PostgreSQL ENUMs (not simple strings)

### 4. Default Values
- Timestamps with `CURRENT_TIMESTAMP`
- Boolean defaults (is_active = true)
- Numeric defaults (0 for balances, quantities)
- Status defaults (pending, active, etc.)

### 5. Migration Structure
- `up()`: Creates ENUM types first, then table, then indexes
- `down()`: Drops table first, then ENUM types
- Sequelize.literal() for PostgreSQL-specific defaults

## Running Migrations

### Using Sequelize CLI
```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Run specific migration
npx sequelize-cli db:migrate --to 20260107120027-create-licenses.js
```

### Configuration Required
Make sure your `.sequelizerc` and `config/config.json` files are properly configured for PostgreSQL:

```json
{
  "development": {
    "dialect": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "dhandha_dev",
    "username": "postgres",
    "password": "your_password"
  }
}
```

## Important Notes

### 1. External Dependencies
These migrations reference tables that are NOT defined in the schema:
- `roles` (referenced by users.role_id)
- `branches` (referenced by users.branch_id, sync_queue.branch_id, sync_status.branch_id)

**Action Required**: Create migrations for these tables BEFORE running the user and sync migrations, or remove these foreign key constraints.

### 2. Self-Referencing Foreign Keys
- **users**: created_by and updated_by reference users(id)
- **categories**: parent_category_id references categories(id)

These are handled correctly with SET NULL on delete.

### 3. CASCADE Deletes
The following relationships will CASCADE delete:
- Deleting a product → deletes all product_stones
- Deleting an invoice → deletes all invoice_items, payments, and old_gold_transactions

### 4. UUID vs INTEGER
Current implementation uses INTEGER for primary keys. If you want to switch to UUID:
1. Change type to `Sequelize.UUID`
2. Add `defaultValue: Sequelize.literal('gen_random_uuid()')`
3. Enable uuid-ossp extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### 5. JSONB Performance
JSONB fields (custom_fields, metadata, stone_details) support indexing:
```sql
CREATE INDEX idx_products_custom_fields ON products USING GIN (custom_fields);
```

## Validation Checklist

- [x] All 27 migration files created
- [x] Sequential timestamps (20260107120001 to 20260107120027)
- [x] Dependency order respected
- [x] All ENUM types created before use
- [x] Foreign keys with proper CASCADE/RESTRICT
- [x] Indexes created for foreign keys
- [x] Self-referencing FKs handled correctly
- [x] JSONB used instead of JSON
- [x] ARRAY types properly defined
- [x] DECIMAL precision correct (12,2 for money, 10,3 for weight)
- [x] Default values using Sequelize.literal() for PostgreSQL
- [x] Down migrations drop tables before ENUMs
- [x] Unique constraints on code/number fields
- [x] Timestamps (created_at, updated_at) on all tables

## Next Steps

1. **Create Missing Tables**: Create migrations for `roles` and `branches` tables
2. **Test Migrations**: Run migrations on a test PostgreSQL database
3. **Verify Schema**: Compare generated schema with DATABASE_SCHEMA_ANALYSIS.md
4. **Add Seeders**: Create seed files for initial data (metal types, categories, etc.)
5. **Update Models**: Ensure Sequelize models match migration definitions
6. **Performance**: Add GIN indexes for JSONB fields if needed
7. **Documentation**: Update API documentation with new schema
