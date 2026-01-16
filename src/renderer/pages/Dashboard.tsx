import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Badge, message, Spin, Button, Table } from 'antd';
import {
  GoldOutlined,
  TeamOutlined,
  DollarOutlined,
  WarningOutlined,
  CloudSyncOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import SalesChart from '../components/charts/SalesChart';
import ProductDistributionChart from '../components/charts/ProductDistributionChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import PaymentSummaryChart from '../components/charts/PaymentSummaryChart';

interface SyncStatusData {
  configured: boolean;
  status?: {
    lastSyncAt: Date | null;
    lastPushAt: Date | null;
    lastPullAt: Date | null;
    syncEnabled: boolean;
    syncIntervalMinutes: number;
    pendingChangesCount: number;
    failedChangesCount: number;
    lastSyncError: string | null;
    isSyncing: boolean;
  };
}

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
}

interface LowStockProduct {
  id: number;
  product_name: string;
  product_code: string;
  current_stock: number;
  min_stock_level: number;
  category?: { category_name: string };
}

/**
 * Dashboard Page Component
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalInventoryValue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart data states
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [productDistData, setProductDistData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [paymentSummaryData, setPaymentSummaryData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  /**
   * Fetch sync status
   */
  const fetchSyncStatus = async () => {
    try {
      const response = await window.electronAPI.sync.getStatus();
      if (response.success) {
        setSyncStatus(response as SyncStatusData);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  /**
   * Handle manual sync
   */
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const response = await window.electronAPI.sync.triggerSync();
      if (response.success) {
        message.success(`Sync completed! Pushed: ${response.pushed}, Pulled: ${response.pulled}`);
        fetchSyncStatus();
      } else {
        message.error(response.message || 'Sync failed');
      }
    } catch (error: any) {
      message.error('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Load dashboard statistics
   */
  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch products
      const productsResponse = await window.electronAPI.product.getAll({ is_active: true });
      const products = productsResponse.success ? productsResponse.data : [];

      // Fetch customers
      const customersResponse = await window.electronAPI.customer.getAll({ is_active: true });
      const customers = customersResponse.success ? customersResponse.data : [];

      // Fetch low stock products
      const lowStockResponse = await window.electronAPI.product.getLowStock();
      const lowStock = lowStockResponse.success ? lowStockResponse.data : [];

      // Fetch out of stock products
      const outOfStockResponse = await window.electronAPI.product.getOutOfStock();
      const outOfStock = outOfStockResponse.success ? outOfStockResponse.data : [];

      // Calculate total inventory value
      const totalValue = products.reduce((sum: number, product: any) => {
        return sum + (Number(product.unit_price) * Number(product.current_stock || 0));
      }, 0);

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        lowStockProducts: lowStock.length,
        outOfStockProducts: outOfStock.length,
        totalInventoryValue: totalValue,
      });

      setLowStockItems(lowStock.slice(0, 5)); // Top 5 low stock items
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load chart data
   */
  const loadChartData = async () => {
    try {
      setChartsLoading(true);

      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const [sales, products, top, payments] = await Promise.all([
        window.electronAPI.dashboard.getSalesTrends(startDateStr, endDateStr, 'day'),
        window.electronAPI.dashboard.getProductDistribution(),
        window.electronAPI.dashboard.getTopProducts(5, startDateStr, endDateStr),
        window.electronAPI.dashboard.getPaymentSummary(startDateStr, endDateStr),
      ]);

      if (sales.success && sales.data) {
        setSalesTrendData(sales.data);
      }

      if (products.success && products.data) {
        setProductDistData(products.data);
      }

      if (top.success && top.data) {
        setTopProductsData(top.data);
      }

      if (payments.success && payments.data) {
        setPaymentSummaryData(payments.data);
      }

    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setChartsLoading(false);
    }
  }

  /**
   * Load sync status and stats on mount
   */
  useEffect(() => {
    fetchSyncStatus();
    loadDashboardStats();
    loadChartData();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  /**
   * Low stock table columns
   */
  const lowStockColumns: ColumnsType<LowStockProduct> = [
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: ['category', 'category_name'],
      key: 'category',
      render: (text) => text || '-',
    },
    {
      title: 'Current Stock',
      dataIndex: 'current_stock',
      key: 'current_stock',
      align: 'right',
      render: (value) => (
        <span className="text-red-600 font-semibold">{value}</span>
      ),
    },
    {
      title: 'Min Stock',
      dataIndex: 'min_stock_level',
      key: 'min_stock_level',
      align: 'right',
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/products/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Dhandha ERP</h1>
      <p className="text-gray-600 mb-6">Complete inventory management for your jewellery business</p>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.totalProducts}
              prefix={<GoldOutlined />}
              valueStyle={{ color: '#d4af37' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={stats.totalCustomers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Inventory Value"
              value={stats.totalInventoryValue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={stats.lowStockProducts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
            {stats.outOfStockProducts > 0 && (
              <div className="mt-2 text-xs text-red-600">
                {stats.outOfStockProducts} out of stock
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Last 30 Days Sales Trend">
            <SalesChart data={salesTrendData} loading={chartsLoading} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Product Distribution by Category">
             <ProductDistributionChart data={productDistData} loading={chartsLoading} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Top 5 Selling Products (by Quantity)">
            <TopProductsChart data={topProductsData} loading={chartsLoading}/>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Payment Mode Summary">
             <PaymentSummaryChart data={paymentSummaryData} loading={chartsLoading} />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/billing/new')}
          >
            New Invoice
          </Button>
          <Button
            icon={<GoldOutlined />}
            onClick={() => navigate('/products/new')}
          >
            Add Product
          </Button>
          <Button
            icon={<TeamOutlined />}
            onClick={() => navigate('/customers')}
          >
            View Customers
          </Button>
          <Button
            icon={<DollarOutlined />}
            onClick={() => navigate('/metal-rates')}
          >
            Metal Rates
          </Button>
        </div>
      </Card>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              <WarningOutlined className="text-yellow-500 mr-2" />
              Low Stock Alerts
            </h3>
            <Button type="link" onClick={() => navigate('/products')}>
              View All Products
            </Button>
          </div>
          <Table
            columns={lowStockColumns}
            dataSource={lowStockItems}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Cloud Sync Status Card */}
      {syncStatus?.configured && (
        <Card
          className="mb-6"
          title={
            <div className="flex items-center gap-2">
              <CloudSyncOutlined />
              <span>Multi-Branch Sync Status</span>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={syncing ? <Spin size="small" /> : <SyncOutlined />}
              onClick={handleManualSync}
              loading={syncing}
              disabled={syncStatus?.status?.isSyncing}
            >
              Sync Now
            </Button>
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <div className="mb-2 text-gray-500 text-sm">Sync Status</div>
              {syncStatus?.status?.isSyncing ? (
                <Badge status="processing" text="Syncing..." />
              ) : syncStatus?.status?.lastSyncError ? (
                <Badge status="error" text="Error" />
              ) : (
                <Badge status="success" text="Active" />
              )}
            </Col>
            <Col span={6}>
              <div className="mb-2 text-gray-500 text-sm">Last Sync</div>
              <div>{formatTimeAgo(syncStatus?.status?.lastSyncAt || null)}</div>
            </Col>
            <Col span={6}>
              <div className="mb-2 text-gray-500 text-sm">Pending Changes</div>
              <Badge
                count={syncStatus?.status?.pendingChangesCount || 0}
                showZero
                style={{ backgroundColor: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <div className="mb-2 text-gray-500 text-sm">Sync Interval</div>
              <div>{syncStatus?.status?.syncIntervalMinutes} minutes</div>
            </Col>
          </Row>
          {syncStatus?.status?.lastSyncError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="text-red-700 text-sm">
                <CloseCircleOutlined /> {syncStatus.status.lastSyncError}
              </div>
            </div>
          )}
          <div className="mt-4 text-gray-500 text-sm">
            <ClockCircleOutlined /> Your data syncs automatically every{' '}
            {syncStatus?.status?.syncIntervalMinutes} minutes with other branches.
            Changes are queued when offline and synced when connection is restored.
          </div>
        </Card>
      )}

      {/* Info Card */}
      {!syncStatus?.configured && (
        <Card>
          <h3 className="text-lg font-semibold mb-2">System Information</h3>
          <div className="text-gray-600 text-sm space-y-2">
            <p>
              This is your Jewellery ERP system with local-first architecture.
              All data is stored locally for fast offline access.
            </p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-blue-700 text-sm">
                <CloudSyncOutlined /> Multi-branch sync not configured. Configure Supabase
                credentials in .env to enable cloud synchronization.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
