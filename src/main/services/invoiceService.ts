import { Invoice } from '../database/models/Invoice';
import { InvoiceItem } from '../database/models/InvoiceItem';
import { Payment } from '../database/models/Payment';
import { OldGoldTransaction } from '../database/models/OldGoldTransaction';
import { Product } from '../database/models/Product';
import { Customer } from '../database/models/Customer';
import { MetalType } from '../database/models/MetalType';
import { Category } from '../database/models/Category';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * Invoice Service Response Interface
 */
export interface InvoiceServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Invoice Filter Interface
 */
export interface InvoiceFilters {
  is_active?: boolean;
  invoice_type?: 'sale' | 'estimate' | 'return';
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
  customer_id?: number;
  from_date?: Date;
  to_date?: Date;
  min_amount?: number;
  max_amount?: number;
  is_cancelled?: boolean;
}

/**
 * Invoice Item Data Interface
 */
export interface InvoiceItemData {
  product_id: number;
  quantity: number;
  metal_rate: number;
  discount_percentage?: number;
  notes?: string;
}

/**
 * Old Gold Data Interface
 */
export interface OldGoldData {
  metal_type: string;
  gross_weight: number;
  stone_weight?: number;
  purity: number;
  test_method: 'touchstone' | 'acid_test' | 'xrf_machine' | 'fire_assay' | 'hallmark';
  tested_purity: number;
  tested_by?: string;
  current_rate: number;
  melting_loss_percentage?: number;
  item_description?: string;
  item_photos?: string[];
}

/**
 * Payment Data Interface
 */
export interface PaymentData {
  payment_mode: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'metal_account';
  amount: number;
  transaction_ref?: string;
  card_last4?: string;
  card_type?: string;
  upi_id?: string;
  cheque_number?: string;
  cheque_date?: Date;
  bank_name?: string;
  metal_weight?: number;
  metal_rate?: number;
  metal_type?: string;
  notes?: string;
}

/**
 * Invoice Service
 * Handles all invoice-related operations including GST calculations
 */
export class InvoiceService {
  /**
   * Create a new invoice with items, payments, and old gold
   */
  static async create(
    customerId: number,
    items: InvoiceItemData[],
    oldGoldData: OldGoldData | null,
    payments: PaymentData[],
    invoiceData: {
      invoice_type?: 'sale' | 'estimate' | 'return';
      discount_percentage?: number;
      notes?: string;
      terms_conditions?: string;
    },
    createdBy: number
  ): Promise<InvoiceServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Fetch customer details
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      // Determine GST type based on customer state
      const businessState = 'Gujarat'; // Should come from settings
      const gstType: 'intra' | 'inter' = customer.state === businessState ? 'intra' : 'inter';

      // Generate invoice number
      const invoiceNumber = await Invoice.generateInvoiceNumber();

      // Create invoice items and calculate totals
      const invoiceItems: any[] = [];
      let subtotal = 0;
      let totalMetalAmount = 0;
      let totalStoneAmount = 0;
      let totalMakingCharges = 0;
      let totalWastageAmount = 0;
      let totalMetalGST = 0;
      let totalMakingGST = 0;
      let metalCGST = 0;
      let metalSGST = 0;
      let metalIGST = 0;
      let makingCGST = 0;
      let makingSGST = 0;
      let makingIGST = 0;

