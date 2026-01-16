// src/renderer/pages/Reports/StockReport.tsx
import React, { useState } from 'react';
import { Tag } from 'antd';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency, formatWeight } from '../../utils/format';
import { exportToExcel } from '../../utils/excel';

const StockReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('current');
  const [data, setData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      let result;

      switch (reportType) {
        case 'current':
          result = await window.electronAPI.reports.currentStock({});
          break;
        case 'valuation':
          result = await window.electronAPI.reports.stockValuation();
          break;
        case 'movement':
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
          const endDate = new Date().toISOString().split('T')[0];
          result = await window.electronAPI.reports.stockMovement({
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

  const handleExport = () => {
    if (!data) return;

    const columns =
      reportType === 'current'
        ? [
            { header: 'Code', key: 'product_code' },
            { header: 'Product Name', key: 'product_name' },
            { header: 'Category', key: 'category.name' },
            { header: 'Type', key: 'product_type' },
            { header: 'Weight', key: 'net_weight', format: formatWeight },
            { header: 'Stock', key: 'current_stock' },
          ]
        : reportType === 'valuation'
        ? [
            { header: 'Code', key: 'product_code' },
            { header: 'Product Name', key: 'product_name' },
            { header: 'Stock', key: 'current_stock' },
            { header: 'Unit Value', key: 'unit_value', format: formatCurrency },
            { header: 'Total Value', key: 'total_value', format: formatCurrency },
          ]
        : [
            { header: 'Date', key: 'transaction_date' },
            { header: 'Product', key: 'product.product_name' },
            { header: 'Type', key: 'transaction_type' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Balance', key: 'running_balance' },
          ];

    exportToExcel({
      filename: `Stock_Report_${reportType}_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Stock Report',
      columns,
      data: reportType === 'current' || reportType === 'valuation' ? data.products : data,
      title: `Stock Report - ${reportType}`,
    });
  };

  const currentStockColumns = [
    { key: 'product_code', title: 'Code' },
    {
      key: 'product_name',
      title: 'Product',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium">{row.product_name}</div>
          <div className="text-sm text-gray-500">{row.category?.name}</div>
        </div>
      ),
    },
    { key: 'product_type', title: 'Type' },
    { key: 'purity', title: 'Purity' },
    {
      key: 'net_weight',
      title: 'Weight',
      render: (_: any, row: any) => formatWeight(row.net_weight),
    },
    {
      key: 'current_stock',
      title: 'Stock',
      render: (_: any, row: any) => (
        <Tag color={row.current_stock > 10 ? 'green' : row.current_stock > 0 ? 'orange' : 'red'}>
          {row.current_stock}
        </Tag>
      ),
    },
  ];

  const valuationColumns = [
    { key: 'product_code', title: 'Code' },
    { key: 'product_name', title: 'Product' },
    { key: 'current_stock', title: 'Stock' },
    {
      key: 'unit_value',
      title: 'Unit Value',
      render: (_: any, row: any) => formatCurrency(row.unit_value),
    },
    {
      key: 'total_value',
      title: 'Total Value',
      render: (_: any, row: any) => formatCurrency(row.total_value),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Select Report"
            value={reportType}
            onChange={(value) => setReportType(value as string)}
            options={[
              { value: 'current', label: 'Current Stock' },
              { value: 'valuation', label: 'Stock Valuation' },
              { value: 'movement', label: 'Stock Movement' },
            ]}
          />

          <div className="pt-6">
            <Button onClick={generateReport} loading={loading}>
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
      ) : data ? (
        <>
          {/* Summary */}
          {data.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold mt-2">{data.summary.total_products}</p>
              </Card>
              {data.summary.total_stock_value && (
                <Card>
                  <p className="text-sm text-gray-600">Total Stock Value</p>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(data.summary.total_stock_value)}
                  </p>
                </Card>
              )}
              {data.summary.low_stock_count !== undefined && (
                <Card>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold mt-2 text-red-600">
                    {data.summary.low_stock_count}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Table */}
          <Card padding={false}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Report Results</h2>
              <Button variant="secondary" size="small" onClick={handleExport}>
                Export Excel
              </Button>
            </div>
            <Table
              columns={reportType === 'valuation' ? valuationColumns : currentStockColumns}
              data={data.products || data}
              rowKey={(row: any) => row.id || row.transaction_date}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default StockReport;
