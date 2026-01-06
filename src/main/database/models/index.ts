import { sequelize } from '../connection';
import User from './User';
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

  // Product associations
  Product.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
  Product.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Product.belongsTo(MetalType, { foreignKey: 'metal_type_id', as: 'metalType' });
  Product.hasMany(ProductStone, { foreignKey: 'product_id', as: 'stones' });

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
};

/**
 * Initialize all models and associations
 */
export const initializeModels = async (): Promise<void> => {
  try {
    // Setup associations
    setupAssociations();

    // Sync models in development only (use migrations in production)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('✓ Models initialized and synced');
    } else {
      console.log('✓ Models initialized (production mode - migrations only)');
    }
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
};

/**
 * Export default object with all models
 */
export default {
  sequelize,
  User,
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
  setupAssociations,
  initializeModels,
};
