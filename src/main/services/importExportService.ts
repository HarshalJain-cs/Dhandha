// @ts-nocheck
import * as XLSX from 'xlsx';
import Product from '../database/models/Product';
import Customer from '../database/models/Customer';
import Invoice from '../database/models/Invoice';
import GoldLoan from '../database/models/GoldLoan';
import { sequelize } from '../database/connection';
import { Op } from 'sequelize';

export class ImportExportService {
  static async importProducts(filePath: string, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const validation = this.validateProductData(row);
          if (!validation.valid) {
            results.failed++;
            results.errors.push({ row: i + 2, errors: validation.errors });
            continue;
          }

          await Product.create(
            {
              ...row,
              created_by: userId,
            },
            { transaction }
          );
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({ row: i + 2, error: error.message });
        }
      }

      await transaction.commit();
      return { success: true, data: results };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async exportProducts(filters: any = {}, format: 'xlsx' | 'csv' = 'xlsx'): Promise<any> {
    try {
      const where: any = {};
      if (filters.category_id) where.category_id = filters.category_id;
      if (filters.status) where.status = filters.status;

      const products = await Product.findAll({ where });

      const data = products.map((product) => ({
        ProductCode: product.product_code,
        ProductName: product.product_name,
        Category: product.category_id,
        MetalType: product.metal_type_id,
        GrossWeight: product.gross_weight,
        NetWeight: product.net_weight,
        Purity: product.purity,
        MakingCharges: product.making_charges,
        Status: product.status,
        CurrentStock: product.current_stock,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });
      return { success: true, data: buffer };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async importCustomers(filePath: string, userId: number): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const validation = this.validateCustomerData(row);
          if (!validation.valid) {
            results.failed++;
            results.errors.push({ row: i + 2, errors: validation.errors });
            continue;
          }

          await Customer.create(
            {
              ...row,
              created_by: userId,
            },
            { transaction }
          );
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({ row: i + 2, error: error.message });
        }
      }

      await transaction.commit();
      return { success: true, data: results };
    } catch (error: any) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  static async exportCustomers(filters: any = {}, format: 'xlsx' | 'csv' = 'xlsx'): Promise<any> {
    try {
      const where: any = {};
      if (filters.customer_type) where.customer_type = filters.customer_type;

      const customers = await Customer.findAll({ where });

      const data = customers.map((customer) => ({
        CustomerCode: customer.customer_code,
        Name: customer.name,
        Phone: customer.phone,
        Email: customer.email,
        GSTIN: customer.gstin,
        Address: customer.address,
        City: customer.city,
        State: customer.state,
        CustomerType: customer.customer_type,
        CurrentBalance: customer.current_balance,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });
      return { success: true, data: buffer };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async exportInvoices(filters: any = {}, format: 'xlsx' | 'csv' = 'xlsx'): Promise<any> {
    try {
      const where: any = {};
      if (filters.start_date && filters.end_date) {
        where.invoice_date = { [Op.between]: [filters.start_date, filters.end_date] };
      }

      const invoices = await Invoice.findAll({ where });

      const data = invoices.map((invoice) => ({
        InvoiceNumber: invoice.invoice_number,
        InvoiceDate: invoice.invoice_date,
        CustomerID: invoice.customer_id,
        Subtotal: invoice.subtotal,
        TotalTax: invoice.total_tax,
        GrandTotal: invoice.grand_total,
        PaymentStatus: invoice.payment_status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });
      return { success: true, data: buffer };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async exportGoldLoans(filters: any = {}, format: 'xlsx' | 'csv' = 'xlsx'): Promise<any> {
    try {
      const where: any = {};
      if (filters.status) where.status = filters.status;

      const loans = await GoldLoan.findAll({ where });

      const data = loans.map((loan) => ({
        LoanNumber: loan.loan_number,
        CustomerID: loan.customer_id,
        LoanDate: loan.loan_date,
        GoldWeight: loan.gold_weight,
        LoanAmount: loan.loan_amount,
        InterestRate: loan.interest_rate,
        MaturityDate: loan.maturity_date,
        Status: loan.status,
        OutstandingAmount: loan.outstanding_amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'GoldLoans');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });
      return { success: true, data: buffer };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static validateProductData(row: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!row.product_name) errors.push('Product name is required');
    if (!row.category_id) errors.push('Category is required');
    if (!row.gross_weight || row.gross_weight <= 0) errors.push('Valid gross weight required');
    return { valid: errors.length === 0, errors };
  }

  static validateCustomerData(row: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!row.name) errors.push('Customer name is required');
    if (!row.phone) errors.push('Phone number is required');
    return { valid: errors.length === 0, errors };
  }

  static generateTemplate(type: 'products' | 'customers'): any {
    const templates: any = {
      products: [
        {
          product_name: 'Sample Ring',
          category_id: 1,
          metal_type_id: 1,
          gross_weight: 10.5,
          net_weight: 9.8,
          purity: 22,
          making_charges: 500,
          current_stock: 1,
          min_stock_level: 1,
        },
      ],
      customers: [
        {
          name: 'Sample Customer',
          phone: '9876543210',
          email: 'customer@example.com',
          address: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          customer_type: 'retail',
        },
      ],
    };

    const data = templates[type];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return { success: true, data: buffer };
  }
}
