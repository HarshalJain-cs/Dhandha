import { sequelize } from '../connection';
import User from './User';
import Role from './Role';
import Company from './Company';
import Branch from './Branch';
import Product from './Product';
import Customer from './Customer';
import Category from './Category';
import MetalType from './MetalType';
import Stone from './Stone';
import ProductStone from './ProductStone';
import SyncQueue from './SyncQueue';
import SyncStatus from './SyncStatus';
import GoldLoan from './GoldLoan';
import LoanPayment from './LoanPayment';
import Vendor from './Vendor';
import PurchaseOrder from './PurchaseOrder';
import MetalRate from './MetalRate';
import SalesReturn from './SalesReturn';
import Quotation from './Quotation';
import QuotationItem from './QuotationItem';
import AuditLog from './AuditLog';
import Notification from './Notification';
import License from './License';
import StockTransaction from './StockTransaction';
import Invoice from './Invoice';
import InvoiceItem from './InvoiceItem';
import Payment from './Payment';
import OldGoldTransaction from './OldGoldTransaction';
import Karigar from './Karigar';
import KarigarOrder from './KarigarOrder';
import MetalTransaction from './MetalTransaction';

/**
 * Database Models Index
 * - Imports all models
 * - Sets up associations between models
 * - Exports models for use in services
 */

/**
 * Define Model Associations
 */
export const setupAssociations = (): void => {
  // User associations
  User.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  User.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  User.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

  // Role associations
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

  // Company associations
  Company.hasMany(Branch, { foreignKey: 'company_id', as: 'branches' });
  Company.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Company.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });

  // Branch associations
  Branch.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Branch.hasMany(User, { foreignKey: 'branch_id', as: 'users' });
  Branch.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
  Branch.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Branch.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });

  // Product associations
  Product.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Product.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Product.belongsTo(MetalType, { foreignKey: 'metal_type_id', as: 'metalType' });
  Product.hasMany(ProductStone, { foreignKey: 'product_id', as: 'stones' });
  Product.hasMany(StockTransaction, { foreignKey: 'product_id', as: 'stockTransactions' });

  // Customer associations
  Customer.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Customer.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });

  // Category associations
  Category.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Category.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
  Category.belongsTo(Category, { foreignKey: 'parent_category_id', as: 'parent' });
  Category.hasMany(Category, { foreignKey: 'parent_category_id', as: 'children' });

  // MetalType associations
  MetalType.hasMany(Product, { foreignKey: 'metal_type_id', as: 'products' });

  // Stone associations
  Stone.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Stone.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Stone.hasMany(ProductStone, { foreignKey: 'stone_id', as: 'productStones' });

  // ProductStone associations
  ProductStone.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  ProductStone.belongsTo(Stone, { foreignKey: 'stone_id', as: 'stone' });

  // GoldLoan associations
  GoldLoan.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  GoldLoan.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  GoldLoan.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  GoldLoan.belongsTo(User, { as: 'approver', foreignKey: 'approved_by' });
  GoldLoan.hasMany(LoanPayment, { foreignKey: 'loan_id', as: 'payments' });

  // LoanPayment associations
  LoanPayment.belongsTo(GoldLoan, { foreignKey: 'loan_id', as: 'loan' });
  LoanPayment.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  LoanPayment.belongsTo(User, { as: 'verifier', foreignKey: 'verified_by' });

  // Vendor associations
  Vendor.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Vendor.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', as: 'purchaseOrders' });

  // PurchaseOrder associations
  PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
  PurchaseOrder.belongsTo(MetalType, { foreignKey: 'metal_type_id', as: 'metalType' });
  PurchaseOrder.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  PurchaseOrder.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });

  // MetalRate associations
  MetalRate.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

  // SalesReturn associations
  SalesReturn.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  SalesReturn.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  SalesReturn.belongsTo(User, { as: 'approver', foreignKey: 'approved_by' });

  // Quotation associations
  Quotation.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Quotation.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Quotation.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Quotation.hasMany(QuotationItem, { foreignKey: 'quotation_id', as: 'items' });

  // QuotationItem associations
  QuotationItem.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
  QuotationItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // StockTransaction associations
  StockTransaction.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  StockTransaction.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

  // Invoice associations
  Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Invoice.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Invoice.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
  Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });

  // InvoiceItem associations
  InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
  InvoiceItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Payment associations
  Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
  Payment.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

  // Customer invoice association (reverse)
  Customer.hasMany(Invoice, { foreignKey: 'customer_id', as: 'invoices' });

  // OldGoldTransaction associations
  OldGoldTransaction.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
  OldGoldTransaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  OldGoldTransaction.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

  // Karigar associations
  Karigar.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Karigar.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Karigar.hasMany(KarigarOrder, { foreignKey: 'karigar_id', as: 'orders' });

  // KarigarOrder associations
  KarigarOrder.belongsTo(Karigar, { foreignKey: 'karigar_id', as: 'karigar' });
  KarigarOrder.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  KarigarOrder.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  KarigarOrder.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });

  // MetalTransaction associations
  MetalTransaction.belongsTo(MetalType, { foreignKey: 'metal_type_id', as: 'metalType' });
  MetalTransaction.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
};

/**
 * Initialize all models and associations
 */
export const initializeModels = async (): Promise<void> => {
  try {
    // Setup associations
    setupAssociations();

    // Using migrations for schema management, not sequelize.sync()
    console.log('✓ Models initialized (using migrations for schema)');
  } catch (error: any) {
    console.error('✗ Error initializing models:', error.message);
    throw error;
  }
};

/**
 * Export all models
 */
export {
  sequelize,
  User,
  Role,
  Company,
  Branch,
  Product,
  Customer,
  Category,
  MetalType,
  Stone,
  ProductStone,
  SyncQueue,
  SyncStatus,
  GoldLoan,
  LoanPayment,
  Vendor,
  PurchaseOrder,
  MetalRate,
  SalesReturn,
  Quotation,
  QuotationItem,
  AuditLog,
  Notification,
  License,
  StockTransaction,
  Invoice,
  InvoiceItem,
  Payment,
  OldGoldTransaction,
  Karigar,
  KarigarOrder,
  MetalTransaction,
};

/**
 * Export default object with all models
 */
export default {
  sequelize,
  User,
  Role,
  Company,
  Branch,
  Product,
  Customer,
  Category,
  MetalType,
  Stone,
  ProductStone,
  SyncQueue,
  SyncStatus,
  GoldLoan,
  LoanPayment,
  Vendor,
  PurchaseOrder,
  MetalRate,
  SalesReturn,
  Quotation,
  QuotationItem,
  AuditLog,
  Notification,
  License,
  StockTransaction,
  Invoice,
  InvoiceItem,
  Payment,
  OldGoldTransaction,
  Karigar,
  KarigarOrder,
  MetalTransaction,
  setupAssociations,
  initializeModels,
};
