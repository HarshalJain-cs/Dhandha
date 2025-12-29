import escpos from 'escpos';
import USB from 'escpos-usb';
import Store from 'electron-store';
import { InvoiceService } from './invoiceService';
import Product from '../database/models/Product';

/**
 * Printer Service
 * Handles thermal printer operations for ESC/POS printers
 * Static methods following the existing service pattern
 */

// Company Information (Hardcoded as per requirements)
const COMPANY_INFO = {
  name: 'Your Jewelry Store Name',
  address_line1: '123 Main Street',
  address_line2: 'City, State - 400001',
  gstin: '22AAAAA0000A1Z5',
  phone: '+91 1234567890',
  email: 'info@jewelrystore.com',
  state: 'Gujarat',
};

// Response Interface
export interface PrinterServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Printer Info Interface
export interface PrinterInfo {
  id: string;
  name: string;
  manufacturer?: string;
  serialNumber?: string;
  type: 'usb';
}

// Settings Interface
interface PrinterSettings {
  printer_id: string | null;
  printer_name: string | null;
  paper_width: 58 | 80;
  auto_cut: boolean;
  beep_on_print: boolean;
  last_connected_at: string | null;
}

/**
 * Printer Service Class
 * Static methods for printer operations
 */
export class PrinterService {
  // Electron store for settings persistence
  private static store = new Store<{ printerSettings: PrinterSettings }>({
    defaults: {
      printerSettings: {
        printer_id: null,
        printer_name: null,
        paper_width: 80,
        auto_cut: true,
        beep_on_print: false,
        last_connected_at: null,
      },
    },
  });

  // Current printer and device instances
  private static currentPrinter: any = null;
  private static currentDevice: any = null;

  /**
   * Find all available USB printers
   */
  static async findPrinters(): Promise<PrinterServiceResponse> {
    try {
      // Find USB devices
      const devices = USB.findPrinter();

      if (!devices || devices.length === 0) {
        return {
          success: false,
          message: 'No USB printers found',
        };
      }

      // Map device info
      const printers: PrinterInfo[] = devices.map((device: any, index: number) => {
        const descriptor = device.deviceDescriptor;
        return {
          id: `${descriptor.idVendor}:${descriptor.idProduct}`,
          name: this.getPrinterName(descriptor.idVendor, descriptor.idProduct),
          manufacturer: device.manufacturer || 'Unknown',
          serialNumber: device.serialNumber || undefined,
          type: 'usb' as const,
        };
      });

      return {
        success: true,
        message: `Found ${printers.length} printer(s)`,
        data: printers,
      };
    } catch (error: any) {
      console.error('PrinterService: Error finding printers:', error);
      return {
        success: false,
        message: error.message || 'Failed to find printers',
      };
    }
  }

  /**
   * Get printer name from vendor/product ID
   */
  private static getPrinterName(vendorId: number, productId: number): string {
    // Common thermal printer vendors
    const vendors: Record<number, string> = {
      2655: 'Zebra', // 0x0A5F
      1305: 'Epson', // 0x0519
      1208: 'Star', // 0x04B8
      1046: 'Citizen', // 0x0416
    };

    const vendorName = vendors[vendorId] || 'Unknown';
    return `${vendorName} Thermal Printer`;
  }

