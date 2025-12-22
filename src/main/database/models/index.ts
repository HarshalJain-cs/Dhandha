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
  setupAssociations,
  initializeModels,
};
