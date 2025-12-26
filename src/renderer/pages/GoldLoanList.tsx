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
  message,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import {
  setLoans,
  setLoading,
  setFilters,
  setStats,
  setPagination,
} from '../store/slices/goldLoanSlice';
import type { ColumnsType } from 'antd/es/table';
import type { GoldLoan } from '../store/slices/goldLoanSlice';
import dayjs from 'dayjs';

const { Option } = Select;

const GoldLoanList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loans, filters, pagination, stats, loading } = useSelector(
    (state: RootState) => state.goldLoan
  );

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadLoans();
    loadStats();
  }, []);

  /**
   * Load loans with current filters and pagination
   */
  const loadLoans = async (page = 1) => {
    dispatch(setLoading(true));

    try {
      const response = await window.electronAPI.goldLoan.getAll(
        {
          ...filters,
          search: searchText,
        },
        { page, limit: pagination.limit }
      );

      if (response.success) {
        dispatch(
          setLoans({
            loans: response.data.loans,
            pagination: {
              page: response.data.page,
              limit: response.data.limit,
              total: response.data.total,
              totalPages: response.data.totalPages,
            },
          })
        );
      } else {
        message.error(response.message || 'Failed to load loans');
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      message.error('An error occurred while loading loans');
    } finally {
      dispatch(setLoading(false));
    }
  };

  /**
   * Load statistics
   */
  const loadStats = async () => {
    try {
      const response = await window.electronAPI.goldLoan.getStats(filters);
      if (response.success) {
        dispatch(setStats(response.data));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: string, value: any) => {
    dispatch(setFilters({ ...filters, [key]: value }));
  };

  /**
   * Handle search
   */
  const handleSearch = () => {
    loadLoans(1);
    loadStats();
  };

  /**
   * Handle table pagination change
   */
  const handleTableChange = (paginationConfig: any) => {
    loadLoans(paginationConfig.current);
  };

  /**
   * Reset filters
   */
  const handleReset = () => {
    setSearchText('');
    dispatch(setFilters({}));
    loadLoans(1);
    loadStats();
  };

  /**
   * Get status tag color
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sanctioned: 'blue',
      disbursed: 'cyan',
      active: 'green',
      partial_repaid: 'orange',
      closed: 'default',
      defaulted: 'red',
      foreclosed: 'purple',
    };
    return colors[status] || 'default';
  };

  /**
   * Get risk level color
   */
  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'orange',
      high: 'red',
    };
    return colors[riskLevel] || 'default';
  };

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<GoldLoan> = [
    {
      title: 'Loan #',
      dataIndex: 'loan_number',
      key: 'loan_number',
      fixed: 'left',
      width: 150,
      render: (text: string, record: GoldLoan) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {dayjs(record.loan_date).format('DD MMM YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (text: string, record: GoldLoan) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.customer_mobile}</div>
        </div>
      ),
    },
    {
      title: 'Loan Amount',
      dataIndex: 'loan_amount',
      key: 'loan_amount',
      width: 130,
      align: 'right',
      render: (amount: number) => (
        <span className="font-semibold">₹{Number(amount).toFixed(2)}</span>
      ),
    },
    {
      title: 'Outstanding',
      dataIndex: 'balance_due',
      key: 'balance_due',
      width: 130,
      align: 'right',
      render: (amount: number) => (
        <span className={Number(amount) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          ₹{Number(amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Risk',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (riskLevel: string) => (
        <Tag color={getRiskColor(riskLevel)}>
          {riskLevel.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Maturity',
      dataIndex: 'maturity_date',
      key: 'maturity_date',
      width: 120,
      render: (date: string, record: GoldLoan) => {
        const daysToMaturity = dayjs(date).diff(dayjs(), 'day');
        const isOverdue = record.is_overdue;

        return (
          <div>
            <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {dayjs(date).format('DD MMM YYYY')}
            </div>
            {isOverdue && (
              <div className="text-xs text-red-600">
                Overdue {record.days_overdue} days
              </div>
            )}
            {!isOverdue && daysToMaturity <= 7 && daysToMaturity > 0 && (
              <div className="text-xs text-orange-600">
                Due in {daysToMaturity} days
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_: any, record: GoldLoan) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/gold-loans/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gold Loans</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/gold-loans/new')}
        >
          New Loan
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Loans"
                value={stats.total_loans}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Loans"
                value={stats.active_loans}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Outstanding"
                value={stats.total_outstanding_balance}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Overdue Loans"
                value={stats.overdue_loans}
                valueStyle={{ color: '#ff7a45' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Input
              placeholder="Search loan #, customer, mobile..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>

          <Col span={4}>
            <Select
              placeholder="Loan Status"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
            >
              <Option value="">All Status</Option>
              <Option value="sanctioned">Sanctioned</Option>
              <Option value="disbursed">Disbursed</Option>
              <Option value="active">Active</Option>
              <Option value="partial_repaid">Partial Repaid</Option>
              <Option value="closed">Closed</Option>
              <Option value="defaulted">Defaulted</Option>
              <Option value="foreclosed">Foreclosed</Option>
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
              <Option value="">All Payment Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="partial">Partial</Option>
              <Option value="paid">Paid</Option>
            </Select>
          </Col>

          <Col span={4}>
            <Select
              placeholder="Risk Level"
              style={{ width: '100%' }}
              value={filters.risk_level}
              onChange={(value) => handleFilterChange('risk_level', value)}
              allowClear
            >
              <Option value="">All Risk</Option>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Col>

          <Col span={6}>
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
                onClick={handleReset}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Loans Table */}
      <Card>
        <Table
          dataSource={loans}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} loans`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default GoldLoanList;
