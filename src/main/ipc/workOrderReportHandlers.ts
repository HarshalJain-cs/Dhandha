import { ipcMain } from 'electron';
import { Op } from 'sequelize';
import WorkOrder from '../models/WorkOrder';
import WorkOrderPayment from '../models/WorkOrderPayment';
import Karigar from '../models/Karigar';
import { sequelize } from '../database/connection';
import ExcelJS from 'exceljs';
import path from 'path';
import { app } from 'electron';

export function setupWorkOrderReportHandlers() {
  // Karigar Performance Report
  ipcMain.handle('workOrderReport:karigarPerformance', async (event, filters?) => {
    try {
      const where: any = {};
      
      if (filters?.startDate && filters?.endDate) {
        where.issueDate = {
          [Op.between]: [filters.startDate, filters.endDate],
        };
      }
      
      const performanceData = await WorkOrder.findAll({
        where,
        attributes: [
          'karigarId',
          [sequelize.fn('COUNT', sequelize.col('WorkOrder.id')), 'totalOrders'],
          [sequelize.fn('SUM', sequelize.col('grossWeight')), 'totalGrossWeight'],
          [sequelize.fn('SUM', sequelize.col('netWeight')), 'totalNetWeight'],
          [sequelize.fn('SUM', sequelize.col('makingCharges')), 'totalMakingCharges'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
          [sequelize.fn('SUM', sequelize.col('balanceAmount')), 'totalBalance'],
          [
            sequelize.fn(
              'SUM',
              sequelize.literal(`CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END`)
            ),
            'completedOrders',
          ],
          [
            sequelize.fn(
              'AVG',
              sequelize.literal(
                `CASE WHEN status = 'COMPLETED' AND "actualDeliveryDate" IS NOT NULL AND "expectedDeliveryDate" IS NOT NULL 
                THEN EXTRACT(DAY FROM ("actualDeliveryDate" - "expectedDeliveryDate")) 
                ELSE NULL END`
              )
            ),
            'avgDelayDays',
          ],
        ],
        include: [
          {
            model: Karigar,
            as: 'karigar',
            attributes: ['id', 'name', 'contactNumber', 'specialization'],
          },
        ],
        group: ['karigarId', 'karigar.id', 'karigar.name', 'karigar.contactNumber', 'karigar.specialization'],
        raw: false,
      });
      
      return { success: true, data: performanceData };
    } catch (error) {
      console.error('Error fetching karigar performance report:', error);
      return { success: false, error: 'Failed to fetch karigar performance report' };
    }
  });

  // Work Order Status Report
  ipcMain.handle('workOrderReport:statusReport', async (event, filters?) => {
    try {
      const where: any = {};
      
      if (filters?.startDate && filters?.endDate) {
        where.issueDate = {
          [Op.between]: [filters.startDate, filters.endDate],
        };
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      const workOrders = await WorkOrder.findAll({
        where,
        include: [
          {
            model: Karigar,
            as: 'karigar',
            attributes: ['name', 'contactNumber', 'specialization'],
          },
          {
            model: WorkOrderPayment,
            as: 'payments',
          },
        ],
        order: [['issueDate', 'DESC']],
      });
      
      return { success: true, data: workOrders };
    } catch (error) {
      console.error('Error fetching status report:', error);
      return { success: false, error: 'Failed to fetch status report' };
    }
  });

  // Payment Report
  ipcMain.handle('workOrderReport:paymentReport', async (event, filters?) => {
    try {
      const where: any = {};
      
      if (filters?.startDate && filters?.endDate) {
        where.paymentDate = {
          [Op.between]: [filters.startDate, filters.endDate],
        };
      }
      
      if (filters?.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
      }
      
      const payments = await WorkOrderPayment.findAll({
        where,
        include: [
          {
            model: WorkOrder,
            as: 'workOrder',
            include: [
              {
                model: Karigar,
                as: 'karigar',
                attributes: ['name', 'contactNumber'],
              },
            ],
          },
        ],
        order: [['paymentDate', 'DESC']],
      });
      
      const summary = await WorkOrderPayment.findAll({
        where,
        attributes: [
          'paymentMethod',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        ],
        group: ['paymentMethod'],
        raw: true,
      });
      
      return { success: true, data: { payments, summary } };
    } catch (error) {
      console.error('Error fetching payment report:', error);
      return { success: false, error: 'Failed to fetch payment report' };
    }
  });

  // Export Karigar Performance Report to Excel
  ipcMain.handle('workOrderReport:exportKarigarPerformance', async (event, data, filters?) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Karigar Performance');
      
      // Add header
      worksheet.addRow(['KARIGAR PERFORMANCE REPORT']);
      worksheet.addRow([
        `Period: ${filters?.startDate ? new Date(filters.startDate).toLocaleDateString('en-IN') : 'All'} to ${
          filters?.endDate ? new Date(filters.endDate).toLocaleDateString('en-IN') : 'All'
        }`,
      ]);
      worksheet.addRow([]);
      
      // Add column headers
      const headerRow = worksheet.addRow([
        'Karigar Name',
        'Contact',
        'Specialization',
        'Total Orders',
        'Completed',
        'Gross Weight (gm)',
        'Net Weight (gm)',
        'Making Charges',
        'Total Amount',
        'Balance',
        'Avg Delay (days)',
      ]);
      
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      
      // Add data rows
      data.forEach((item: any) => {
        worksheet.addRow([
          item.karigar.name,
          item.karigar.contactNumber,
          item.karigar.specialization,
          item.totalOrders,
          item.completedOrders,
          parseFloat(item.totalGrossWeight || 0).toFixed(3),
          parseFloat(item.totalNetWeight || 0).toFixed(3),
          parseFloat(item.totalMakingCharges || 0).toFixed(2),
          parseFloat(item.totalAmount || 0).toFixed(2),
          parseFloat(item.totalBalance || 0).toFixed(2),
          item.avgDelayDays ? parseFloat(item.avgDelayDays).toFixed(1) : 'N/A',
        ]);
      });
      
      // Add summary
      worksheet.addRow([]);
      const totals = data.reduce(
        (acc: any, item: any) => ({
          orders: acc.orders + parseInt(item.totalOrders || 0),
          completed: acc.completed + parseInt(item.completedOrders || 0),
          grossWeight: acc.grossWeight + parseFloat(item.totalGrossWeight || 0),
          netWeight: acc.netWeight + parseFloat(item.totalNetWeight || 0),
          makingCharges: acc.makingCharges + parseFloat(item.totalMakingCharges || 0),
          totalAmount: acc.totalAmount + parseFloat(item.totalAmount || 0),
          balance: acc.balance + parseFloat(item.balance || 0),
        }),
        { orders: 0, completed: 0, grossWeight: 0, netWeight: 0, makingCharges: 0, totalAmount: 0, balance: 0 }
      );
      
      const summaryRow = worksheet.addRow([
        'TOTAL',
        '',
        '',
        totals.orders,
        totals.completed,
        totals.grossWeight.toFixed(3),
        totals.netWeight.toFixed(3),
        totals.makingCharges.toFixed(2),
        totals.totalAmount.toFixed(2),
        totals.balance.toFixed(2),
        '',
      ]);
      
      summaryRow.font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
      
      // Save file
      const fileName = `Karigar_Performance_${Date.now()}.xlsx`;
      const filePath = path.join(app.getPath('downloads'), fileName);
      await workbook.xlsx.writeFile(filePath);
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting karigar performance report:', error);
      return { success: false, error: 'Failed to export report' };
    }
  });

  // Export Work Order Status Report to Excel
  ipcMain.handle('workOrderReport:exportStatusReport', async (event, data, filters?) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Work Orders');
      
      // Add header
      worksheet.addRow(['WORK ORDER STATUS REPORT']);
      worksheet.addRow([
        `Period: ${filters?.startDate ? new Date(filters.startDate).toLocaleDateString('en-IN') : 'All'} to ${
          filters?.endDate ? new Date(filters.endDate).toLocaleDateString('en-IN') : 'All'
        }`,
      ]);
      if (filters?.status) {
        worksheet.addRow([`Status: ${filters.status}`]);
      }
      worksheet.addRow([]);
      
      // Add column headers
      const headerRow = worksheet.addRow([
        'WO Number',
        'Karigar',
        'Issue Date',
        'Expected Delivery',
        'Actual Delivery',
        'Status',
        'Priority',
        'Metal Type',
        'Gross Weight',
        'Net Weight',
        'Making Charges',
        'Total Amount',
        'Advance',
        'Balance',
      ]);
      
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      
      // Add data rows
      data.forEach((order: any) => {
        worksheet.addRow([
          order.workOrderNumber,
          order.karigar.name,
          new Date(order.issueDate).toLocaleDateString('en-IN'),
          order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A',
          order.actualDeliveryDate ? new Date(order.actualDeliveryDate).toLocaleDateString('en-IN') : 'N/A',
          order.status,
          order.priority,
          order.metalType,
          parseFloat(order.grossWeight).toFixed(3),
          parseFloat(order.netWeight).toFixed(3),
          parseFloat(order.makingCharges).toFixed(2),
          parseFloat(order.totalAmount).toFixed(2),
          parseFloat(order.advancePayment).toFixed(2),
          parseFloat(order.balanceAmount).toFixed(2),
        ]);
      });
      
      // Add summary
      worksheet.addRow([]);
      const totals = data.reduce(
        (acc: any, order: any) => ({
          grossWeight: acc.grossWeight + parseFloat(order.grossWeight),
          netWeight: acc.netWeight + parseFloat(order.netWeight),
          makingCharges: acc.makingCharges + parseFloat(order.makingCharges),
          totalAmount: acc.totalAmount + parseFloat(order.totalAmount),
          advance: acc.advance + parseFloat(order.advancePayment),
          balance: acc.balance + parseFloat(order.balanceAmount),
        }),
        { grossWeight: 0, netWeight: 0, makingCharges: 0, totalAmount: 0, advance: 0, balance: 0 }
      );
      
      const summaryRow = worksheet.addRow([
        'TOTAL',
        `${data.length} Orders`,
        '',
        '',
        '',
        '',
        '',
        '',
        totals.grossWeight.toFixed(3),
        totals.netWeight.toFixed(3),
        totals.makingCharges.toFixed(2),
        totals.totalAmount.toFixed(2),
        totals.advance.toFixed(2),
        totals.balance.toFixed(2),
      ]);
      
      summaryRow.font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
      
      // Save file
      const fileName = `Work_Orders_${Date.now()}.xlsx`;
      const filePath = path.join(app.getPath('downloads'), fileName);
      await workbook.xlsx.writeFile(filePath);
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting status report:', error);
      return { success: false, error: 'Failed to export report' };
    }
  });

  // Export Payment Report to Excel
  ipcMain.handle('workOrderReport:exportPaymentReport', async (event, data, filters?) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payments');
      
      // Add header
      worksheet.addRow(['WORK ORDER PAYMENT REPORT']);
      worksheet.addRow([
        `Period: ${filters?.startDate ? new Date(filters.startDate).toLocaleDateString('en-IN') : 'All'} to ${
          filters?.endDate ? new Date(filters.endDate).toLocaleDateString('en-IN') : 'All'
        }`,
      ]);
      worksheet.addRow([]);
      
      // Add column headers
      const headerRow = worksheet.addRow([
        'Payment Date',
        'WO Number',
        'Karigar',
        'Amount',
        'Payment Method',
        'Reference',
        'Notes',
      ]);
      
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      
      // Add data rows
      data.payments.forEach((payment: any) => {
        worksheet.addRow([
          new Date(payment.paymentDate).toLocaleDateString('en-IN'),
          payment.workOrder.workOrderNumber,
          payment.workOrder.karigar.name,
          parseFloat(payment.amount).toFixed(2),
          payment.paymentMethod,
          payment.referenceNumber || 'N/A',
          payment.notes || '',
        ]);
      });
      
      // Add summary by payment method
      worksheet.addRow([]);
      worksheet.addRow(['SUMMARY BY PAYMENT METHOD']);
      const summaryHeaderRow = worksheet.addRow(['Payment Method', 'Count', 'Total Amount']);
      summaryHeaderRow.font = { bold: true };
      
      data.summary.forEach((item: any) => {
        worksheet.addRow([item.paymentMethod, item.count, parseFloat(item.totalAmount).toFixed(2)]);
      });
      
      // Grand total
      worksheet.addRow([]);
      const grandTotal = data.summary.reduce((sum: number, item: any) => sum + parseFloat(item.totalAmount), 0);
      const grandTotalRow = worksheet.addRow(['GRAND TOTAL', data.payments.length, grandTotal.toFixed(2)]);
      grandTotalRow.font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 20;
      });
      
      // Save file
      const fileName = `Payment_Report_${Date.now()}.xlsx`;
      const filePath = path.join(app.getPath('downloads'), fileName);
      await workbook.xlsx.writeFile(filePath);
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Error exporting payment report:', error);
      return { success: false, error: 'Failed to export report' };
    }
  });
}