export class InvoiceTemplateService {
  static getAvailableTemplates(): any {
    return {
      success: true,
      data: [
        { id: 'classic', name: 'Classic Invoice', description: 'Traditional business format' },
        { id: 'modern', name: 'Modern Invoice', description: 'Clean minimal design' },
        { id: 'detailed', name: 'Detailed Invoice', description: 'Comprehensive breakdown' },
        { id: 'thermal', name: 'Thermal Printer', description: '2"/3" thermal printer optimized' },
      ],
    };
  }

  static generateInvoiceHTML(invoice: any, templateId: string = 'classic'): any {
    try {
      const templates: any = {
        classic: this.getClassicTemplate(invoice),
        modern: this.getModernTemplate(invoice),
        detailed: this.getDetailedTemplate(invoice),
        thermal: this.getThermalTemplate(invoice),
      };

      const html = templates[templateId] || templates.classic;
      return { success: true, data: html };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private static getClassicTemplate(invoice: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .invoice-details { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Your Company Name</div>
          <div>Address, City, State - PIN</div>
          <div>GSTIN: XXXXXXXXXXX</div>
        </div>

        <div class="invoice-details">
          <strong>Invoice #:</strong> ${invoice.invoice_number}<br>
          <strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}<br>
          <strong>Customer:</strong> ${invoice.customer?.name || 'N/A'}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gold Jewellery</td>
              <td>1</td>
              <td>${invoice.subtotal}</td>
              <td>${invoice.subtotal}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Subtotal:</strong> ₹${invoice.subtotal}</div>
          <div><strong>Tax:</strong> ₹${invoice.total_tax}</div>
          <div><strong>Grand Total:</strong> ₹${invoice.grand_total}</div>
        </div>

        <div class="footer">
          Thank you for your business!
        </div>
      </body>
      </html>
    `;
  }

  private static getModernTemplate(invoice: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: 'Helvetica Neue', sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: 300; color: #1890ff; }
          table { width: 100%; margin: 30px 0; }
          th { background: #1890ff; color: white; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { background: #f9f9f9; padding: 20px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">Dhandha Jewellers</div>
            <div style="color: #666;">Invoice ${invoice.invoice_number}</div>
          </div>

          <table>
            <tr><th>Description</th><th>Amount</th></tr>
            <tr><td>Jewellery Purchase</td><td>₹${invoice.subtotal}</td></tr>
          </table>

          <div class="totals">
            <div><strong>Total:</strong> ₹${invoice.grand_total}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getDetailedTemplate(invoice: any): string {
    return this.getClassicTemplate(invoice); // Similar to classic with more details
  }

  private static getThermalTemplate(invoice: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 5px; width: 58mm; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="center"><strong>DHANDHA JEWELLERS</strong></div>
        <div class="center">Invoice: ${invoice.invoice_number}</div>
        <div class="line"></div>
        <div>Date: ${new Date(invoice.invoice_date).toLocaleDateString()}</div>
        <div>Customer: ${invoice.customer?.name || 'N/A'}</div>
        <div class="line"></div>
        <div>Amount: ₹${invoice.grand_total}</div>
        <div class="line"></div>
        <div class="center">Thank You!</div>
      </body>
      </html>
    `;
  }
}
