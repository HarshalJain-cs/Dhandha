// src/renderer/pages/Reports/GSTReport.tsx
import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency, formatDate } from '../../utils/format';
import { exportToExcel } from '../../utils/excel';

const GSTReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('gstr1');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      let result;

      if (reportType === 'gstr1') {
        result = await window.electronAPI.reports.gstr1({ month, year });
      } else {
        result = await window.electronAPI.reports.gstr3b({ month, year });
      }

      if (result?.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error generating GST report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    if (reportType === 'gstr1') {
      // Export multiple sheets for GSTR-1
      const sheets = [
        {
          name: 'B2B',
          columns: [
            { header: 'GSTIN', key: 'customer.gstin' },
            { header: 'Customer Name', key: 'customer.full_name' },
            { header: 'Invoice No', key: 'invoice_number' },
            { header: 'Invoice Date', key: 'invoice_date', format: formatDate },
            { header: 'Invoice Value', key: 'total_amount', format: formatCurrency },
            { header: 'Taxable Value', key: 'subtotal', format: formatCurrency },
            { header: 'CGST', key: 'cgst_amount', format: formatCurrency },
            { header: 'SGST', key: 'sgst_amount', format: formatCurrency },
          ],
          data: data.b2b,
        },
        {
          name: 'B2CL',
          columns: [
            { header: 'Customer Name', key: 'customer.full_name' },
            { header: 'Invoice No', key: 'invoice_number' },
            { header: 'Invoice Date', key: 'invoice_date', format: formatDate },
            { header: 'Invoice Value', key: 'total_amount', format: formatCurrency },
          ],
          data: data.b2cl,
        },
      ];

      exportToExcel({
        filename: `GSTR1_${month}_${year}`,
        sheetName: 'GSTR-1',
        columns: sheets[0].columns,
        data: sheets[0].data || [],
      });
    } else {
      // Export GSTR-3B
      exportToExcel({
        filename: `GSTR3B_${month}_${year}`,
        sheetName: 'GSTR-3B',
        columns: [
          { header: 'Description', key: 'description' },
          { header: 'Taxable Value', key: 'taxable_value', format: formatCurrency },
          { header: 'CGST', key: 'cgst_amount', format: formatCurrency },
          { header: 'SGST', key: 'sgst_amount', format: formatCurrency },
          { header: 'Total Tax', key: 'total_tax', format: formatCurrency },
        ],
        data: [
          {
            description: 'Outward Taxable Supplies',
            ...data.outward_supplies,
            total_tax:
              parseFloat(data.outward_supplies?.cgst_amount || 0) +
              parseFloat(data.outward_supplies?.sgst_amount || 0),
          },
        ],
      });
    }
  };

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: y.toString() };
  });

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">GST Report Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(value) => setReportType(value as string)}
            options={[
              { value: 'gstr1', label: 'GSTR-1' },
              { value: 'gstr3b', label: 'GSTR-3B' },
            ]}
          />

          <Select
            label="Month"
            value={month}
            onChange={(value) => setMonth(value as number)}
            options={monthOptions}
          />

          <Select
            label="Year"
            value={year}
            onChange={(value) => setYear(value as number)}
            options={yearOptions}
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
          {reportType === 'gstr1' ? (
            <>
              {/* B2B Section */}
              <Card padding={false}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">B2B Invoices ({data.b2b?.length || 0})</h2>
                  <Button variant="secondary" size="small" onClick={handleExport}>
                    Export Excel
                  </Button>
                </div>
                <Table
                  columns={[
                    {
                      key: 'customer_gstin',
                      title: 'GSTIN',
                      render: (_: any, row: any) => getNestedValue(row, 'customer.gstin') || '-'
                    },
                    {
                      key: 'customer_name',
                      title: 'Customer',
                      render: (_: any, row: any) => getNestedValue(row, 'customer.full_name') || '-'
                    },
                    { key: 'invoice_number', title: 'Invoice #' },
                    {
                      key: 'invoice_date',
                      title: 'Date',
                      render: (_: any, row: any) => formatDate(row.invoice_date),
                    },
                    {
                      key: 'total_amount',
                      title: 'Amount',
                      render: (_: any, row: any) => formatCurrency(row.total_amount),
                    },
                  ]}
                  data={data.b2b || []}
                  rowKey={(row: any) => row.id}
                />
              </Card>

              {/* B2CL Section */}
              {data.b2cl && data.b2cl.length > 0 && (
                <Card padding={false}>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">
                      B2C Large Invoices ({data.b2cl.length})
                    </h2>
                  </div>
                  <Table
                    columns={[
                      {
                        key: 'customer_name',
                        title: 'Customer',
                        render: (_: any, row: any) => getNestedValue(row, 'customer.full_name') || '-'
                      },
                      { key: 'invoice_number', title: 'Invoice #' },
                      {
                        key: 'total_amount',
                        title: 'Amount',
                        render: (_: any, row: any) => formatCurrency(row.total_amount),
                      },
                    ]}
                    data={data.b2cl}
                    rowKey={(row: any) => row.id}
                  />
                </Card>
              )}

              {/* B2CS Summary */}
              <Card>
                <h2 className="text-lg font-semibold mb-4">B2C Small Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Invoice Count</p>
                    <p className="text-2xl font-bold mt-1">
                      {data.b2cs?.[0]?.invoice_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(parseFloat(data.b2cs?.[0]?.total_amount || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tax</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(
                        parseFloat(data.b2cs?.[0]?.cgst_amount || 0) +
                          parseFloat(data.b2cs?.[0]?.sgst_amount || 0)
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            /* GSTR-3B */
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">GSTR-3B Summary</h2>
                <Button variant="secondary" size="small" onClick={handleExport}>
                  Export Excel
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">3.1 Outward Supplies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Taxable Value</p>
                      <p className="text-xl font-bold mt-1">
                        {formatCurrency(parseFloat(data.outward_supplies?.taxable_value || 0))}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">CGST</p>
                      <p className="text-xl font-bold mt-1">
                        {formatCurrency(parseFloat(data.outward_supplies?.cgst_amount || 0))}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">SGST</p>
                      <p className="text-xl font-bold mt-1">
                        {formatCurrency(parseFloat(data.outward_supplies?.sgst_amount || 0))}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Tax</p>
                      <p className="text-xl font-bold mt-1 text-red-600">
                        {formatCurrency(
                          parseFloat(data.outward_supplies?.cgst_amount || 0) +
                            parseFloat(data.outward_supplies?.sgst_amount || 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
};

export default GSTReport;
