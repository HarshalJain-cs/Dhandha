import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload Script
 * Exposes safe IPC methods to the renderer process
 * Acts as a bridge between main and renderer processes
 */

const authAPI = {
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
  validateToken: (token: string) => ipcRenderer.invoke('auth:validateToken', token),
  changePassword: (userId: number, currentPassword: string, newPassword: string) => ipcRenderer.invoke('auth:changePassword', userId, currentPassword, newPassword),
  createUser: (userData: any) => ipcRenderer.invoke('auth:createUser', userData),
  getUserById: (userId: number) => ipcRenderer.invoke('auth:getUserById', userId),
  updateUser: (userId: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('auth:updateUser', userId, updateData, updatedBy),
  deactivateUser: (userId: number, updatedBy: number) => ipcRenderer.invoke('auth:deactivateUser', userId, updatedBy),
  getAllUsers: () => ipcRenderer.invoke('auth:getAllUsers'),
};

const syncAPI = {
  getStatus: () => ipcRenderer.invoke('sync:getStatus'),
  triggerSync: () => ipcRenderer.invoke('sync:triggerSync'),
  toggleSync: (enabled: boolean) => ipcRenderer.invoke('sync:toggleSync', enabled),
  updateInterval: (intervalMinutes: number) => ipcRenderer.invoke('sync:updateInterval', intervalMinutes),
  cleanup: (daysToKeep?: number) => ipcRenderer.invoke('sync:cleanup', daysToKeep),
};

const productAPI = {
  create: (productData: any) => ipcRenderer.invoke('product:create', productData),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('product:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('product:getById', id),
  update: (id: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('product:update', id, updateData, updatedBy),
  delete: (id: number, deletedBy: number) => ipcRenderer.invoke('product:delete', id, deletedBy),
  updateStock: (id: number, quantity: number, operation: 'add' | 'subtract' | 'set', updatedBy: number) => ipcRenderer.invoke('product:updateStock', id, quantity, operation, updatedBy),
  getLowStock: () => ipcRenderer.invoke('product:getLowStock'),
  getOutOfStock: () => ipcRenderer.invoke('product:getOutOfStock'),
  searchByBarcode: (barcode: string) => ipcRenderer.invoke('product:searchByBarcode', barcode),
  searchByRFID: (rfidTag: string) => ipcRenderer.invoke('product:searchByRFID', rfidTag),
  getByCategory: (categoryId: number) => ipcRenderer.invoke('product:getByCategory', categoryId),
  getByTags: (tags: string[]) => ipcRenderer.invoke('product:getByTags', tags),
  generateCode: (categoryId: number, metalTypeId: number) => ipcRenderer.invoke('product:generateCode', categoryId, metalTypeId),
  getStockHistory: (productId: number, filters?: any, pagination?: any) => ipcRenderer.invoke('product:getStockHistory', productId, filters, pagination),
  getStockSummary: (productId: number, days?: number) => ipcRenderer.invoke('product:getStockSummary', productId, days),
  getStockActivity: (productId: number, limit?: number) => ipcRenderer.invoke('product:getStockActivity', productId, limit),
};

const categoryAPI = {
  create: (categoryData: any) => ipcRenderer.invoke('category:create', categoryData),
  getAll: (filters?: any) => ipcRenderer.invoke('category:getAll', filters),
  getById: (id: number) => ipcRenderer.invoke('category:getById', id),
  update: (id: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('category:update', id, updateData, updatedBy),
  delete: (id: number, deletedBy: number) => ipcRenderer.invoke('category:delete', id, deletedBy),
  getTree: (parentId?: number | null) => ipcRenderer.invoke('category:getTree', parentId),
  getChildren: (parentId: number) => ipcRenderer.invoke('category:getChildren', parentId),
  getFullPath: (id: number) => ipcRenderer.invoke('category:getFullPath', id),
  getRootCategories: () => ipcRenderer.invoke('category:getRootCategories'),
  getBreadcrumb: (id: number) => ipcRenderer.invoke('category:getBreadcrumb', id),
};

const metalTypeAPI = {
  create: (metalTypeData: any) => ipcRenderer.invoke('metalType:create', metalTypeData),
  getAll: (filters?: any) => ipcRenderer.invoke('metalType:getAll', filters),
  getById: (id: number) => ipcRenderer.invoke('metalType:getById', id),
  update: (id: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('metalType:update', id, updateData, updatedBy),
  delete: (id: number, deletedBy: number) => ipcRenderer.invoke('metalType:delete', id, deletedBy),
  updateRate: (id: number, newRate: number, updatedBy: number) => ipcRenderer.invoke('metalType:updateRate', id, newRate, updatedBy),
  getCurrentRates: () => ipcRenderer.invoke('metalType:getCurrentRates'),
  calculateFineWeight: (metalTypeId: number, grossWeight: number) => ipcRenderer.invoke('metalType:calculateFineWeight', metalTypeId, grossWeight),
  getByMetalName: (metalName: string) => ipcRenderer.invoke('metalType:getByMetalName', metalName),
  calculateMetalValue: (metalTypeId: number, grossWeight: number) => ipcRenderer.invoke('metalType:calculateMetalValue', metalTypeId, grossWeight),
};

const stoneAPI = {
  create: (stoneData: any) => ipcRenderer.invoke('stone:create', stoneData),
  getAll: (filters?: any) => ipcRenderer.invoke('stone:getAll', filters),
  getById: (id: number) => ipcRenderer.invoke('stone:getById', id),
  update: (id: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('stone:update', id, updateData, updatedBy),
  delete: (id: number, deletedBy: number) => ipcRenderer.invoke('stone:delete', id, deletedBy),
  addToProduct: (productStoneData: any) => ipcRenderer.invoke('stone:addToProduct', productStoneData),
  updateProductStone: (id: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('stone:updateProductStone', id, updateData, updatedBy),
  removeFromProduct: (id: number) => ipcRenderer.invoke('stone:removeFromProduct', id),
  getProductStones: (productId: number) => ipcRenderer.invoke('stone:getProductStones', productId),
  calculateValue: (stoneId: number, caratWeight: number, quantity?: number) => ipcRenderer.invoke('stone:calculateValue', stoneId, caratWeight, quantity),
  getByType: (stoneType: string) => ipcRenderer.invoke('stone:getByType', stoneType),
  getStoneTypes: () => ipcRenderer.invoke('stone:getStoneTypes'),
};

const customerAPI = {
  create: (customerData: any) => ipcRenderer.invoke('customer:create', customerData),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('customer:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('customer:getById', id),
  update: (id: number, updateData: any, updatedBy: number) => ipcRenderer.invoke('customer:update', id, updateData, updatedBy),
  delete: (id: number, deletedBy: number) => ipcRenderer.invoke('customer:delete', id, deletedBy),
  searchByMobile: (mobile: string) => ipcRenderer.invoke('customer:searchByMobile', mobile),
  searchByEmail: (email: string) => ipcRenderer.invoke('customer:searchByEmail', email),
  getByType: (customerType: string) => ipcRenderer.invoke('customer:getByType', customerType),
  generateCode: () => ipcRenderer.invoke('customer:generateCode'),
  updateBalance: (id: number, amount: number, operation: 'add' | 'subtract' | 'set') => ipcRenderer.invoke('customer:updateBalance', id, amount, operation),
  addPoints: (id: number, points: number) => ipcRenderer.invoke('customer:addPoints', id, points),
  redeemPoints: (id: number, points: number) => ipcRenderer.invoke('customer:redeemPoints', id, points),
};

const invoiceAPI = {
  create: (customerId: number, items: any[], oldGoldData: any | null, payments: any[], invoiceData: any, createdBy: number) => ipcRenderer.invoke('invoice:create', customerId, items, oldGoldData, payments, invoiceData, createdBy),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('invoice:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('invoice:getById', id),
  addPayment: (invoiceId: number, paymentData: any, createdBy: number) => ipcRenderer.invoke('invoice:addPayment', invoiceId, paymentData, createdBy),
  cancel: (id: number, reason: string, cancelledBy: number) => ipcRenderer.invoke('invoice:cancel', id, reason, cancelledBy),
  getSummary: (filters?: any) => ipcRenderer.invoke('invoice:getSummary', filters),
};

const karigarAPI = {
  create: (data: any, createdBy: number) => ipcRenderer.invoke('karigar:create', data, createdBy),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('karigar:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('karigar:getById', id),
  update: (id: number, data: any, updatedBy: number) => ipcRenderer.invoke('karigar:update', id, data, updatedBy),
  delete: (id: number, deletedBy: number) => ipcRenderer.invoke('karigar:delete', id, deletedBy),
  createOrder: (data: any, createdBy: number) => ipcRenderer.invoke('karigar:createOrder', data, createdBy),
  getAllOrders: (filters?: any, pagination?: any) => ipcRenderer.invoke('karigar:getAllOrders', filters, pagination),
  getOrderById: (id: number) => ipcRenderer.invoke('karigar:getOrderById', id),
  receiveMetal: (orderId: number, data: any, receivedBy: number) => ipcRenderer.invoke('karigar:receiveMetal', orderId, data, receivedBy),
  updateOrderStatus: (id: number, status: string, updatedBy: number, cancellationReason?: string) => ipcRenderer.invoke('karigar:updateOrderStatus', id, status, updatedBy, cancellationReason),
  getStats: (karigarId?: number) => ipcRenderer.invoke('karigar:getStats', karigarId),
};

const goldLoanAPI = {
  create: (loanData: any, createdBy: number) => ipcRenderer.invoke('goldLoan:create', loanData, createdBy),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('goldLoan:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('goldLoan:getById', id),
  getPayments: (loanId: number) => ipcRenderer.invoke('goldLoan:getPayments', loanId),
  approve: (id: number, approvedBy: number) => ipcRenderer.invoke('goldLoan:approve', id, approvedBy),
  disburse: (id: number, data: any, disbursedBy: number) => ipcRenderer.invoke('goldLoan:disburse', id, data, disbursedBy),
  recordPayment: (loanId: number, paymentData: any, createdBy: number) => ipcRenderer.invoke('goldLoan:recordPayment', loanId, paymentData, createdBy),
  close: (id: number, closedBy: number) => ipcRenderer.invoke('goldLoan:close', id, closedBy),
  foreclose: (id: number, data: any, closedBy: number) => ipcRenderer.invoke('goldLoan:foreclose', id, data, closedBy),
  markDefault: (id: number, reason: string, userId: number) => ipcRenderer.invoke('goldLoan:markDefault', id, reason, userId),
  getStats: (filters?: any) => ipcRenderer.invoke('goldLoan:getStats', filters),
  getOverdue: () => ipcRenderer.invoke('goldLoan:getOverdue'),
  getMaturingSoon: (days?: number) => ipcRenderer.invoke('goldLoan:getMaturingSoon', days),
  calculateInterest: (loanId: number) => ipcRenderer.invoke('goldLoan:calculateInterest', loanId),
};

const vendorAPI = {
  create: (data: any, userId: number) => ipcRenderer.invoke('vendor:create', data, userId),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('vendor:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('vendor:getById', id),
  update: (id: number, data: any, userId: number) => ipcRenderer.invoke('vendor:update', id, data, userId),
  getBalance: (id: number) => ipcRenderer.invoke('vendor:getBalance', id),
};

const purchaseOrderAPI = {
  create: (data: any, userId: number) => ipcRenderer.invoke('purchaseOrder:create', data, userId),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('purchaseOrder:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('purchaseOrder:getById', id),
  update: (id: number, data: any, userId: number) => ipcRenderer.invoke('purchaseOrder:update', id, data, userId),
  receive: (id: number, receivedQty: number, userId: number) => ipcRenderer.invoke('purchaseOrder:receive', id, receivedQty, userId),
  cancel: (id: number, reason: string, userId: number) => ipcRenderer.invoke('purchaseOrder:cancel', id, reason, userId),
  getStats: () => ipcRenderer.invoke('purchaseOrder:getStats'),
};

const metalRateAPI = {
  update: (rates: any, source: string, userId: number) => ipcRenderer.invoke('metalRate:update', rates, source, userId),
  getLatest: () => ipcRenderer.invoke('metalRate:getLatest'),
  getHistorical: (startDate: string, endDate: string) => ipcRenderer.invoke('metalRate:getHistorical', startDate, endDate),
  getChart: (metalType: string, days?: number) => ipcRenderer.invoke('metalRate:getChart', metalType, days),
};

const salesReturnAPI = {
  create: (returnData: any, userId: number) => ipcRenderer.invoke('salesReturn:create', returnData, userId),
  approve: (returnId: number, approvedBy: number) => ipcRenderer.invoke('salesReturn:approve', returnId, approvedBy),
  complete: (returnId: number, completedBy: number) => ipcRenderer.invoke('salesReturn:complete', returnId, completedBy),
  reject: (returnId: number, rejectedBy: number, reason: string) => ipcRenderer.invoke('salesReturn:reject', returnId, rejectedBy, reason),
  processExchange: (returnId: number, newInvoiceData: any, userId: number) => ipcRenderer.invoke('salesReturn:processExchange', returnId, newInvoiceData, userId),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('salesReturn:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('salesReturn:getById', id),
  getStats: () => ipcRenderer.invoke('salesReturn:getStats'),
};

const quotationAPI = {
  create: (data: any, userId: number) => ipcRenderer.invoke('quotation:create', data, userId),
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('quotation:getAll', filters, pagination),
  getById: (id: number) => ipcRenderer.invoke('quotation:getById', id),
  update: (id: number, data: any, userId: number) => ipcRenderer.invoke('quotation:update', id, data, userId),
  convertToInvoice: (quotationId: number, userId: number) => ipcRenderer.invoke('quotation:convertToInvoice', quotationId, userId),
  updateStatus: (id: number, status: string, userId: number) => ipcRenderer.invoke('quotation:updateStatus', id, status, userId),
  getStats: () => ipcRenderer.invoke('quotation:getStats'),
};

const emailAPI = {
  sendInvoice: (invoiceId: number, recipientEmail: string) => ipcRenderer.invoke('email:sendInvoice', invoiceId, recipientEmail),
  sendQuotation: (quotationId: number, recipientEmail: string) => ipcRenderer.invoke('email:sendQuotation', quotationId, recipientEmail),
  sendPayment: (paymentId: number, recipientEmail: string) => ipcRenderer.invoke('email:sendPayment', paymentId, recipientEmail),
  sendLoanReminder: (loanId: number, recipientEmail: string) => ipcRenderer.invoke('email:sendLoanReminder', loanId, recipientEmail),
  testConnection: () => ipcRenderer.invoke('email:testConnection'),
};

const auditAPI = {
  getAll: (filters?: any, pagination?: any) => ipcRenderer.invoke('audit:getAll', filters, pagination),
  getEntityHistory: (entityType: string, entityId: string) => ipcRenderer.invoke('audit:getEntityHistory', entityType, entityId),
  getUserActivity: (userId: number, dateRange?: any) => ipcRenderer.invoke('audit:getUserActivity', userId, dateRange),
};

const notificationAPI = {
  getAll: (userId: number, filters?: any) => ipcRenderer.invoke('notification:getAll', userId, filters),
  markAsRead: (notificationId: number) => ipcRenderer.invoke('notification:markAsRead', notificationId),
  markAllAsRead: (userId: number) => ipcRenderer.invoke('notification:markAllAsRead', userId),
  delete: (notificationId: number) => ipcRenderer.invoke('notification:delete', notificationId),
};

const importExportAPI = {
  importProducts: (filePath: string, userId: number) => ipcRenderer.invoke('import:products', filePath, userId),
  importCustomers: (filePath: string, userId: number) => ipcRenderer.invoke('import:customers', filePath, userId),
  exportProducts: (filters?: any, format?: 'xlsx' | 'csv') => ipcRenderer.invoke('export:products', filters, format),
  exportCustomers: (filters?: any, format?: 'xlsx' | 'csv') => ipcRenderer.invoke('export:customers', filters, format),
  exportInvoices: (filters?: any, format?: 'xlsx' | 'csv') => ipcRenderer.invoke('export:invoices', filters, format),
  exportLoans: (filters?: any, format?: 'xlsx' | 'csv') => ipcRenderer.invoke('export:loans', filters, format),
  generateTemplate: (type: 'products' | 'customers') => ipcRenderer.invoke('export:generateTemplate', type),
};

const invoiceTemplateAPI = {
  getAll: () => ipcRenderer.invoke('template:getAll'),
  generateHTML: (invoice: any, templateId?: string) => ipcRenderer.invoke('template:generateHTML', invoice, templateId),
};

const licenseAPI = {
  activate: (licenseKey: string) => ipcRenderer.invoke('license:activate', { licenseKey }),
  validate: () => ipcRenderer.invoke('license:validate'),
  deactivate: () => ipcRenderer.invoke('license:deactivate'),
  getInfo: () => ipcRenderer.invoke('license:get-info'),
  getHardwareId: () => ipcRenderer.invoke('license:get-hardware-id'),
  getHardwareInfo: () => ipcRenderer.invoke('license:get-hardware-info'),
};

const printerAPI = {
  findPrinters: () => ipcRenderer.invoke('printer:findPrinters'),
  connect: (printerId: string) => ipcRenderer.invoke('printer:connect', printerId),
  disconnect: () => ipcRenderer.invoke('printer:disconnect'),
  getSettings: () => ipcRenderer.invoke('printer:getSettings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('printer:saveSettings', settings),
  setPaperWidth: (width: 58 | 80) => ipcRenderer.invoke('printer:setPaperWidth', width),
  printInvoice: (invoiceId: number) => ipcRenderer.invoke('printer:printInvoice', invoiceId),
  printBarcodeLabel: (productId: number) => ipcRenderer.invoke('printer:printBarcodeLabel', productId),
  printRFIDLabel: (productId: number) => ipcRenderer.invoke('printer:printRFIDLabel', productId),
  testPrint: () => ipcRenderer.invoke('printer:testPrint'),
  getStatus: () => ipcRenderer.invoke('printer:getStatus'),
};

const hardwareAPI = {
  getSettings: () => ipcRenderer.invoke('hardware:getSettings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('hardware:saveSettings', settings),
  toggleMode: (mode: 'real' | 'mock') => ipcRenderer.invoke('hardware:toggleMode', mode),
  disconnectAll: () => ipcRenderer.invoke('hardware:disconnectAll'),
  barcode: {
    scan: () => ipcRenderer.invoke('hardware:barcode:scan'),
    startContinuous: () => ipcRenderer.invoke('hardware:barcode:startContinuous'),
    stopContinuous: () => ipcRenderer.invoke('hardware:barcode:stopContinuous'),
    onData: (callback: (barcode: string) => void) => {
      ipcRenderer.on('hardware:barcode:data', (_event, barcode) => callback(barcode));
      return () => ipcRenderer.removeAllListeners('hardware:barcode:data');
    },
  },
  rfid: {
    read: () => ipcRenderer.invoke('hardware:rfid:read'),
    startContinuous: () => ipcRenderer.invoke('hardware:rfid:startContinuous'),
    stopContinuous: () => ipcRenderer.invoke('hardware:rfid:stopContinuous'),
    onData: (callback: (data: { tag: string; rssi: number }) => void) => {
      ipcRenderer.on('hardware:rfid:data', (_event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('hardware:rfid:data');
    },
  },
  scale: {
    read: () => ipcRenderer.invoke('hardware:scale:read'),
    tare: () => ipcRenderer.invoke('hardware:scale:tare'),
    startContinuous: () => ipcRenderer.invoke('hardware:scale:startContinuous'),
    stopContinuous: () => ipcRenderer.invoke('hardware:scale:stopContinuous'),
    onData: (callback: (data: { weight: number; stable: boolean }) => void) => {
      ipcRenderer.on('hardware:scale:data', (_event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('hardware:scale:data');
    },
  },
};

const updateAPI = {
  check: (silent?: boolean) => ipcRenderer.invoke('update:check', silent),
  download: () => ipcRenderer.invoke('update:download'),
  install: () => ipcRenderer.invoke('update:install'),
  getStatus: () => ipcRenderer.invoke('update:getStatus'),
  getSettings: () => ipcRenderer.invoke('update:getSettings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update:updateSettings', settings),
  onChecking: (callback: () => void) => {
    ipcRenderer.on('update:checking', callback);
    return () => ipcRenderer.removeListener('update:checking', callback);
  },
  onAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:available', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:available');
  },
  onNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:not-available', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:not-available');
  },
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update:download-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('update:download-progress');
  },
  onDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update:downloaded', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:downloaded');
  },
  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('update:error', (_event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('update:error');
  },
};

const dashboardAPI = {
  getSalesTrends: () => ipcRenderer.invoke('dashboard:get-sales-trends'),
  getProductDistribution: () => ipcRenderer.invoke('dashboard:get-product-distribution'),
  getTopProducts: () => ipcRenderer.invoke('dashboard:get-top-products'),
  getPaymentSummary: () => ipcRenderer.invoke('dashboard:get-payment-summary'),
  getRevenueStats: () => ipcRenderer.invoke('dashboard:get-revenue-stats'),
  getCustomerStats: () => ipcRenderer.invoke('dashboard:get-customer-stats'),
};

const reportsAPI = {
  salesSummary: (params: any) => ipcRenderer.invoke('reports:sales-summary', params),
  salesByCustomer: (params: any) => ipcRenderer.invoke('reports:sales-by-customer', params),
  salesByProduct: (params: any) => ipcRenderer.invoke('reports:sales-by-product', params),
  salesDetailed: (params: any) => ipcRenderer.invoke('reports:sales-detailed', params),
  currentStock: (params: any) => ipcRenderer.invoke('reports:current-stock', params),
  stockMovement: (params: any) => ipcRenderer.invoke('reports:stock-movement', params),
  stockValuation: () => ipcRenderer.invoke('reports:stock-valuation'),
  gstr1: (params: any) => ipcRenderer.invoke('reports:gstr1', params),
  gstr3b: (params: any) => ipcRenderer.invoke('reports:gstr3b', params),
};

contextBridge.exposeInMainWorld('electronAPI', {
  auth: authAPI,
  license: licenseAPI,
  sync: syncAPI,
  product: productAPI,
  category: categoryAPI,
  metalType: metalTypeAPI,
  stone: stoneAPI,
  customer: customerAPI,
  invoice: invoiceAPI,
  dashboard: dashboardAPI,
  karigar: karigarAPI,
  goldLoan: goldLoanAPI,
  vendor: vendorAPI,
  purchaseOrder: purchaseOrderAPI,
  metalRate: metalRateAPI,
  salesReturn: salesReturnAPI,
  quotation: quotationAPI,
  email: emailAPI,
  audit: auditAPI,
  notification: notificationAPI,
  importExport: importExportAPI,
  invoiceTemplate: invoiceTemplateAPI,
  printer: printerAPI,
  hardware: hardwareAPI,
  update: updateAPI,
  reports: reportsAPI,
});

export interface ElectronAPI {
  auth: typeof authAPI;
  license: typeof licenseAPI;
  sync: typeof syncAPI;
  product: typeof productAPI;
  category: typeof categoryAPI;
  metalType: typeof metalTypeAPI;
  stone: typeof stoneAPI;
  customer: typeof customerAPI;
  invoice: typeof invoiceAPI;
  dashboard: typeof dashboardAPI;
  karigar: typeof karigarAPI;
  goldLoan: typeof goldLoanAPI;
  vendor: typeof vendorAPI;
  purchaseOrder: typeof purchaseOrderAPI;
  metalRate: typeof metalRateAPI;
  salesReturn: typeof salesReturnAPI;
  quotation: typeof quotationAPI;
  email: typeof emailAPI;
  audit: typeof auditAPI;
  notification: typeof notificationAPI;
  importExport: typeof importExportAPI;
  invoiceTemplate: typeof invoiceTemplateAPI;
  printer: typeof printerAPI;
  hardware: typeof hardwareAPI;
  update: typeof updateAPI;
  reports: typeof reportsAPI;
}

// Extend the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}