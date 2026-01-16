'use strict';
const bcrypt = require('bcryptjs');

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
        permissions: JSON.stringify(['*']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        role_name: 'manager',
        description: 'Branch Manager with most permissions',
        permissions: JSON.stringify(['sales:*', 'inventory:*', 'customers:*', 'reports:*']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        role_name: 'cashier',
        description: 'Cashier with sales and customer access',
        permissions: JSON.stringify(['sales:create', 'sales:read', 'customers:create', 'customers:read']),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // ====================
    // 2. INSERT DEFAULT COMPANY & BRANCH
    // ====================
    await queryInterface.bulkInsert('companies', [{
      id: 1,
      company_name: 'Dhandha Jewellers',
      address: '123 Jewellery Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9876543210',
      email: 'contact@dhandha.com',
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    await queryInterface.bulkInsert('branches', [{
      id: 1,
      company_id: 1,
      branch_name: 'Main Branch',
      branch_code: 'MAIN',
      address: '123 Jewellery Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // ====================
    // 3. INSERT ADMIN USER
    // ====================
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('users', [{
      id: 1,
      username: 'admin',
      password: adminPasswordHash,
      email: 'admin@dhandha.com',
      full_name: 'Admin User',
      role_id: 1,
      branch_id: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // ====================
    // 4. INSERT CATEGORIES
    // ====================
    await queryInterface.bulkInsert('categories', [
      { id: 1, name: 'Gold', code: 'GLD', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Silver', code: 'SLV', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Diamond', code: 'DMD', created_at: new Date(), updated_at: new Date() },
    ], {});

    // ====================
    // 5. INSERT PRODUCTS
    // ====================
    await queryInterface.bulkInsert('products', [
      { id: 1, product_name: 'Gold Ring', product_code: 'GR001', category_id: 1, current_stock: 10, unit_price: 50000, metal_type_id: 1, created_at: new Date(), updated_at: new Date() },
      { id: 2, product_name: 'Silver Chain', product_code: 'SC001', category_id: 2, current_stock: 25, unit_price: 5000, metal_type_id: 2, created_at: new Date(), updated_at: new Date() },
      { id: 3, product_name: 'Diamond Earrings', product_code: 'DE001', category_id: 3, current_stock: 5, unit_price: 150000, metal_type_id: 3, created_at: new Date(), updated_at: new Date() },
    ], {});

    // ====================
    // 6. INSERT CUSTOMERS
    // ====================
    await queryInterface.bulkInsert('customers', [
      { id: 1, full_name: 'John Doe', phone: '1234567890', email: 'john.doe@example.com', created_at: new Date(), updated_at: new Date() },
      { id: 2, full_name: 'Jane Smith', phone: '0987654321', email: 'jane.smith@example.com', created_at: new Date(), updated_at: new Date() },
    ], {});

    // ====================
    // 7. INSERT INVOICES, ITEMS, PAYMENTS
    // ====================
    const invoices = [];
    const invoiceItems = [];
    const payments = [];
    let invoiceIdCounter = 1;

    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 2)); // Invoices every 2 days
      const customerId = (i % 2) + 1;
      const product = (i % 3) + 1;
      const quantity = Math.floor(Math.random() * 2) + 1;
      const unit_price = product === 1 ? 50000 : (product === 2 ? 5000 : 150000);
      const total_amount = quantity * unit_price;

      invoices.push({
        id: invoiceIdCounter,
        invoice_number: `INV-2024-00${invoiceIdCounter}`,
        invoice_date: date,
        customer_id: customerId,
        total_amount: total_amount,
        payment_status: 'paid',
        created_by: 1,
        created_at: date,
        updated_at: date
      });

      invoiceItems.push({
        invoice_id: invoiceIdCounter,
        product_id: product,
        item_name: product === 1 ? 'Gold Ring' : (product === 2 ? 'Silver Chain' : 'Diamond Earrings'),
        quantity: quantity,
        unit_price: unit_price,
        total_amount: total_amount,
        created_at: date,
        updated_at: date
      });

      const paymentModes = ['cash', 'card', 'upi'];
      payments.push({
        invoice_id: invoiceIdCounter,
        payment_date: date,
        payment_mode: paymentModes[i % 3],
        amount: total_amount,
        payment_status: 'completed',
        created_at: date,
        updated_at: date
      });

      invoiceIdCounter++;
    }

    await queryInterface.bulkInsert('invoices', invoices, {});
    await queryInterface.bulkInsert('invoice_items', invoiceItems, {});
    await queryInterface.bulkInsert('payments', payments, {});

    console.log('✓ Seed data inserted successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove in reverse order to avoid foreign key constraint violations
    await queryInterface.bulkDelete('payments', null, {});
    await queryInterface.bulkDelete('invoice_items', null, {});
    await queryInterface.bulkInsert('invoices', null, {});
    await queryInterface.bulkDelete('customers', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('branches', null, {});
    await queryInterface.bulkDelete('companies', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