  /**
   * Connect to a printer
   */
  static async connect(printerId: string): Promise<PrinterServiceResponse> {
    try {
      // Find the printer device
      const devices = USB.findPrinter();

      if (!devices || devices.length === 0) {
        return {
          success: false,
          message: 'No printers found',
        };
      }

      // Find device matching the printer ID
      const device = devices.find((d: any) => {
        const descriptor = d.deviceDescriptor;
        return `${descriptor.idVendor}:${descriptor.idProduct}` === printerId;
      });

      if (!device) {
        return {
          success: false,
          message: 'Printer not found',
        };
      }

      // Create USB device instance
      this.currentDevice = new USB(device);

      // Get current settings
      const settings = this.store.get('printerSettings');

      // Create printer instance
      this.currentPrinter = new escpos.Printer(this.currentDevice, {
        encoding: 'GB18030',
        width: settings.paper_width === 80 ? 48 : 32,
      });

      // Open device
      await new Promise((resolve, reject) => {
        this.currentDevice.open((error: any) => {
          if (error) reject(error);
          else resolve(true);
        });
      });

      // Update settings with connected printer info
      const printerName = this.getPrinterName(
        device.deviceDescriptor.idVendor,
        device.deviceDescriptor.idProduct
      );

      this.store.set('printerSettings', {
        ...settings,
        printer_id: printerId,
        printer_name: printerName,
        last_connected_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Printer connected successfully',
        data: {
          printer_id: printerId,
          printer_name: printerName,
        },
      };
    } catch (error: any) {
      console.error('PrinterService: Connect error:', error);
      this.currentPrinter = null;
      this.currentDevice = null;

      return {
        success: false,
        message: error.message || 'Failed to connect to printer',
      };
    }
  }

  /**
   * Disconnect from printer
   */
  static async disconnect(): Promise<PrinterServiceResponse> {
    try {
      if (this.currentDevice) {
        await new Promise((resolve) => {
          this.currentDevice.close(() => resolve(true));
        });
      }

      this.currentPrinter = null;
      this.currentDevice = null;

      return {
        success: true,
        message: 'Printer disconnected',
      };
    } catch (error: any) {
      console.error('PrinterService: Disconnect error:', error);
      return {
        success: false,
        message: error.message || 'Failed to disconnect',
      };
    }
  }

  /**
   * Get printer settings
   */
  static async getSettings(): Promise<PrinterServiceResponse> {
    try {
      const settings = this.store.get('printerSettings');

      return {
        success: true,
        message: 'Settings retrieved',
        data: settings,
      };
    } catch (error: any) {
      console.error('PrinterService: Get settings error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get settings',
      };
    }
  }

  /**
   * Save printer settings
   */
  static async saveSettings(settings: Partial<PrinterSettings>): Promise<PrinterServiceResponse> {
    try {
      const currentSettings = this.store.get('printerSettings');
      const newSettings = {
        ...currentSettings,
        ...settings,
      };

      this.store.set('printerSettings', newSettings);

      // Update printer instance if paper width changed
      if (settings.paper_width && this.currentPrinter) {
        this.currentPrinter.options.width = settings.paper_width === 80 ? 48 : 32;
      }

      return {
        success: true,
        message: 'Settings saved successfully',
        data: newSettings,
      };
    } catch (error: any) {
      console.error('PrinterService: Save settings error:', error);
      return {
        success: false,
        message: error.message || 'Failed to save settings',
      };
    }
  }

  /**
   * Set paper width
   */
  static async setPaperWidth(width: 58 | 80): Promise<PrinterServiceResponse> {
    return this.saveSettings({ paper_width: width });
  }

  /**
   * Get printer status
   */
  static async getStatus(): Promise<PrinterServiceResponse> {
    try {
      const settings = this.store.get('printerSettings');
      const isConnected = this.currentDevice !== null && this.currentPrinter !== null;

      return {
        success: true,
        message: 'Status retrieved',
        data: {
          connected: isConnected,
          printer_name: settings.printer_name,
          paper_width: settings.paper_width,
          auto_cut: settings.auto_cut,
        },
      };
    } catch (error: any) {
      console.error('PrinterService: Get status error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get status',
      };
    }
  }

  /**
   * Ensure printer is connected
   */
  private static async ensureConnected(): Promise<void> {
    if (!this.currentPrinter || !this.currentDevice) {
      const settings = this.store.get('printerSettings');
      if (settings.printer_id) {
        const result = await this.connect(settings.printer_id);
        if (!result.success) {
          throw new Error('Printer not connected. Please connect a printer.');
        }
      } else {
        throw new Error('No printer configured. Please connect a printer.');
      }
    }
  }

  /**
   * Test print
   */
  static async testPrint(): Promise<PrinterServiceResponse> {
    try {
      await this.ensureConnected();

      await new Promise((resolve, reject) => {
        this.currentPrinter
          .font('a')
          .align('ct')
          .size(1, 1)
          .style('bu')
          .text('TEST PRINT')
          .style('normal')
          .size(0, 0)
          .text('')
          .text(COMPANY_INFO.name)
          .text(new Date().toLocaleString())
          .text('')
          .text('✓ Printer is working correctly')
          .text('')
          .drawLine()
          .text('')
          .cut()
          .close((error: any) => {
            if (error) reject(error);
            else resolve(true);
          });
      });

      return {
        success: true,
        message: 'Test print completed',
      };
    } catch (error: any) {
      console.error('PrinterService: Test print error:', error);
      return {
        success: false,
        message: error.message || 'Test print failed',
      };
    }
  }

  /**
   * Print invoice
   */
  static async printInvoice(invoiceId: number): Promise<PrinterServiceResponse> {
    try {
      await this.ensureConnected();

      // Load invoice data
      const invoiceResponse = await InvoiceService.getById(invoiceId);
      if (!invoiceResponse.success || !invoiceResponse.data) {
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      const invoice = invoiceResponse.data;
      const items = invoice.items || [];
      const payments = invoice.payments || [];
      const oldGold = invoice.oldGoldTransaction;

      // Get settings for paper width
      const settings = this.store.get('printerSettings');
      const paperWidth = settings.paper_width === 80 ? 48 : 32;

      // Helper function to right align text
      const rightAlign = (text: string, width: number = paperWidth): string => {
        const padding = width - text.length;
        return ' '.repeat(Math.max(0, padding)) + text;
      };

      // Helper function to create separator line
      const separator = '='.repeat(paperWidth);
      const dashedLine = '-'.repeat(paperWidth);

      // Start building the print job
      await new Promise((resolve, reject) => {
        let p = this.currentPrinter
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text(COMPANY_INFO.name)
          .style('normal')
          .size(0, 0)
          .text(COMPANY_INFO.address_line1)
          .text(COMPANY_INFO.address_line2)
          .text(`GSTIN: ${COMPANY_INFO.gstin}`)
          .text(`Ph: ${COMPANY_INFO.phone}`)
          .text(separator)
          .text('')
          .style('b')
          .text('Tax Invoice')
          .style('normal')
          .text('')
          .align('lt');

        // Invoice details
        p = p
          .text(`Invoice No: ${invoice.invoice_number}`)
          .text(`Date: ${new Date(invoice.invoice_date).toLocaleString()}`)
          .text(`Type: ${invoice.invoice_type.toUpperCase()}`)
          .text('');

        // Customer details
        p = p
          .text('Customer Details:')
          .text(`Name: ${invoice.customer_name}`)
          .text(`Mobile: ${invoice.customer_mobile || 'N/A'}`);

        if (invoice.customer_gstin) {
          p = p.text(`GSTIN: ${invoice.customer_gstin}`);
        }

        if (invoice.customer_address) {
          const addressLines = invoice.customer_address.split('\n');
          p = p.text(`Address: ${addressLines[0]}`);
          for (let i = 1; i < addressLines.length; i++) {
            p = p.text(`         ${addressLines[i]}`);
          }
        }

        p = p.text('').text(separator).text('ITEMS').text(separator).text('');

        // Print each item
        items.forEach((item: any, index: number) => {
          p = p
            .text(`${index + 1}. ${item.product_name}`)
            .text(`   Code: ${item.product_code}${item.huid ? ` | HUID: ${item.huid}` : ''}`)
            .text(`   Net Wt: ${item.net_weight.toFixed(3)}g | Rate: ₹${item.metal_rate.toFixed(2)}/g`)
            .text('');

          p = p.text(rightAlign(`Metal Amount: ₹${item.metal_amount.toFixed(2)}`));

          if (item.making_charge_amount > 0) {
            p = p.text(rightAlign(`Making Charges: ₹${item.making_charge_amount.toFixed(2)}`));
          }

          if (item.stone_amount > 0) {
            p = p.text(rightAlign(`Stone Amount: ₹${item.stone_amount.toFixed(2)}`));
          }

          if (item.wastage_amount > 0) {
            p = p.text(rightAlign(`Wastage: ₹${item.wastage_amount.toFixed(2)}`));
          }

          p = p
            .text(rightAlign(dashedLine.substring(0, 30)))
            .text(rightAlign(`Subtotal: ₹${item.line_total.toFixed(2)}`))
            .text('');
        });

        // Summary
        p = p.text(separator).text('SUMMARY').text(separator).text('');

        p = p.text(rightAlign(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`));

        if (invoice.discount_amount && invoice.discount_amount > 0) {
          p = p.text(rightAlign(`Discount: -₹${invoice.discount_amount.toFixed(2)}`));
        }

        // GST Breakdown
        p = p.text('').text('GST Breakdown:');

        const totalMetalGst = invoice.total_metal_gst || 0;
        const totalMakingGst = invoice.total_making_gst || 0;

        if (totalMetalGst > 0) {
          p = p.text('Metal GST @ 3%:');
          if (invoice.gst_type === 'intra') {
            p = p
              .text(`  CGST (1.5%): ${rightAlign(`₹${invoice.metal_cgst.toFixed(2)}`)}`)
              .text(`  SGST (1.5%): ${rightAlign(`₹${invoice.metal_sgst.toFixed(2)}`)}`);
          } else {
            p = p.text(`  IGST (3%): ${rightAlign(`₹${invoice.metal_igst.toFixed(2)}`)}`);
          }
        }

        if (totalMakingGst > 0) {
          p = p.text('Making GST @ 5%:');
          if (invoice.gst_type === 'intra') {
            p = p
              .text(`  CGST (2.5%): ${rightAlign(`₹${invoice.making_cgst.toFixed(2)}`)}`)
              .text(`  SGST (2.5%): ${rightAlign(`₹${invoice.making_sgst.toFixed(2)}`)}`);
          } else {
            p = p.text(`  IGST (5%): ${rightAlign(`₹${invoice.making_igst.toFixed(2)}`)}`);
          }
        }

        const totalGst = totalMetalGst + totalMakingGst;
        p = p.text('').text(rightAlign(`Total GST: ₹${totalGst.toFixed(2)}`));

        // Old gold
        if (oldGold && oldGold.gold_value > 0) {
          p = p.text('').text(rightAlign(`Old Gold: -₹${oldGold.gold_value.toFixed(2)}`));
        }

        // Round off
        if (invoice.round_off_amount && invoice.round_off_amount !== 0) {
          const sign = invoice.round_off_amount > 0 ? '+' : '';
          p = p.text(rightAlign(`Round Off: ${sign}₹${invoice.round_off_amount.toFixed(2)}`));
        }

        // Grand total
        p = p
          .text(dashedLine)
          .style('bu')
          .size(1, 1)
          .text(rightAlign(`GRAND TOTAL: ₹${invoice.grand_total.toFixed(2)}`))
          .style('normal')
          .size(0, 0)
          .text(separator)
          .text('');

        // Payments
        if (payments.length > 0) {
          p = p.text('PAYMENTS').text(dashedLine);

          payments.forEach((payment: any) => {
            const mode = payment.payment_mode.toUpperCase();
            const amount = payment.amount.toFixed(2);
            p = p.text(`${mode}${rightAlign(`₹${amount}`, paperWidth - mode.length)}`);
          });

          p = p
            .text(dashedLine)
            .text(rightAlign(`Total Paid: ₹${invoice.amount_paid.toFixed(2)}`))
            .text(rightAlign(`Balance Due: ₹${invoice.balance_due.toFixed(2)}`))
            .text('');
        }

        // Footer
        p = p
          .text(separator)
          .align('ct')
          .text('Thank you for your business!')
          .text('Visit us again!')
          .text(separator)
          .text('')
          .text('');

        // Cut and close
        if (settings.auto_cut) {
          p = p.cut();
        }

        p.close((error: any) => {
          if (error) reject(error);
          else resolve(true);
        });
      });

      return {
        success: true,
        message: 'Invoice printed successfully',
      };
    } catch (error: any) {
      console.error('PrinterService: Print invoice error:', error);
      return {
        success: false,
        message: error.message || 'Failed to print invoice',
      };
    }
  }

  /**
   * Print barcode label for product
   */
  static async printBarcodeLabel(productId: number): Promise<PrinterServiceResponse> {
    try {
      await this.ensureConnected();

      // Load product data
      const product = await Product.findByPk(productId);
      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      if (!product.barcode) {
        return {
          success: false,
          message: 'Product does not have a barcode',
        };
      }

      const settings = this.store.get('printerSettings');

      await new Promise((resolve, reject) => {
        let p = this.currentPrinter
          .font('a')
          .align('ct')
          .size(0, 0)
          .text('='.repeat(settings.paper_width === 80 ? 48 : 32))
          .text(COMPANY_INFO.name)
          .text('='.repeat(settings.paper_width === 80 ? 48 : 32))
          .text('')
          .text(product.product_name.substring(0, settings.paper_width === 80 ? 48 : 32))
          .text(`Code: ${product.product_code}`)
          .text('');

        // Product details
        if (product.gross_weight) {
          p = p.text(`Gross Wt: ${product.gross_weight.toFixed(3)} g`);
        }
        if (product.net_weight) {
          p = p.text(`Net Wt: ${product.net_weight.toFixed(3)} g`);
        }
        if (product.stone_weight) {
          p = p.text(`Stone Wt: ${product.stone_weight.toFixed(3)} g`);
        }
        if (product.purity) {
          p = p.text(`Purity: ${product.purity}`);
        }

        if (product.huid) {
          p = p.text('').text(`HUID: ${product.huid}`).text('');
        }

        // Barcode
        p = p
          .barcode(product.barcode, 'CODE128', {
            width: 2,
            height: 50,
            includetext: true,
          })
          .text('')
          .text('='.repeat(settings.paper_width === 80 ? 48 : 32))
          .text('');

        if (settings.auto_cut) {
          p = p.cut();
        }

        p.close((error: any) => {
          if (error) reject(error);
          else resolve(true);
        });
      });

      return {
        success: true,
        message: 'Barcode label printed successfully',
      };
    } catch (error: any) {
      console.error('PrinterService: Print barcode label error:', error);
      return {
        success: false,
        message: error.message || 'Failed to print barcode label',
      };
    }
  }

  /**
   * Print RFID label for product
   */
  static async printRFIDLabel(productId: number): Promise<PrinterServiceResponse> {
    try {
      await this.ensureConnected();

      // Load product data
      const product = await Product.findByPk(productId);
      if (!product) {
        return {
          success: false,
          message: 'Product not found',
        };
      }

      if (!product.rfid_tag) {
        return {
          success: false,
          message: 'Product does not have an RFID tag',
        };
      }

      const settings = this.store.get('printerSettings');

      await new Promise((resolve, reject) => {
        let p = this.currentPrinter
          .font('a')
          .align('ct')
          .size(0, 0)
          .text('='.repeat(settings.paper_width === 80 ? 48 : 32))
          .text(COMPANY_INFO.name)
          .text('='.repeat(settings.paper_width === 80 ? 48 : 32))
          .text('')
          .text(product.product_name.substring(0, settings.paper_width === 80 ? 48 : 32))
          .text(`Code: ${product.product_code}`)
          .text('')
          .text(`RFID Tag: ${product.rfid_tag}`)
          .text('');

        // QR Code with RFID tag
        p = p
          .qrcode(product.rfid_tag, {
            size: 6,
            errorlevel: 'M',
          })
          .text('');

        // Product details
        if (product.gross_weight) {
          p = p.text(`Gross Wt: ${product.gross_weight.toFixed(3)} g`);
        }
        if (product.purity) {
          p = p.text(`Purity: ${product.purity}`);
        }

        p = p.text('').text('='.repeat(settings.paper_width === 80 ? 48 : 32)).text('');

        if (settings.auto_cut) {
          p = p.cut();
        }

        p.close((error: any) => {
          if (error) reject(error);
          else resolve(true);
        });
      });

      return {
        success: true,
        message: 'RFID label printed successfully',
      };
    } catch (error: any) {
      console.error('PrinterService: Print RFID label error:', error);
      return {
        success: false,
        message: error.message || 'Failed to print RFID label',
      };
    }
  }
}
