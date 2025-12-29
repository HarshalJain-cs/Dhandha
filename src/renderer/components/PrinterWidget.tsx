import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Space, Tag, Radio, message, Divider } from 'antd';
import {
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

/**
 * Printer Widget Component
 * Handles thermal printer setup and configuration
 */
const PrinterWidget: React.FC = () => {
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load settings and auto-connect on mount
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load printer settings
   */
  const loadSettings = async () => {
    try {
      const response = await window.electronAPI.printer.getSettings();
      if (response.success && response.data) {
        const settings = response.data;
        setPaperWidth(settings.paper_width || 80);

        // Auto-connect if printer was previously connected
        if (settings.printer_id) {
          setSelectedPrinter(settings.printer_id);
          await autoConnect(settings.printer_id);
        }
      }

      // Find available printers
      await findPrinters();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  /**
   * Auto-connect to last used printer
   */
  const autoConnect = async (printerId: string) => {
    try {
      const response = await window.electronAPI.printer.connect(printerId);
      if (response.success) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Auto-connect failed:', error);
    }
  };

  /**
   * Find available printers
   */
  const findPrinters = async () => {
    setRefreshing(true);
    try {
      const response = await window.electronAPI.printer.findPrinters();
      if (response.success && response.data) {
        setPrinters(response.data);
        message.success(`Found ${response.data.length} printer(s)`);
      } else {
        message.error(response.message || 'No printers found');
        setPrinters([]);
      }
    } catch (error) {
      message.error('Failed to find printers');
      setPrinters([]);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Connect to selected printer
   */
  const handleConnect = async () => {
    if (!selectedPrinter) {
      message.warning('Please select a printer');
      return;
    }

    setLoading(true);
    try {
      const response = await window.electronAPI.printer.connect(selectedPrinter);
      if (response.success) {
        setIsConnected(true);
        message.success('Printer connected successfully');
      } else {
        message.error(response.message || 'Failed to connect to printer');
      }
    } catch (error) {
      console.error('Connect error:', error);
      message.error('An error occurred while connecting to printer');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disconnect from printer
   */
  const handleDisconnect = async () => {
    try {
      const response = await window.electronAPI.printer.disconnect();
      if (response.success) {
        setIsConnected(false);
        message.success('Printer disconnected');
      } else {
        message.error(response.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      message.error('An error occurred while disconnecting');
    }
  };

  /**
   * Handle paper width change
   */
  const handlePaperWidthChange = async (width: 58 | 80) => {
    setPaperWidth(width);
    try {
      const response = await window.electronAPI.printer.setPaperWidth(width);
      if (response.success) {
        message.success(`Paper width set to ${width}mm`);
      }
    } catch (error) {
      console.error('Error setting paper width:', error);
      message.error('Failed to set paper width');
    }
  };

  /**
   * Test print
   */
  const handleTestPrint = async () => {
    setLoading(true);
    try {
      const response = await window.electronAPI.printer.testPrint();
      if (response.success) {
        message.success('Test print sent successfully');
      } else {
        message.error(response.message || 'Test print failed');
      }
    } catch (error) {
      console.error('Test print error:', error);
      message.error('An error occurred while printing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <PrinterOutlined />
          <span>Thermal Printer Setup</span>
        </Space>
      }
      extra={
        <Tag
          icon={isConnected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isConnected ? 'success' : 'error'}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </Tag>
      }
    >
      {!isConnected ? (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Select Printer:</strong>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                style={{ flex: 1 }}
                placeholder="Select a printer"
                value={selectedPrinter}
                onChange={setSelectedPrinter}
                options={printers.map((p) => ({
                  label: `${p.name} (${p.id})`,
                  value: p.id,
                }))}
                notFoundContent={
                  printers.length === 0 ? 'No printers found. Click Refresh.' : 'No printers available'
                }
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={findPrinters}
                loading={refreshing}
                title="Refresh printer list"
              >
                Refresh
              </Button>
            </Space.Compact>
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Paper Width:</strong>
            </div>
            <Radio.Group
              value={paperWidth}
              onChange={(e) => handlePaperWidthChange(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value={80}>80mm (3 inch)</Radio.Button>
              <Radio.Button value={58}>58mm (2 inch)</Radio.Button>
            </Radio.Group>
          </div>

          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handleConnect}
            loading={loading}
            disabled={!selectedPrinter}
            block
          >
            Connect Printer
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Paper Width:</strong>
            </div>
            <Radio.Group
              value={paperWidth}
              onChange={(e) => handlePaperWidthChange(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value={80}>80mm (3 inch)</Radio.Button>
              <Radio.Button value={58}>58mm (2 inch)</Radio.Button>
            </Radio.Group>
          </div>

          <Divider />

          <Space wrap>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handleTestPrint}
              loading={loading}
            >
              Test Print
            </Button>
            <Button danger onClick={handleDisconnect}>
              Disconnect
            </Button>
          </Space>
        </Space>
      )}
    </Card>
  );
};

export default PrinterWidget;
