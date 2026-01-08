'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    //  ====================
    // 1. INSERT DEFAULT ROLES
    // ====================

    await queryInterface.bulkInsert('roles', [
      {
        id: 1,
        role_name: 'admin',
        description: 'System Administrator with full access',
        permissions: JSON.stringify([
          'users:*', 'roles:*', 'sales:*', 'inventory:*',
          'customers:*', 'vendors:*', 'reports:*', 'settings:*',
          'goldloan:*', 'payments:*', 'companies:*', 'branches:*'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        role_name: 'manager',
        description: 'Branch Manager with most permissions',
        permissions: JSON.stringify([
          'sales:create', 'sales:read', 'sales:update',
          'inventory:*', 'customers:*', 'vendors:read', 'vendors:update',
          'reports:*', 'goldloan:*', 'payments:*'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        role_name: 'cashier',
        description: 'Cashier with sales and customer access',
        permissions: JSON.stringify([
          'sales:create', 'sales:read',
          'customers:create', 'customers:read', 'customers:update',
          'inventory:read', 'payments:create', 'payments:read',
          'reports:view'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        role_name: 'operator',
        description: 'Basic operator with read-only access',
        permissions: JSON.stringify([
          'sales:read', 'customers:read', 'inventory:read', 'reports:view'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // ====================
    // 2. INSERT DEFAULT COMPANY
    // ====================

    await queryInterface.bulkInsert('companies', [
      {
        id: 1,
        company_name: 'Dhandha Jewellers Pvt Ltd',
        gstin: null, // User can update this later
        pan: null,   // User can update this later
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '9876543210',
        email: 'contact@dhandhajewellers.com',
        logo_path: null,
        registration_number: null,
        established_date: new Date('2020-01-01'),
        is_active: true,
        created_by: null, // Will be set after first user is created
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // ====================
    // 3. INSERT DEFAULT BRANCH
    // ====================

    await queryInterface.bulkInsert('branches', [
      {
        id: 1,
        company_id: 1,
        branch_name: 'Main Branch',
        branch_code: 'MAIN-001',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '9876543210',
        email: 'main@dhandhajewellers.com',
        gstin: null, // User can update this later
        manager_id: null, // Will be set to admin user ID later if needed
        is_active: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // ====================
    // 4. INSERT ADMIN USER
    // ====================

    // Password: admin123
    // Hashed using bcryptjs with salt rounds = 10
    const adminPasswordHash = '$2a$10$XniLgtjB/g0JteU6YlJh/uIchhG1Zl8QvU8cY94QZmOaTgi6d6fhO';

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        password: adminPasswordHash,
        email: 'admin@dhandhajewellers.com',
        full_name: 'System Administrator',
        role_id: 1, // Admin role
        branch_id: 1, // Main branch
        is_active: true,
        last_login: null,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    console.log('✓ Seed data inserted successfully');
    console.log('  - 4 roles created (admin, manager, cashier, operator)');
    console.log('  - 1 company created (Dhandha Jewellers Pvt Ltd)');
    console.log('  - 1 branch created (Main Branch)');
    console.log('  - 1 admin user created (username: admin, password: admin123)');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove in reverse order to avoid foreign key constraint violations
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('branches', null, {});
    await queryInterface.bulkDelete('companies', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
