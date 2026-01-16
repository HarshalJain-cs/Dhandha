// src/renderer/utils/pdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './format';

interface PDFColumn {
  header: string;
  dataKey: string;
  width?: number;
}

interface PDFExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  columns: PDFColumn[];
  data: any[];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
}

export const exportToPDF = (options: PDFExportOptions): void => {
  const {
    filename,
    title,
    subtitle,
    columns,
    data,
    orientation = 'portrait',
    pageSize = 'a4',
  } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 22);
  }

  // Add table
  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: data.map((item) =>
      columns.map((col) => item[col.dataKey] !== undefined ? item[col.dataKey] : '')
    ),
    startY: subtitle ? 28 : 22,
    theme: 'striped',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
  });

  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${formatDate(new Date(), 'long')}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Save file
  doc.save(`${filename}.pdf`);
};