      for (const itemData of items) {
        // Fetch product details
        const product = await Product.findByPk(itemData.product_id, {
          include: [
            { model: Category, as: 'category' },
            { model: MetalType, as: 'metalType' },
          ],
        });

        if (!product) {
          await transaction.rollback();
          return {
            success: false,
            message: `Product with ID ${itemData.product_id} not found`,
          };
        }

        // Check stock availability
        if (product.current_stock < itemData.quantity) {
          await transaction.rollback();
          return {
            success: false,
            message: `Insufficient stock for product ${product.product_name}. Available: ${product.current_stock}, Required: ${itemData.quantity}`,
          };
        }

        // Create invoice item instance
        const invoiceItem = InvoiceItem.build({
          invoice_id: 0, // Will be set after invoice creation
          product_id: product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          barcode: product.barcode,
          huid: product.huid,
          category_name: (product as any).category?.name || '',
          metal_type_name: (product as any).metalType?.name || '',
          gross_weight: product.gross_weight,
          net_weight: product.net_weight,
          stone_weight: product.stone_weight,
          fine_weight: product.fine_weight,
          purity: product.purity,
          metal_rate: itemData.metal_rate,
          quantity: itemData.quantity,
          wastage_percentage: product.wastage_percentage,
          making_charge_type: product.making_charge_type,
          making_charge_rate: product.making_charge,
          making_charge_amount: 0, // Will be calculated
          stone_amount: 0, // TODO: Calculate from stone details
          hsn_code: (product as any).category?.hsn_code || '71131900',
          tax_rate: (product as any).category?.tax_percentage || 3,
          metal_amount: 0,
          subtotal: 0,
          line_total: 0,
          discount_percentage: itemData.discount_percentage || 0,
          discount_amount: 0,
          notes: itemData.notes || null,
        } as any);

        // Calculate line total
        invoiceItem.calculateLineTotal(gstType);

        // Accumulate totals
        subtotal += invoiceItem.subtotal;
        totalMetalAmount += invoiceItem.metal_amount;
        totalStoneAmount += invoiceItem.stone_amount;
        totalMakingCharges += invoiceItem.making_charge_amount;
        totalWastageAmount += invoiceItem.wastage_amount;
        totalMetalGST += invoiceItem.metal_gst_amount;
        totalMakingGST += invoiceItem.making_gst_amount;
        metalCGST += invoiceItem.metal_cgst;
        metalSGST += invoiceItem.metal_sgst;
        metalIGST += invoiceItem.metal_igst;
        makingCGST += invoiceItem.making_cgst;
        makingSGST += invoiceItem.making_sgst;
        makingIGST += invoiceItem.making_igst;

        invoiceItems.push(invoiceItem);
      }

      // Calculate invoice-level discount
      let discountAmount = 0;
      if (invoiceData.discount_percentage && invoiceData.discount_percentage > 0) {
        discountAmount = parseFloat(((subtotal * invoiceData.discount_percentage) / 100).toFixed(2));
      }

      // Calculate old gold value
      let oldGoldAmount = 0;
      let oldGoldWeight = 0;
      if (oldGoldData) {
        const oldGoldTransaction = OldGoldTransaction.build({
          invoice_id: 0, // Will be set after invoice creation
          customer_id: customerId,
          metal_type: oldGoldData.metal_type,
          gross_weight: oldGoldData.gross_weight,
          stone_weight: oldGoldData.stone_weight || 0,
          net_weight: 0,
          purity: oldGoldData.purity,
          fine_weight: 0,
          test_method: oldGoldData.test_method,
          tested_purity: oldGoldData.tested_purity,
          tested_by: oldGoldData.tested_by || null,
          current_rate: oldGoldData.current_rate,
          metal_value: 0,
          melting_loss_percentage: oldGoldData.melting_loss_percentage || 0.5,
          melting_loss_weight: 0,
          melting_loss_amount: 0,
          final_weight: 0,
          final_value: 0,
          item_description: oldGoldData.item_description || null,
          item_photos: oldGoldData.item_photos || null,
        } as any);

        oldGoldTransaction.completeValuation(
          oldGoldData.tested_purity,
          oldGoldData.current_rate,
          oldGoldData.melting_loss_percentage || 0.5
        );

        oldGoldAmount = oldGoldTransaction.final_value;
        oldGoldWeight = oldGoldTransaction.final_weight;
      }

      // Calculate grand total
      const totalGST = totalMetalGST + totalMakingGST;
      const taxableAmount = subtotal;
      let grandTotal = subtotal + totalGST - discountAmount - oldGoldAmount;

      // Apply round off
      const roundOff = parseFloat((Math.round(grandTotal) - grandTotal).toFixed(2));
      grandTotal = Math.round(grandTotal);

      // Calculate total paid amount
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = grandTotal - totalPaid;

