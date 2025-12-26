import { ipcMain } from 'electron';
import { EmailService } from '../services/emailService';

export function setupEmailHandlers(): void {
  ipcMain.handle('email:sendInvoice', async (event, invoiceId, recipientEmail) => {
    return await EmailService.sendInvoiceEmail(invoiceId, recipientEmail);
  });

  ipcMain.handle('email:sendQuotation', async (event, quotationId, recipientEmail) => {
    return await EmailService.sendQuotationEmail(quotationId, recipientEmail);
  });

  ipcMain.handle('email:sendPayment', async (event, paymentId, recipientEmail) => {
    return await EmailService.sendPaymentConfirmation(paymentId, recipientEmail);
  });

  ipcMain.handle('email:sendLoanReminder', async (event, loanId, recipientEmail) => {
    return await EmailService.sendLoanReminder(loanId, recipientEmail);
  });

  ipcMain.handle('email:testConnection', async () => {
    return await EmailService.testEmailConnection();
  });
}
