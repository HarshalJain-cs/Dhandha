/**
 * Global Type Definitions for Renderer Process
 * Declares window.electronAPI types exposed by preload script
 */

interface ElectronAPI {
  auth: {
    login: (username: string, password: string) => Promise<any>;
    validateToken: (token: string) => Promise<any>;
    changePassword: (userId: number, currentPassword: string, newPassword: string) => Promise<any>;
    createUser: (userData: any) => Promise<any>;
    getUserById: (userId: number) => Promise<any>;
    updateUser: (userId: number, updateData: any, updatedBy: number) => Promise<any>;
    deactivateUser: (userId: number, updatedBy: number) => Promise<any>;
    getAllUsers: () => Promise<any>;
  };
  product: {
    create: (productData: any) => Promise<any>;
    getAll: (filters?: any, pagination?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
    updateStock: (id: number, quantity: number, operation: string, updatedBy: number) => Promise<any>;
    getLowStock: () => Promise<any>;
    getOutOfStock: () => Promise<any>;
    search: (searchTerm: string) => Promise<any>;
    generateBarcode: () => Promise<any>;
  };
  category: {
    create: (categoryData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
    getTree: () => Promise<any>;
  };
  metalType: {
    create: (metalTypeData: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
    updateRate: (id: number, newRate: number, updatedBy: number) => Promise<any>;
  };
  stone: {
    create: (stoneData: any) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
  };
  customer: {
    create: (customerData: any) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
    search: (searchTerm: string) => Promise<any>;
    updateBalance: (id: number, amount: number, operation: string) => Promise<any>;
  };
  invoice: {
    create: (invoiceData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    cancel: (id: number, reason: string, userId: number) => Promise<any>;
    addPayment: (id: number, paymentData: any, userId: number) => Promise<any>;
    getPayments: (id: number) => Promise<any>;
  };
  karigar: {
    create: (karigarData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
    createOrder: (orderData: any, userId: number) => Promise<any>;
    getOrders: (karigarId: number) => Promise<any>;
    updateOrderStatus: (orderId: number, status: string, userId: number) => Promise<any>;
  };
  goldLoan: {
    create: (loanData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    approve: (id: number, userId: number) => Promise<any>;
    disburse: (id: number, userId: number) => Promise<any>;
    addPayment: (id: number, paymentData: any, userId: number) => Promise<any>;
    close: (id: number, userId: number) => Promise<any>;
    foreclose: (id: number, userId: number) => Promise<any>;
  };
  vendor: {
    create: (vendorData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: number) => Promise<any>;
    update: (id: number, updateData: any, updatedBy: number) => Promise<any>;
    delete: (id: number, deletedBy: number) => Promise<any>;
  };
  purchaseOrder: {
    create: (poData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: string) => Promise<any>;
    receive: (id: string, quantity: number, userId: number) => Promise<any>;
    cancel: (id: string, reason: string, userId: number) => Promise<any>;
  };
  quotation: {
    create: (quotationData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: string) => Promise<any>;
    convertToInvoice: (id: string, userId: number) => Promise<any>;
    updateStatus: (id: string, status: string, userId: number, reason?: string) => Promise<any>;
  };
  salesReturn: {
    create: (returnData: any, userId: number) => Promise<any>;
    getAll: (filters?: any) => Promise<any>;
    getById: (id: string) => Promise<any>;
    approve: (id: string, userId: number) => Promise<any>;
    processExchange: (id: string, newInvoiceId: string, userId: number) => Promise<any>;
    updateStatus: (id: string, status: string, userId: number, reason?: string) => Promise<any>;
  };
  metalRate: {
    getAll: () => Promise<any>;
    getLatest: () => Promise<any>;
    update: (rateData: any, userId: number) => Promise<any>;
  };
  email: {
    sendInvoice: (invoiceId: string, email: string) => Promise<any>;
    sendQuotation: (quotationId: string, email: string) => Promise<any>;
    sendPaymentReceipt: (paymentId: string, email: string) => Promise<any>;
    sendLoanReminder: (loanId: string) => Promise<any>;
  };
  audit: {
    getAll: (filters?: any) => Promise<any>;
    getByEntity: (entityType: string, entityId: string) => Promise<any>;
  };
  notification: {
    getAll: (userId: number) => Promise<any>;
    markAsRead: (notificationId: string) => Promise<any>;
    markAllAsRead: (userId: number) => Promise<any>;
    create: (notificationData: any) => Promise<any>;
  };
  importExport: {
    importProducts: (filePath: string) => Promise<any>;
    importCustomers: (filePath: string) => Promise<any>;
    exportProducts: (filters?: any) => Promise<any>;
    exportCustomers: (filters?: any) => Promise<any>;
    exportInvoices: (filters?: any) => Promise<any>;
  };
  invoiceTemplate: {
    getAll: () => Promise<any>;
    generateHTML: (invoiceId: string, templateId?: string) => Promise<any>;
  };
  sync: {
    getStatus: () => Promise<any>;
    triggerSync: () => Promise<any>;
    toggleSync: (enabled: boolean) => Promise<any>;
    updateInterval: (intervalMinutes: number) => Promise<any>;
    cleanup: (daysToKeep?: number) => Promise<any>;
  };
  printer: {
    findPrinters: () => Promise<any>;
    connect: (printerId: string) => Promise<any>;
    disconnect: () => Promise<any>;
    getSettings: () => Promise<any>;
    saveSettings: (settings: any) => Promise<any>;
    setPaperWidth: (width: 58 | 80) => Promise<any>;
    printInvoice: (invoiceId: number) => Promise<any>;
    printBarcodeLabel: (productId: number) => Promise<any>;
    printRFIDLabel: (productId: number) => Promise<any>;
    testPrint: () => Promise<any>;
    getStatus: () => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
