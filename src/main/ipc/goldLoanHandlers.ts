import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { GoldLoanService } from '../services/goldLoanService';

/**
 * Setup Gold Loan IPC Handlers
 */
export function setupGoldLoanHandlers(): void {
  /**
   * Create new gold loan
   */
  ipcMain.handle(
    'goldLoan:create',
    async (_event: IpcMainInvokeEvent, data: any, createdBy: number) => {
      try {
        return await GoldLoanService.createGoldLoan(data, createdBy);
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'An error occurred while creating gold loan',
        };
      }
    }
  );

  /**
   * Get all gold loans with filters
   */
  ipcMain.handle(
    'goldLoan:getAll',
    async (
      _event: IpcMainInvokeEvent,
      filters?: any,
      pagination?: { page: number; limit: number }
    ) => {
      try {
        return await GoldLoanService.getAllLoans(filters, pagination);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching gold loans',
        };
      }
    }
  );

  /**
   * Get gold loan by ID
   */
  ipcMain.handle('goldLoan:getById', async (_event: IpcMainInvokeEvent, id: number) => {
    try {
      return await GoldLoanService.getLoanById(id);
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while fetching gold loan',
      };
    }
  });

  /**
   * Get payment history for a loan
   */
  ipcMain.handle('goldLoan:getPayments', async (_event: IpcMainInvokeEvent, loanId: number) => {
    try {
      return await GoldLoanService.getPayments(loanId);
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while fetching payments',
      };
    }
  });

  /**
   * Approve gold loan
   */
  ipcMain.handle(
    'goldLoan:approve',
    async (_event: IpcMainInvokeEvent, id: number, approvedBy: number) => {
      try {
        return await GoldLoanService.approveLoan(id, approvedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while approving gold loan',
        };
      }
    }
  );

  /**
   * Disburse gold loan
   */
  ipcMain.handle(
    'goldLoan:disburse',
    async (_event: IpcMainInvokeEvent, id: number, data: any, disbursedBy: number) => {
      try {
        return await GoldLoanService.disburseLoan(id, data, disbursedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while disbursing gold loan',
        };
      }
    }
  );

  /**
   * Record payment against gold loan
   */
  ipcMain.handle(
    'goldLoan:recordPayment',
    async (_event: IpcMainInvokeEvent, loanId: number, paymentData: any, createdBy: number) => {
      try {
        return await GoldLoanService.recordPayment(loanId, paymentData, createdBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while recording payment',
        };
      }
    }
  );

  /**
   * Close gold loan
   */
  ipcMain.handle(
    'goldLoan:close',
    async (_event: IpcMainInvokeEvent, id: number, closedBy: number) => {
      try {
        return await GoldLoanService.closeLoan(id, closedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while closing gold loan',
        };
      }
    }
  );

  /**
   * Foreclose gold loan
   */
  ipcMain.handle(
    'goldLoan:foreclose',
    async (_event: IpcMainInvokeEvent, id: number, data: any, closedBy: number) => {
      try {
        return await GoldLoanService.forecloseLoan(id, data, closedBy);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while foreclosing gold loan',
        };
      }
    }
  );

  /**
   * Mark gold loan as default
   */
  ipcMain.handle(
    'goldLoan:markDefault',
    async (_event: IpcMainInvokeEvent, id: number, reason: string, userId: number) => {
      try {
        return await GoldLoanService.markAsDefault(id, reason, userId);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while marking gold loan as default',
        };
      }
    }
  );

  /**
   * Get gold loan statistics
   */
  ipcMain.handle(
    'goldLoan:getStats',
    async (_event: IpcMainInvokeEvent, filters?: any) => {
      try {
        return await GoldLoanService.getLoanStats(filters);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching statistics',
        };
      }
    }
  );

  /**
   * Get overdue gold loans
   */
  ipcMain.handle('goldLoan:getOverdue', async (_event: IpcMainInvokeEvent) => {
    try {
      return await GoldLoanService.getOverdueLoans();
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while fetching overdue loans',
      };
    }
  });

  /**
   * Get loans maturing soon
   */
  ipcMain.handle(
    'goldLoan:getMaturingSoon',
    async (_event: IpcMainInvokeEvent, days?: number) => {
      try {
        return await GoldLoanService.getMaturingSoonLoans(days);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while fetching maturing soon loans',
        };
      }
    }
  );

  /**
   * Calculate current interest
   */
  ipcMain.handle(
    'goldLoan:calculateInterest',
    async (_event: IpcMainInvokeEvent, loanId: number) => {
      try {
        return await GoldLoanService.calculateCurrentInterest(loanId);
      } catch (error: any) {
        return {
          success: false,
          message: 'An error occurred while calculating interest',
        };
      }
    }
  );
}

export default setupGoldLoanHandlers;
