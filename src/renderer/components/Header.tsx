import React from 'react';
import { Layout, Space, Button, Typography, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootState } from '../store';
import { clearUser } from '../store/slices/authSlice';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

/**
 * Header Component
 * Top header with user info and navigation
 */
const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * Get page title from current route
   */
  const getPageTitle = (): string => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/products/new')) return 'Add Product';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/metal-rates')) return 'Metal Rates';
    if (path.startsWith('/stones')) return 'Stones';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/billing/new')) return 'New Invoice';
    if (path.startsWith('/billing')) return 'Invoices';
    if (path.startsWith('/old-gold')) return 'Old Gold Exchange';
    if (path.startsWith('/accounting/ledger')) return 'Ledger';
    if (path.startsWith('/accounting/payments')) return 'Payments';
    if (path.startsWith('/accounting/vouchers')) return 'Vouchers';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Jewellery ERP';
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem('token');
    navigate('/login');
  };

  /**
   * User dropdown menu items
   */
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Page Title */}
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
        {getPageTitle()}
      </h2>

      {/* User Info & Actions */}
      <Space>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Button type="text" style={{ height: 'auto', padding: '8px 12px' }}>
            <Space>
              <UserOutlined />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 500 }}>
                  {user?.full_name || user?.username}
                </div>
                {user?.email && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user.email}
                  </Text>
                )}
              </div>
            </Space>
          </Button>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
