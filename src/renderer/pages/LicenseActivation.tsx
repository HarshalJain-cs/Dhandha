import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Alert, Spin, Typography, Divider, Space, Collapse } from 'antd';
import { KeyOutlined, SafetyOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * License Activation Page
 * Shown when no valid license is found
 * Allows users to activate their license key
 */

interface HardwareInfo {
  machineId: string;
  macAddress: string | null;
  cpu: string;
  systemUuid: string | null;
  hostname: string;
}

const LicenseActivation: React.FC = () => {
  const navigate = useNavigate();

  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hardwareId, setHardwareId] = useState<string>('');
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [loadingHardwareInfo, setLoadingHardwareInfo] = useState(false);

  useEffect(() => {
    loadHardwareId();
  }, []);

  const loadHardwareId = async () => {
    try {
      const result = await window.electronAPI.license.getHardwareId();
      if (result.success) {
        setHardwareId(result.hardwareId);
      }
    } catch (error) {
      console.error('Error loading hardware ID:', error);
    }
  };

  const loadHardwareInfo = async () => {
    setLoadingHardwareInfo(true);
    try {
      const result = await window.electronAPI.license.getHardwareInfo();
      if (result.success) {
        setHardwareInfo(result.hardwareInfo);
      }
    } catch (error) {
      console.error('Error loading hardware info:', error);
    } finally {
      setLoadingHardwareInfo(false);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setActivating(true);
    setError(null);

    try {
      const result = await window.electronAPI.license.activate(licenseKey.trim().toUpperCase());

      if (result.success) {
        setSuccess(true);
        setError(null);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.error || 'Activation failed. Please try again.');
        setSuccess(false);
      }
    } catch (error: any) {
      setError(`Activation error: ${error.message}`);
      setSuccess(false);
    } finally {
      setActivating(false);
    }
  };

  const formatLicenseKey = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Add dashes every 4 characters
    let formatted = '';
    for (let i = 0; i < cleaned.length && i < 20; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }

    return formatted;
  };

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value);
    setLicenseKey(formatted);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const formatted = formatLicenseKey(pasted);
    setLicenseKey(formatted);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <KeyOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
          <Title level={2} style={{ marginBottom: 8 }}>
            Activate Your License
          </Title>
          <Text type="secondary">
            Enter your license key to activate Dhandha Jewellery ERP
          </Text>
        </div>

        {success && (
          <Alert
            message="License Activated Successfully!"
            description="Your license has been activated. Redirecting to dashboard..."
            type="success"
            showIcon
            icon={<SafetyOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        {error && (
          <Alert
            message="Activation Failed"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              License Key
            </Text>
            <Input
              size="large"
              placeholder="DHAN-XXXX-XXXX-XXXX-XXXX"
              prefix={<LockOutlined style={{ color: '#999' }} />}
              value={licenseKey}
              onChange={handleLicenseKeyChange}
              onPaste={handlePaste}
              onPressEnter={handleActivate}
              disabled={activating || success}
              maxLength={24} // 20 chars + 4 dashes
              style={{ fontFamily: 'monospace', fontSize: 16 }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              Format: DHAN-XXXX-XXXX-XXXX-XXXX
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleActivate}
            loading={activating}
            disabled={success || !licenseKey}
            icon={<SafetyOutlined />}
          >
            {activating ? 'Activating...' : 'Activate License'}
          </Button>

          <Divider />

          <Collapse
            ghost
            expandIconPosition="end"
            style={{ background: '#f5f5f5', borderRadius: 8 }}
          >
            <Panel
              header={
                <Space>
                  <InfoCircleOutlined />
                  <Text strong>Hardware Information</Text>
                </Space>
              }
              key="1"
              extra={
                !hardwareInfo && (
                  <Button
                    type="link"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadHardwareInfo();
                    }}
                    loading={loadingHardwareInfo}
                  >
                    Load Details
                  </Button>
                )
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <Text strong>Hardware ID:</Text>
                  <Paragraph
                    copyable
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      background: '#fff',
                      padding: '8px 12px',
                      borderRadius: 4,
                      marginTop: 4,
                      wordBreak: 'break-all'
                    }}
                  >
                    {hardwareId || 'Loading...'}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    This ID uniquely identifies your device. Provide this to support if needed.
                  </Text>
                </div>

                {hardwareInfo && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>Machine ID:</strong> {hardwareInfo.machineId}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>MAC Address:</strong> {hardwareInfo.macAddress || 'N/A'}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>CPU:</strong> {hardwareInfo.cpu}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <strong>Hostname:</strong> {hardwareInfo.hostname}
                      </Text>
                    </div>
                  </>
                )}
              </Space>
            </Panel>
          </Collapse>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Don't have a license key?{' '}
              <a href="https://yourwebsite.com/purchase" target="_blank" rel="noopener noreferrer">
                Purchase Now
              </a>
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Need help?{' '}
              <a href="mailto:support@yourcompany.com">
                Contact Support
              </a>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LicenseActivation;
