// src/renderer/utils/excel.ts
import * as XLSX from 'xlsx';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any) => any;
}

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

export const exportToExcel = (options: ExcelExportOptions): void => {
  const { filename, sheetName, columns, data, title, subtitle } = options;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data
  const rows: any[] = [];

  // Add title and subtitle if provided
  if (title) {
    rows.push([title]);
    rows.push([]);
  }
  if (subtitle) {
    rows.push([subtitle]);
    rows.push([]);
  }

  // Add headers
  rows.push(columns.map((col) => col.header));

  // Add data rows
  data.forEach((item) => {
    const row = columns.map((col) => {
      const value = item[col.key];
      return col.format ? col.format(value) : value;
    });
    rows.push(row);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const colWidths = columns.map((col) => ({
    wch: col.width || 15,
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportMultipleSheets = (
  filename: string,
  sheets: Array<{
    name: string;
    columns: ExcelColumn[];
    data: any[];
  }>
): void => {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Prepare data
    const rows: any[] = [];

    // Add headers
    rows.push(sheet.columns.map((col) => col.header));

    // Add data rows
    sheet.data.forEach((item) => {
      const row = sheet.columns.map((col) => {
        const value = item[col.key];
        return col.format ? col.format(value) : value;
      });
      rows.push(row);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    const colWidths = sheet.columns.map((col) => ({
      wch: col.width || 15,
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
};