      // Determine payment status
      let paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' = 'pending';
      if (balanceDue <= 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      // Create invoice
      const invoice = await Invoice.create(
        {
          invoice_number: invoiceNumber,
          customer_id: customerId,
          invoice_type: invoiceData.invoice_type || 'sale',
          payment_status: paymentStatus,
          customer_name: customer.getFullName(),
          customer_mobile: customer.mobile,
          customer_email: customer.email,
          customer_address: customer.address_line1
            ? `${customer.address_line1}${customer.address_line2 ? ', ' + customer.address_line2 : ''}`
            : null,
          customer_gstin: customer.gstin,
          customer_pan: customer.pan_number,
          customer_state: customer.state || '',
          subtotal,
          metal_amount: totalMetalAmount,
          stone_amount: totalStoneAmount,
          making_charges: totalMakingCharges,
          wastage_amount: totalWastageAmount,
          gst_type: gstType,
          cgst_amount: metalCGST + makingCGST,
          sgst_amount: metalSGST + makingSGST,
          igst_amount: metalIGST + makingIGST,
          total_gst: totalGST,
          making_cgst: makingCGST,
          making_sgst: makingSGST,
          making_igst: makingIGST,
          total_making_gst: totalMakingGST,
          metal_cgst: metalCGST,
          metal_sgst: metalSGST,
          metal_igst: metalIGST,
          total_metal_gst: totalMetalGST,
          discount_percentage: invoiceData.discount_percentage || 0,
          discount_amount: discountAmount,
          round_off: roundOff,
          old_gold_amount: oldGoldAmount,
          old_gold_weight: oldGoldWeight,
          taxable_amount: taxableAmount,
          grand_total: grandTotal,
          balance_due: balanceDue,
          amount_paid: totalPaid,
          notes: invoiceData.notes || null,
          terms_conditions: invoiceData.terms_conditions || null,
          created_by: createdBy,
        } as any,
        { transaction }
      );

      // Create invoice items
      for (const itemData of invoiceItems) {
        itemData.invoice_id = invoice.id;
        await InvoiceItem.create(itemData.toJSON(), { transaction });

        // Update product stock
        const product = await Product.findByPk(itemData.product_id);
        if (product) {
          product.current_stock -= itemData.quantity;
          if (product.current_stock === 0) {
            product.status = 'sold';
          }
          await product.save({ transaction });
        }
      }

      // Create old gold transaction if exists
      if (oldGoldData && oldGoldAmount > 0) {
        const oldGoldTransaction = await OldGoldTransaction.create(
          {
            invoice_id: invoice.id,
            customer_id: customerId,
            metal_type: oldGoldData.metal_type,
            gross_weight: oldGoldData.gross_weight,
            stone_weight: oldGoldData.stone_weight || 0,
            net_weight: oldGoldData.gross_weight - (oldGoldData.stone_weight || 0),
            purity: oldGoldData.tested_purity,
            fine_weight: 0,
            test_method: oldGoldData.test_method,
            tested_purity: oldGoldData.tested_purity,
            tested_by: oldGoldData.tested_by || null,
            current_rate: oldGoldData.current_rate,
            metal_value: 0,
            melting_loss_percentage: oldGoldData.melting_loss_percentage || 0.5,
            melting_loss_weight: 0,
            melting_loss_amount: 0,
            final_weight: oldGoldWeight,
            final_value: oldGoldAmount,
            item_description: oldGoldData.item_description || null,
            item_photos: oldGoldData.item_photos || null,
            status: 'settled',
            created_by: createdBy,
          } as any,
          { transaction }
        );

        // Complete the valuation
        oldGoldTransaction.completeValuation(
          oldGoldData.tested_purity,
          oldGoldData.current_rate,
          oldGoldData.melting_loss_percentage || 0.5
        );
        await oldGoldTransaction.save({ transaction });
      }

      // Create payments
      for (const paymentData of payments) {
        const receiptNumber = await Payment.generateReceiptNumber();
        await Payment.create(
          {
            invoice_id: invoice.id,
            payment_mode: paymentData.payment_mode,
            amount: paymentData.amount,
            transaction_ref: paymentData.transaction_ref || null,
            card_last4: paymentData.card_last4 || null,
            card_type: paymentData.card_type || null,
            upi_id: paymentData.upi_id || null,
            cheque_number: paymentData.cheque_number || null,
            cheque_date: paymentData.cheque_date || null,
            bank_name: paymentData.bank_name || null,
            metal_weight: paymentData.metal_weight || 0,
            metal_rate: paymentData.metal_rate || 0,
            metal_type: paymentData.metal_type || null,
            notes: paymentData.notes || null,
            receipt_number: receiptNumber,
            payment_status: 'cleared',
            created_by: createdBy,
          } as any,
          { transaction }
        );
      }

      // Update customer outstanding balance
      if (balanceDue > 0) {
        customer.outstanding_balance += balanceDue;
        await customer.save({ transaction });
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Invoice created successfully',
        data: { invoice_id: invoice.id, invoice_number: invoiceNumber },
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error creating invoice:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while creating invoice',
      };
    }
  }

  /**
   * Get all invoices with filters and pagination
   */
  static async getAll(
    filters?: InvoiceFilters,
    pagination?: { page: number; limit: number }
  ): Promise<InvoiceServiceResponse> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.is_active !== undefined) {
          where.is_active = filters.is_active;
        }
        if (filters.invoice_type) {
          where.invoice_type = filters.invoice_type;
        }
        if (filters.payment_status) {
          where.payment_status = filters.payment_status;
        }
        if (filters.customer_id) {
          where.customer_id = filters.customer_id;
        }
        if (filters.from_date || filters.to_date) {
          where.invoice_date = {};
          if (filters.from_date) {
            where.invoice_date[Op.gte] = filters.from_date;
          }
          if (filters.to_date) {
            where.invoice_date[Op.lte] = filters.to_date;
          }
        }
        if (filters.min_amount || filters.max_amount) {
          where.grand_total = {};
          if (filters.min_amount) {
            where.grand_total[Op.gte] = filters.min_amount;
          }
          if (filters.max_amount) {
            where.grand_total[Op.lte] = filters.max_amount;
          }
        }
        if (filters.is_cancelled !== undefined) {
          where.is_cancelled = filters.is_cancelled;
        }
      }

      const query: any = {
        where,
        order: [['invoice_date', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'customer_code', 'first_name', 'last_name', 'mobile'],
          },
        ],
      };

      if (pagination) {
        const { page, limit } = pagination;
        query.offset = (page - 1) * limit;
        query.limit = limit;
      }

      const { count, rows: invoices } = await Invoice.findAndCountAll(query);

      return {
        success: true,
        message: 'Invoices retrieved successfully',
        data: {
          invoices,
          total: count,
          page: pagination?.page || 1,
          limit: pagination?.limit || count,
          totalPages: pagination ? Math.ceil(count / pagination.limit) : 1,
        },
      };
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      return {
        success: false,
        message: 'An error occurred while fetching invoices',
      };
    }
  }

  /**
   * Get invoice by ID with all related data
   */
  static async getById(id: number): Promise<InvoiceServiceResponse> {
    try {
      const invoice = await Invoice.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
          },
          {
            model: InvoiceItem,
            as: 'items',
          },
          {
            model: Payment,
            as: 'payments',
          },
          {
            model: OldGoldTransaction,
            as: 'oldGoldTransaction',
          },
        ],
      });

      if (!invoice) {
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      return {
        success: true,
        message: 'Invoice retrieved successfully',
        data: invoice,
      };
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      return {
        success: false,
        message: 'An error occurred while fetching invoice',
      };
    }
  }

  /**
   * Add payment to invoice
   */
  static async addPayment(
    invoiceId: number,
    paymentData: PaymentData,
    createdBy: number
  ): Promise<InvoiceServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      // Generate receipt number
      const receiptNumber = await Payment.generateReceiptNumber();

      // Create payment
      const payment = await Payment.create(
        {
          invoice_id: invoiceId,
          payment_mode: paymentData.payment_mode,
          amount: paymentData.amount,
          transaction_ref: paymentData.transaction_ref || null,
          card_last4: paymentData.card_last4 || null,
          card_type: paymentData.card_type || null,
          upi_id: paymentData.upi_id || null,
          cheque_number: paymentData.cheque_number || null,
          cheque_date: paymentData.cheque_date || null,
          bank_name: paymentData.bank_name || null,
          metal_weight: paymentData.metal_weight || 0,
          metal_rate: paymentData.metal_rate || 0,
          metal_type: paymentData.metal_type || null,
          notes: paymentData.notes || null,
          receipt_number: receiptNumber,
          payment_status: 'cleared',
          created_by: createdBy,
        } as any,
        { transaction }
      );

      // Update invoice payment status
      invoice.amount_paid += paymentData.amount;
      invoice.updatePaymentStatus();
      await invoice.save({ transaction });

      // Update customer outstanding balance if fully paid
      if (invoice.payment_status === 'paid') {
        const customer = await Customer.findByPk(invoice.customer_id);
        if (customer) {
          customer.outstanding_balance -= invoice.balance_due;
          await customer.save({ transaction });
        }
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Payment added successfully',
        data: payment,
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error adding payment:', error);
      return {
        success: false,
        message: 'An error occurred while adding payment',
      };
    }
  }

  /**
   * Cancel invoice
   */
  static async cancel(
    id: number,
    reason: string,
    cancelledBy: number
  ): Promise<InvoiceServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      const invoice = await Invoice.findByPk(id, {
        include: [{ model: InvoiceItem, as: 'items' }],
      });

      if (!invoice) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      // Check if invoice can be cancelled
      const canCancel = invoice.canBeCancelled();
      if (!canCancel.allowed) {
        await transaction.rollback();
        return {
          success: false,
          message: canCancel.reason || 'Invoice cannot be cancelled',
        };
      }

      // Cancel invoice
      const cancelled = invoice.cancelInvoice(cancelledBy, reason);
      if (!cancelled) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Failed to cancel invoice',
        };
      }

      await invoice.save({ transaction });

      // Restore product stock
      const items = (invoice as any).items || [];
      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        if (product) {
          product.current_stock += item.quantity;
          if (product.status === 'sold' && product.current_stock > 0) {
            product.status = 'in_stock';
          }
          await product.save({ transaction });
        }
      }

      // Update customer outstanding balance
      const customer = await Customer.findByPk(invoice.customer_id);
      if (customer && invoice.balance_due > 0) {
        customer.outstanding_balance -= invoice.balance_due;
        await customer.save({ transaction });
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Invoice cancelled successfully',
        data: invoice,
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error cancelling invoice:', error);
      return {
        success: false,
        message: 'An error occurred while cancelling invoice',
      };
    }
  }

  /**
   * Get invoice summary statistics
   */
  static async getSummary(filters?: {
    from_date?: Date;
    to_date?: Date;
  }): Promise<InvoiceServiceResponse> {
    try {
      const where: any = { is_active: true, is_cancelled: false };

      if (filters) {
        if (filters.from_date || filters.to_date) {
          where.invoice_date = {};
          if (filters.from_date) {
            where.invoice_date[Op.gte] = filters.from_date;
          }
          if (filters.to_date) {
            where.invoice_date[Op.lte] = filters.to_date;
          }
        }
      }

      const invoices = await Invoice.findAll({ where });

      const summary = {
        total_invoices: invoices.length,
        total_sales: invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0),
        total_paid: invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0),
        total_outstanding: invoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0),
        paid_count: invoices.filter((inv) => inv.payment_status === 'paid').length,
        pending_count: invoices.filter((inv) => inv.payment_status === 'pending').length,
        partial_count: invoices.filter((inv) => inv.payment_status === 'partial').length,
        overdue_count: invoices.filter((inv) => inv.payment_status === 'overdue').length,
      };

      return {
        success: true,
        message: 'Invoice summary retrieved successfully',
        data: summary,
      };
    } catch (error: any) {
      console.error('Error getting invoice summary:', error);
      return {
        success: false,
        message: 'An error occurred while getting invoice summary',
      };
    }
  }
}

export default InvoiceService;
