import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  GoldOutlined,
  DollarOutlined,
  ShopOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  SwapOutlined,
  UserSwitchOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

/**
 * Sidebar Component
 * Navigation sidebar with menu items
 */
const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Get current selected key based on pathname
   */
  const getSelectedKey = (): string => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/metal')) return 'metal-rates';
    if (path.startsWith('/stones')) return 'stones';
    if (path.startsWith('/customers')) return 'customers';
    if (path.startsWith('/vendors')) return 'vendors';
    if (path.startsWith('/purchase-orders')) return 'purchase-orders';
    if (path.startsWith('/quotations')) return 'quotations';
    if (path.startsWith('/sales-returns')) return 'sales-returns';
    if (path.startsWith('/gold-loans')) return 'gold-loans';
    if (path.startsWith('/karigar/list')) return 'karigar-list';
    if (path.startsWith('/karigar/orders')) return 'karigar-orders';
    if (path.startsWith('/audit-log')) return 'audit-log';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  /**
   * Get default open keys based on current pathname
   */
  const getDefaultOpenKeys = (): string[] => {
    const path = location.pathname;
    const openKeys: string[] = [];

    if (path.startsWith('/products') || path.startsWith('/categories') ||
        path.startsWith('/metal') || path.startsWith('/stones')) {
      openKeys.push('inventory');
    }
    if (path.startsWith('/billing') || path.startsWith('/quotations') ||
        path.startsWith('/sales-returns')) {
      openKeys.push('sales');
    }
    if (path.startsWith('/vendors') || path.startsWith('/purchase-orders')) {
      openKeys.push('procurement');
    }
    if (path.startsWith('/karigar')) {
      openKeys.push('manufacturing');
    }
    if (path.startsWith('/gold-loans') || path.startsWith('/accounting')) {
      openKeys.push('finance');
    }
    if (path.startsWith('/audit-log') || path.startsWith('/settings')) {
      openKeys.push('system');
    }

    return openKeys;
  };

  /**
   * Menu items configuration
   */
  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'inventory',
      icon: <GoldOutlined />,
      label: 'Inventory',
      children: [
        {
          key: 'products',
          label: 'Products',
          onClick: () => navigate('/products'),
        },
        {
          key: 'categories',
          label: 'Categories',
          onClick: () => navigate('/categories'),
        },
        {
          key: 'metal-rates',
          label: 'Metal Rates',
          onClick: () => navigate('/metal-rates'),
        },
        {
          key: 'stones',
          label: 'Stones',
          onClick: () => navigate('/stones'),
        },
      ],
    },
    {
      key: 'sales',
      icon: <ShoppingOutlined />,
      label: 'Sales',
      children: [
        {
          key: 'new-invoice',
          label: 'New Invoice',
          onClick: () => navigate('/billing/new'),
        },
        {
          key: 'invoices',
          label: 'All Invoices',
          onClick: () => navigate('/billing'),
        },
        {
          key: 'quotations',
          label: 'Quotations',
          onClick: () => navigate('/quotations'),
        },
        {
          key: 'sales-returns',
          label: 'Sales Returns',
          onClick: () => navigate('/sales-returns'),
        },
      ],
    },
    {
      key: 'customers',
      icon: <TeamOutlined />,
      label: 'Customers',
      onClick: () => navigate('/customers'),
    },
    {
      key: 'procurement',
      icon: <ShopOutlined />,
      label: 'Procurement',
      children: [
        {
          key: 'vendors',
          label: 'Vendors',
          onClick: () => navigate('/vendors'),
        },
        {
          key: 'purchase-orders',
          label: 'Purchase Orders',
          onClick: () => navigate('/purchase-orders'),
        },
      ],
    },
    {
      key: 'manufacturing',
      icon: <UserSwitchOutlined />,
      label: 'Manufacturing',
      children: [
        {
          key: 'karigar-list',
          label: 'Karigars',
          onClick: () => navigate('/karigar/list'),
        },
        {
          key: 'karigar-orders',
          label: 'Orders',
          onClick: () => navigate('/karigar/orders'),
        },
      ],
    },
    {
      key: 'finance',
      icon: <DollarOutlined />,
      label: 'Finance',
      children: [
        {
          key: 'gold-loans',
          label: 'Gold Loans',
          onClick: () => navigate('/gold-loans'),
        },
        {
          key: 'accounting',
          label: 'Accounting',
          onClick: () => navigate('/accounting/ledger'),
        },
      ],
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      onClick: () => navigate('/reports'),
    },
    {
      key: 'system',
      icon: <SafetyOutlined />,
      label: 'System',
      children: [
        {
          key: 'audit-log',
          label: 'Audit Log',
          onClick: () => navigate('/audit-log'),
        },
        {
          key: 'settings',
          label: 'Settings',
          onClick: () => navigate('/settings'),
        },
      ],
    },
  ];

  return (
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
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d4af37',
          fontSize: 20,
          fontWeight: 600,
        }}
      >
        Jewellery ERP
      </div>

      {/* Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getDefaultOpenKeys()}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;
