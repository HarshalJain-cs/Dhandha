import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Tag,
  Alert,
  Space,
  Modal,
  Spin,
  Typography,
  Badge,
  Tooltip,
  message
} from 'antd';
import {
  SafetyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  StopOutlined,
  ReloadOutlined,
  LogoutOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

/**
 * License Status Component
 * Displays current license information and allows management
 * Used in Settings page
 */

interface LicenseInfo {
  id: number;
  license_key: string;
  license_type: 'trial' | 'perpetual' | 'subscription';
  status: 'active' | 'grace_period' | 'expired' | 'revoked';
  activation_date: string;
  expiry_date?: string;
  grace_period_days: number;
  offline_grace_remaining_days: number;
  last_verified_at?: string;
  verification_failures: number;
  metadata?: any;
}

const LicenseStatus: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.license.getInfo();
      if (result.success) {
        setLicenseInfo(result.license);
        setError(null);
      } else {
        setError(result.error || 'Failed to load license information');
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await window.electronAPI.license.validate();

      if (result.valid) {
        message.success('License verified successfully!');
        await loadLicenseInfo(); // Reload to get updated info
      } else {
        message.error(result.error || 'License validation failed');
      }
    } catch (error: any) {
      message.error(`Validation error: ${error.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const result = await window.electronAPI.license.deactivate();

      if (result.success) {
        message.success('License deactivated successfully');
        setDeactivateModalVisible(false);
        // Redirect to activation page
        setTimeout(() => {
          navigate('/license-activation');
        }, 1000);
      } else {
        message.error(result.error || 'Deactivation failed');
      }
    } catch (error: any) {
      message.error(`Deactivation error: ${error.message}`);
    } finally {
      setDeactivating(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'success', icon: <CheckCircleOutlined />, text: 'Active' },
      grace_period: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Grace Period' },
      expired: { color: 'error', icon: <StopOutlined />, text: 'Expired' },
      revoked: { color: 'error', icon: <WarningOutlined />, text: 'Revoked' },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.active;

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getLicenseTypeTag = (type: string) => {
    const typeMap = {
      trial: { color: 'blue', text: 'Trial' },
      perpetual: { color: 'green', text: 'Perpetual' },
      subscription: { color: 'purple', text: 'Subscription' },
    };

    const config = typeMap[type as keyof typeof typeMap] || typeMap.perpetual;

    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getDaysRemaining = (expiryDate?: string) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading license information...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="License Information Unavailable"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={loadLicenseInfo}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  if (!licenseInfo) {
    return (
      <Card>
        <Alert
          message="No License Found"
          description="Please activate your license to use this application."
          type="warning"
          showIcon
          action={
            <Button type="primary" onClick={() => navigate('/license-activation')}>
              Activate License
            </Button>
          }
        />
      </Card>
    );
  }

  const daysRemaining = getDaysRemaining(licenseInfo.expiry_date);
  const showExpiryWarning =
    daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <SafetyOutlined style={{ fontSize: 20 }} />
            <Title level={4} style={{ margin: 0 }}>
              License Information
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Verify license with server">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleValidate}
                loading={validating}
              >
                Verify
              </Button>
            </Tooltip>
            <Tooltip title="Deactivate license (for device transfer)">
              <Button
                icon={<LogoutOutlined />}
                onClick={() => setDeactivateModalVisible(true)}
                danger
              >
                Deactivate
              </Button>
            </Tooltip>
          </Space>
        }
      >
        {licenseInfo.status === 'grace_period' && (
          <Alert
            message="Running in Offline Mode"
            description={`Your device hasn't connected to the license server recently. Please connect to the internet to verify your license. ${licenseInfo.offline_grace_remaining_days} days remaining in grace period.`}
            type="warning"
            showIcon
            icon={<ClockCircleOutlined />}
            style={{ marginBottom: 24 }}
            action={
              <Button size="small" type="primary" onClick={handleValidate}>
                Verify Now
              </Button>
            }
          />
        )}

        {showExpiryWarning && (
          <Alert
            message={`License Expiring Soon`}
            description={`Your ${licenseInfo.license_type} license will expire in ${daysRemaining} days. Please renew to continue using the application.`}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {licenseInfo.status === 'expired' && (
          <Alert
            message="License Expired"
            description="Your license has expired. Please renew your license to continue using the application."
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {licenseInfo.status === 'revoked' && (
          <Alert
            message="License Revoked"
            description="This license has been revoked. Please contact support for assistance."
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Descriptions bordered column={2}>
          <Descriptions.Item label="License Key" span={2}>
            <Text copyable style={{ fontFamily: 'monospace' }}>
              {licenseInfo.license_key}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            {getStatusTag(licenseInfo.status)}
          </Descriptions.Item>

          <Descriptions.Item label="Type">
            {getLicenseTypeTag(licenseInfo.license_type)}
          </Descriptions.Item>

          <Descriptions.Item label="Activation Date">
            {formatDate(licenseInfo.activation_date)}
          </Descriptions.Item>

          {licenseInfo.expiry_date && (
            <Descriptions.Item label="Expiry Date">
              <Space>
                {formatDate(licenseInfo.expiry_date)}
                {daysRemaining !== null && daysRemaining > 0 && (
                  <Badge
                    count={`${daysRemaining} days`}
                    style={{ backgroundColor: daysRemaining <= 7 ? '#ff4d4f' : '#52c41a' }}
                  />
                )}
              </Space>
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Last Verified">
            {licenseInfo.last_verified_at ? (
              formatDate(licenseInfo.last_verified_at)
            ) : (
              <Text type="secondary">Never (offline activation)</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Grace Period">
            {licenseInfo.grace_period_days} days
            {licenseInfo.status === 'grace_period' && (
              <Text type="warning" style={{ marginLeft: 8 }}>
                ({licenseInfo.offline_grace_remaining_days} days remaining)
              </Text>
            )}
          </Descriptions.Item>

          {licenseInfo.verification_failures > 0 && (
            <Descriptions.Item label="Verification Failures" span={2}>
              <Text type="danger">{licenseInfo.verification_failures} consecutive failures</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Space direction="vertical" size="small">
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <Text strong>About Your License</Text>
            </Space>
            <Paragraph style={{ margin: 0, fontSize: 12 }} type="secondary">
              This license is bound to your device's hardware. If you need to transfer your license
              to another device, please deactivate it first. Contact support for assistance.
            </Paragraph>
          </Space>
        </div>
      </Card>

      {/* Deactivation Confirmation Modal */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>Deactivate License</span>
          </Space>
        }
        open={deactivateModalVisible}
        onOk={handleDeactivate}
        onCancel={() => setDeactivateModalVisible(false)}
        confirmLoading={deactivating}
        okText="Deactivate"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            message="Warning"
            description="This action will deactivate your license on this device. You will need to activate it again to use the application."
            type="warning"
            showIcon
          />
          <div>
            <Text>Are you sure you want to deactivate your license?</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              This is typically done when transferring your license to another device.
            </Text>
          </div>
        </Space>
      </Modal>
    </Space>
  );
};

export default LicenseStatus;
