// src/renderer/pages/Reports/SalesReport.tsx
import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../utils/format';
import { exportToExcel } from '../../utils/excel';
import { exportToPDF } from '../../utils/pdf';

const SalesReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('summary');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day');
  const [data, setData] = useState<any[]>([]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let result;

      switch (reportType) {
        case 'summary':
          result = await window.electronAPI.reports.salesSummary({
            startDate,
            endDate,
            groupBy,
          });
          break;
        case 'by-customer':
          result = await window.electronAPI.reports.salesByCustomer({
            startDate,
            endDate,
          });
          break;
        case 'by-product':
          result = await window.electronAPI.reports.salesByProduct({
            startDate,
            endDate,
          });
          break;
        case 'detailed':
          result = await window.electronAPI.reports.salesDetailed({
            startDate,
            endDate,
          });
          break;
      }

      if (result?.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const columns = getColumnsForReportType();
    exportToExcel({
      filename: `Sales_Report_${reportType}_${startDate}_to_${endDate}`,
      sheetName: 'Sales Report',
      columns,
      data,
      title: `Sales Report - ${reportType}`,
      subtitle: `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`,
    });
  };

  const handleExportPDF = () => {
    const columns = getColumnsForReportType();
    exportToPDF({
      filename: `Sales_Report_${reportType}_${startDate}_to_${endDate}`,
      title: `Sales Report - ${reportType}`,
      subtitle: `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`,
      columns,
      data,
      orientation: 'landscape',
    });
  };

  const getColumnsForReportType = () => {
    switch (reportType) {
      case 'summary':
        return [
          { header: 'Period', key: 'period', dataKey: 'period' },
          {
            header: 'Invoices',
            key: 'invoice_count',
            dataKey: 'invoice_count',
            format: (v: any) => parseInt(v),
          },
          {
            header: 'Subtotal',
            key: 'subtotal',
            dataKey: 'subtotal',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
          {
            header: 'CGST',
            key: 'cgst_amount',
            dataKey: 'cgst_amount',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
          {
            header: 'SGST',
            key: 'sgst_amount',
            dataKey: 'sgst_amount',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
          {
            header: 'Total',
            key: 'total_amount',
            dataKey: 'total_amount',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
        ];

      case 'by-customer':
        return [
          { header: 'Customer Code', key: 'customer.customer_code', dataKey: 'customer_code' },
          { header: 'Customer Name', key: 'customer.full_name', dataKey: 'full_name' },
          {
            header: 'Invoices',
            key: 'invoice_count',
            dataKey: 'invoice_count',
            format: (v: any) => parseInt(v),
          },
          {
            header: 'Total Sales',
            key: 'total_sales',
            dataKey: 'total_sales',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
          {
            header: 'Avg Order',
            key: 'average_order_value',
            dataKey: 'average_order_value',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
        ];

      case 'by-product':
        return [
          { header: 'Product Name', key: 'item_name', dataKey: 'item_name' },
          {
            header: 'Quantity Sold',
            key: 'total_quantity',
            dataKey: 'total_quantity',
            format: (v: any) => parseInt(v),
          },
          {
            header: 'Total Weight (g)',
            key: 'total_weight',
            dataKey: 'total_weight',
            format: (v: any) => parseFloat(v).toFixed(3),
          },
          {
            header: 'Total Sales',
            key: 'total_sales',
            dataKey: 'total_sales',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
          {
            header: 'Avg Rate',
            key: 'average_rate',
            dataKey: 'average_rate',
            format: (v: any) => formatCurrency(parseFloat(v)),
          },
        ];

      default:
        return [];
    }
  };

  const tableColumns = getColumnsForReportType().map((col) => ({
    key: col.key,
    title: col.header,
    render: col.format ? (_: any, row: any) => col.format!(row[col.key]) : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(value) => setReportType(value as string)}
            options={[
              { value: 'summary', label: 'Sales Summary' },
              { value: 'by-customer', label: 'By Customer' },
              { value: 'by-product', label: 'By Product' },
              { value: 'detailed', label: 'Detailed Report' },
            ]}
          />

          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          {reportType === 'summary' && (
            <Select
              label="Group By"
              value={groupBy}
              onChange={(value) => setGroupBy(value as string)}
              options={[
                { value: 'day', label: 'Daily' },
                { value: 'week', label: 'Weekly' },
                { value: 'month', label: 'Monthly' },
                { value: 'year', label: 'Yearly' },
              ]}
            />
          )}

          <div className="pt-6">
            <Button onClick={generateReport} loading={loading} fullWidth>
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      ) : data.length > 0 ? (
        <Card padding={false}>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Report Results</h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="small" onClick={handleExportExcel}>
                Export Excel
              </Button>
              <Button variant="secondary" size="small" onClick={handleExportPDF}>
                Export PDF
              </Button>
            </div>
          </div>
          <Table
            columns={tableColumns}
            data={data}
            rowKey={(row, index) => index?.toString() || '0'}
          />
        </Card>
      ) : null}
    </div>
  );
};

export default SalesReport;
