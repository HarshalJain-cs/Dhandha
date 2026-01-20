import * as nodemailer from 'nodemailer';
import Invoice from '../database/models/Invoice';
import Quotation from '../database/models/Quotation';
import Payment from '../database/models/Payment';
import GoldLoan from '../database/models/GoldLoan';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
      });
    }
    return this.transporter;
  }

  static async sendInvoiceEmail(invoiceId: number, recipientEmail: string): Promise<any> {
    try {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) return { success: false, message: 'Invoice not found' };

      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@dhandha.com',
        to: recipientEmail,
        subject: `Invoice #${(invoice as any).invoice_number}`,
        html: `
          <h2>Invoice #${(invoice as any).invoice_number}</h2>
          <p>Dear Customer,</p>
          <p>Please find attached your invoice.</p>
          <p><strong>Total Amount:</strong> ₹${(invoice as any).grand_total}</p>
          <p>Thank you for your business!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Invoice email sent successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async sendQuotationEmail(quotationId: number, recipientEmail: string): Promise<any> {
    try {
      const quotation = await Quotation.findByPk(quotationId);
      if (!quotation) return { success: false, message: 'Quotation not found' };

      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@dhandha.com',
        to: recipientEmail,
        subject: `Quotation #${quotation.quotation_number}`,
        html: `
          <h2>Quotation #${quotation.quotation_number}</h2>
          <p>Dear Customer,</p>
          <p>Please find your quotation details below:</p>
          <p><strong>Total Amount:</strong> ₹${quotation.grand_total}</p>
          <p><strong>Valid Until:</strong> ${quotation.valid_until}</p>
          <p>We look forward to serving you!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Quotation email sent successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async sendPaymentConfirmation(paymentId: number, recipientEmail: string): Promise<any> {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) return { success: false, message: 'Payment not found' };

      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@dhandha.com',
        to: recipientEmail,
        subject: 'Payment Confirmation',
        html: `
          <h2>Payment Confirmation</h2>
          <p>Dear Customer,</p>
          <p>We have received your payment.</p>
          <p><strong>Amount:</strong> ₹${payment.amount}</p>
          <p><strong>Payment Mode:</strong> ${payment.payment_mode}</p>
          <p><strong>Date:</strong> ${payment.payment_date}</p>
          <p>Thank you!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Payment confirmation sent successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async sendLoanReminder(loanId: number, recipientEmail: string): Promise<any> {
    try {
      const loan = await GoldLoan.findByPk(loanId);
      if (!loan) return { success: false, message: 'Loan not found' };

      const transporter = this.getTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@dhandha.com',
        to: recipientEmail,
        subject: 'Gold Loan Maturity Reminder',
        html: `
          <h2>Gold Loan Maturity Reminder</h2>
          <p>Dear Customer,</p>
          <p>This is a reminder that your gold loan is approaching maturity.</p>
          <p><strong>Loan Number:</strong> ${loan.loan_number}</p>
          <p><strong>Maturity Date:</strong> ${loan.maturity_date}</p>
          <p><strong>Outstanding Amount:</strong> ₹${(loan as any).outstanding_amount}</p>
          <p>Please contact us to settle your loan.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Loan reminder sent successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  static async testEmailConnection(): Promise<any> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return { success: true, message: 'Email connection successful' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
