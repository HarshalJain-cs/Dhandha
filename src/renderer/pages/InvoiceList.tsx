import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Table,
  Input,
  Select,
  Space,
  Tag,
  DatePicker,
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { setInvoices, setLoading, setFilters, setSummary } from '../store/slices/invoiceSlice';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * Invoice List Page
 */
const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, filters, pagination, summary, loading } = useSelector(
    (state: RootState) => state.invoice
  );

  const [searchText, setSearchText] = useState('');

  /**
   * Load invoices on mount
   */
  useEffect(() => {
    loadInvoices();
    loadSummary();
  }, []);

  /**
   * Load invoices with filters
   */
  const loadInvoices = async (page = 1) => {
    dispatch(setLoading(true));

    try {
      const response = await window.electronAPI.invoice.getAll(
        {
          ...filters,
          search: searchText,
        },
        { page, limit: pagination.limit }
      );

      if (response.success) {
        dispatch(
          setInvoices({
            invoices: response.data.invoices,
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit,
            totalPages: response.data.totalPages,
          })
        );
      } else {
        message.error(response.message || 'Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      message.error('An error occurred while loading invoices');
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Load summary statistics
   */
  const loadSummary = async () => {
    try {
      const response = await window.electronAPI.invoice.getSummary(filters);
      if (response.success) {
        dispatch(setSummary(response.data));
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: string, value: any) => {
    dispatch(setFilters({ [key]: value }));
  };

  /**
   * Handle search
   */
  const handleSearch = () => {
    loadInvoices(1);
  };

  /**
   * Handle table change (pagination, filters, sorter)
   */
  const handleTableChange = (paginationConfig: any) => {
    loadInvoices(paginationConfig.current);
  };

  /**
   * Get payment status tag
   */
  const getPaymentStatusTag = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; label: string }
    > = {
      paid: { color: 'success', label: 'Paid' },
      partial: { color: 'warning', label: 'Partial' },
      pending: { color: 'default', label: 'Pending' },
      overdue: { color: 'error', label: 'Overdue' },
    };

    const config = statusConfig[status] || { color: 'default', label: status };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  /**
   * Get invoice type tag
   */
  const getInvoiceTypeTag = (type: string) => {
    const typeConfig: Record<string, { color: string; label: string }> = {
      sale: { color: 'blue', label: 'Sale' },
      estimate: { color: 'orange', label: 'Estimate' },
      return: { color: 'red', label: 'Return' },
    };

    const config = typeConfig[type] || { color: 'default', label: type };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  /**
   * Table columns
   */
  const columns: ColumnsType<any> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      fixed: 'left',
      width: 150,
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {dayjs(record.invoice_date).format('DD MMM YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">{record.customer_mobile}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'invoice_type',
      key: 'invoice_type',
      width: 100,
      render: (type: string) => getInvoiceTypeTag(type),
    },
    {
      title: 'Grand Total',
      dataIndex: 'grand_total',
      key: 'grand_total',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <span className="font-semibold">₹{Number(amount).toFixed(2)}</span>
      ),
    },
    {
      title: 'Paid',
      dataIndex: 'amount_paid',
      key: 'amount_paid',
      width: 120,
      align: 'right',
      render: (amount: number) => `₹${Number(amount).toFixed(2)}`,
    },
    {
      title: 'Balance',
      dataIndex: 'balance_due',
      key: 'balance_due',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <span className={Number(amount) > 0 ? 'text-red-600 font-medium' : ''}>
          ₹{Number(amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status: string) => getPaymentStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/billing/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => navigate(`/billing/${record.id}/print`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/billing/new')}
        >
          New Invoice
        </Button>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={summary.total_invoices}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={summary.total_sales}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Paid"
              value={summary.total_paid}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Outstanding"
              value={summary.total_outstanding}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Input
              placeholder="Search invoice number, customer..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>

          <Col span={4}>
            <Select
              placeholder="Invoice Type"
              style={{ width: '100%' }}
              value={filters.invoice_type}
              onChange={(value) => handleFilterChange('invoice_type', value)}
              allowClear
            >
              <Option value="">All Types</Option>
              <Option value="sale">Sale</Option>
              <Option value="estimate">Estimate</Option>
              <Option value="return">Return</Option>
            </Select>
          </Col>

          <Col span={4}>
            <Select
              placeholder="Payment Status"
              style={{ width: '100%' }}
              value={filters.payment_status}
              onChange={(value) => handleFilterChange('payment_status', value)}
              allowClear
            >
              <Option value="">All Status</Option>
              <Option value="paid">Paid</Option>
              <Option value="partial">Partial</Option>
              <Option value="pending">Pending</Option>
              <Option value="overdue">Overdue</Option>
            </Select>
          </Col>

          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  handleFilterChange('from_date', dates[0]?.toDate());
                  handleFilterChange('to_date', dates[1]?.toDate());
                } else {
                  handleFilterChange('from_date', null);
                  handleFilterChange('to_date', null);
                }
              }}
            />
          </Col>

          <Col span={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearchText('');
                  dispatch(setFilters({
                    is_active: true,
                    invoice_type: '',
                    payment_status: '',
                    is_cancelled: false,
                    from_date: null,
                    to_date: null,
                  }));
                  loadInvoices(1);
                }}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Invoices Table */}
      <Card>
        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} invoices`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default InvoiceList;
