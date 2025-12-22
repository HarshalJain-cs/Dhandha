import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography, Space, Card, Row, Col, Statistic, Badge, message, Spin } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  GoldOutlined,
  DollarOutlined,
  CloudSyncOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { clearUser } from '../store/slices/authSlice';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

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

/**
 * Dashboard Page Component
 */
const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [syncing, setSyncing] = useState(false);

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
        fetchSyncStatus(); // Refresh status
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
   * Load sync status on mount
   */
  useEffect(() => {
    fetchSyncStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem('token');
    navigate('/login');
  };

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
   * Menu items
   */
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'inventory',
      icon: <GoldOutlined />,
      label: 'Inventory',
      children: [
        { key: 'products', label: 'Products' },
        { key: 'categories', label: 'Categories' },
        { key: 'metal-types', label: 'Metal Types' },
        { key: 'stones', label: 'Stones' },
      ],
    },
    {
      key: 'sales',
      icon: <ShoppingOutlined />,
      label: 'Sales',
      children: [
        { key: 'new-invoice', label: 'New Invoice' },
        { key: 'invoices', label: 'All Invoices' },
        { key: 'old-gold', label: 'Old Gold Exchange' },
      ],
    },
    {
      key: 'customers',
      icon: <TeamOutlined />,
      label: 'Customers',
    },
    {
      key: 'accounting',
      icon: <DollarOutlined />,
      label: 'Accounting',
      children: [
        { key: 'ledgers', label: 'Ledgers' },
        { key: 'payments', label: 'Payments' },
        { key: 'vouchers', label: 'Vouchers' },
      ],
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d4af37',
          fontSize: 20,
          fontWeight: 600,
        }}>
          Jewellery ERP
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
        />
      </Sider>

      <Layout style={{ marginLeft: 240 }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Title level={4} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Space>
            <Space>
              <UserOutlined />
              <Text>{user?.full_name || user?.username}</Text>
            </Space>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Title level={3}>Welcome to Jewellery ERP System</Title>
          <Text type="secondary">
            Complete inventory management for your jewellery business
          </Text>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={0}
                  prefix={<GoldOutlined />}
                  valueStyle={{ color: '#d4af37' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Customers"
                  value={0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Today's Sales"
                  value={0}
                  prefix="₹"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Pending Orders"
                  value={0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 24 }}>
            <Title level={4}>Quick Actions</Title>
            <Space wrap>
              <Button type="primary" icon={<ShoppingOutlined />}>
                New Invoice
              </Button>
              <Button icon={<GoldOutlined />}>
                Add Product
              </Button>
              <Button icon={<TeamOutlined />}>
                Add Customer
              </Button>
              <Button icon={<FileTextOutlined />}>
                View Reports
              </Button>
            </Space>
          </Card>

          {/* Cloud Sync Status Card */}
          {syncStatus?.configured && (
            <Card
              style={{ marginTop: 24 }}
              title={
                <Space>
                  <CloudSyncOutlined />
                  <span>Multi-Branch Sync Status</span>
                </Space>
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
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Sync Status</Text>
                    {syncStatus?.status?.isSyncing ? (
                      <Badge status="processing" text="Syncing..." />
                    ) : syncStatus?.status?.lastSyncError ? (
                      <Badge status="error" text="Error" />
                    ) : (
                      <Badge status="success" text="Active" />
                    )}
                  </Space>
                </Col>
                <Col span={6}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Last Sync</Text>
                    <Text>{formatTimeAgo(syncStatus?.status?.lastSyncAt || null)}</Text>
                  </Space>
                </Col>
                <Col span={6}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Pending Changes</Text>
                    <Badge
                      count={syncStatus?.status?.pendingChangesCount || 0}
                      showZero
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  </Space>
                </Col>
                <Col span={6}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Sync Interval</Text>
                    <Text>{syncStatus?.status?.syncIntervalMinutes} minutes</Text>
                  </Space>
                </Col>
              </Row>
              {syncStatus?.status?.lastSyncError && (
                <div style={{ marginTop: 16, padding: 12, background: '#fff1f0', borderRadius: 4 }}>
                  <Text type="danger">
                    <CloseCircleOutlined /> {syncStatus.status.lastSyncError}
                  </Text>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  <ClockCircleOutlined /> Your data syncs automatically every{' '}
                  {syncStatus?.status?.syncIntervalMinutes} minutes with other branches.
                  Changes are queued when offline and synced when connection is restored.
                </Text>
              </div>
            </Card>
          )}

          <Card style={{ marginTop: 24 }}>
            <Title level={4}>System Information</Title>
            <Space direction="vertical" size="small">
              <Text>
                <strong>User:</strong> {user?.username} ({user?.full_name})
              </Text>
              <Text>
                <strong>Email:</strong> {user?.email}
              </Text>
              <Text>
                <strong>Branch:</strong> {user?.branch_id || 'All Branches'}
              </Text>
              {!syncStatus?.configured && (
                <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
                  <Text type="secondary">
                    <CloudSyncOutlined /> Multi-branch sync not configured. Configure Supabase
                    credentials in .env to enable cloud synchronization.
                  </Text>
                </div>
              )}
              <Text type="secondary" style={{ marginTop: 16, display: 'block' }}>
                This is your Jewellery ERP system with local-first architecture.
                All data is stored locally for fast offline access{syncStatus?.configured && ', with automatic cloud sync for multi-branch coordination'}.
              </Text>
            </Space>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
