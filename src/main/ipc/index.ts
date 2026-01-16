import { setupAuthHandlers } from './authHandlers';
import { setupLicenseHandlers } from './licenseHandlers';
import { setupSyncHandlers } from './syncHandlers';
import { setupProductHandlers } from './productHandlers';
import { setupCategoryHandlers } from './categoryHandlers';
import { setupMetalTypeHandlers } from './metalTypeHandlers';
import { setupStoneHandlers } from './stoneHandlers';
import { setupCustomerHandlers } from './customerHandlers';
import { setupInvoiceHandlers } from './invoiceHandlers';
import { setupDashboardHandlers } from './dashboardHandlers';
import { setupKarigarHandlers } from './karigarHandlers';
import { setupWorkOrderHandlers } from './workOrderHandlers';
import { setupWorkOrderReportHandlers } from './workOrderReportHandlers';
import { setupGoldLoanHandlers } from './goldLoanHandlers';
import { setupVendorHandlers } from './vendorHandlers';
import { setupPurchaseOrderHandlers } from './purchaseOrderHandlers';
import { setupMetalRateHandlers } from './metalRateHandlers';
import { setupSalesReturnHandlers } from './salesReturnHandlers';
import { setupQuotationHandlers } from './quotationHandlers';
import { setupEmailHandlers } from './emailHandlers';
import { setupAuditHandlers } from './auditHandlers';
import { setupNotificationHandlers } from './notificationHandlers';
import { setupImportExportHandlers } from './importExportHandlers';
import { setupInvoiceTemplateHandlers } from './invoiceTemplateHandlers';
import { setupPrinterHandlers } from './printerHandlers';
import { setupHardwareHandlers } from './hardwareHandlers';
import { setupUpdateHandlers } from './updateHandlers';
import { setupReportsHandlers } from './reports-handlers'; // Import new reports handler

/**
 * IPC Handlers Index
 * Registers all IPC handlers for main-renderer communication
 */

/**
 * Setup all IPC handlers
 */
export const setupAllHandlers = (): void => {
  console.log('⚙  Setting up IPC handlers...');

  // Setup authentication handlers
  setupAuthHandlers();

  // Setup license handlers
  setupLicenseHandlers();

  // Setup sync handlers
  setupSyncHandlers();

  // Setup product management handlers
  setupProductHandlers();
  setupCategoryHandlers();
  setupMetalTypeHandlers();
  setupStoneHandlers();

  // Setup customer management handlers
  setupCustomerHandlers();

  // Setup billing/invoice handlers
  setupInvoiceHandlers();

  // Setup dashboard statistics handlers
  setupDashboardHandlers();

  // Setup karigar (craftsman) handlers
  setupKarigarHandlers();
  setupWorkOrderHandlers();
  setupWorkOrderReportHandlers();

  // Setup gold loan handlers
  setupGoldLoanHandlers();

  // Setup vendor and purchase order handlers
  setupVendorHandlers();
  setupPurchaseOrderHandlers();

  // Setup metal rate handlers
  setupMetalRateHandlers();

  // Setup sales return handlers
  setupSalesReturnHandlers();

  // Setup quotation handlers
  setupQuotationHandlers();

  // Setup email handlers
  setupEmailHandlers();

  // Setup audit log handlers
  setupAuditHandlers();

  // Setup notification handlers
  setupNotificationHandlers();

  // Setup import/export handlers
  setupImportExportHandlers();

  // Setup invoice template handlers
  setupInvoiceTemplateHandlers();

  // Setup printer handlers
  setupPrinterHandlers();

  // Setup hardware handlers (barcode, RFID, scale)
  setupHardwareHandlers();

  // Setup update handlers
  setupUpdateHandlers();

  // Setup reports handlers
  setupReportsHandlers();

  console.log('✓ All IPC handlers registered successfully');
};

export default setupAllHandlers;
