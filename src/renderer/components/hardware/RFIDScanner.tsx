import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Tag, Space, Alert, Switch, Progress } from 'antd';
import { WifiOutlined, ScanOutlined, StopOutlined } from '@ant-design/icons';

/**
 * RFID Scanner Component
 * Reads RFID tags with real/mock mode support
 */

interface RFIDScannerProps {
  /** Callback when RFID tag is read */
  onRead: (tag: string, rssi: number) => void;
  /** Callback for errors */
  onError?: (error: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show mode toggle */
  showModeToggle?: boolean;
  /** Enable continuous reading */
  enableContinuous?: boolean;
  /** Custom class name */
  className?: string;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({
  onRead,
  onError,
  disabled = false,
  showModeToggle = false,
  enableContinuous = false,
  className,
}) => {
  const [reading, setReading] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [lastTag, setLastTag] = useState<string | null>(null);
  const [lastRSSI, setLastRSSI] = useState<number | null>(null);
  const [mode, setMode] = useState<'real' | 'mock'>('mock');
  const [error, setError] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  /**
   * Load settings on mount
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load hardware settings
   */
  const loadSettings = async () => {
    try {
      const result = await window.electronAPI.hardware.getSettings();
      if (result.success) {
        setMode(result.data.mode);
      }
    } catch (error) {
      console.error('Failed to load hardware settings:', error);
    }
  };

  /**
   * Toggle hardware mode
   */
  const handleToggleMode = async () => {
    const newMode = mode === 'real' ? 'mock' : 'real';
    try {
      const result = await window.electronAPI.hardware.toggleMode(newMode);
      if (result.success) {
        setMode(newMode);
      }
    } catch (error) {
      console.error('Failed to toggle mode:', error);
    }
  };

  /**
   * Handle RFID tag read
   */
  const handleTagRead = useCallback(
    (tag: string, rssi: number) => {
      setLastTag(tag);
      setLastRSSI(rssi);
      setError(null);
      onRead(tag, rssi);
    },
    [onRead]
  );

  /**
   * Handle read button click
   */
  const handleReadClick = async () => {
    setReading(true);
    setError(null);

    try {
      const result = await window.electronAPI.hardware.rfid.read();

      if (result.success && result.data) {
        handleTagRead(result.data.tag, result.data.rssi);
      } else {
        const errorMsg = result.message || 'Failed to read RFID tag';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to read RFID tag';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('RFID read error:', error);
    } finally {
      setReading(false);
    }
  };

  /**
   * Start continuous reading
   */
  const handleStartContinuous = async () => {
    setError(null);

    try {
      // Set up event listener for continuous reads
      const cleanup = window.electronAPI.hardware.rfid.onData(
        (data: { tag: string; rssi: number }) => {
          handleTagRead(data.tag, data.rssi);
        }
      );

      cleanupRef.current = cleanup;

      // Start continuous reading
      const result = await window.electronAPI.hardware.rfid.startContinuous();

      if (result.success) {
        setContinuous(true);
      } else {
        const errorMsg = result.message || 'Failed to start continuous read';
        setError(errorMsg);
        onError?.(errorMsg);
        cleanup();
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to start continuous read';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Continuous read error:', error);
    }
  };

  /**
   * Stop continuous reading
   */
  const handleStopContinuous = async () => {
    try {
      // Clean up event listener
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Stop continuous reading
      await window.electronAPI.hardware.rfid.stopContinuous();
      setContinuous(false);
    } catch (error: any) {
      console.error('Stop continuous read error:', error);
    }
  };

  /**
   * Get signal strength color
   */
  const getSignalStrengthColor = (rssi: number): string => {
    if (rssi > -50) return 'green';
    if (rssi > -60) return 'lime';
    if (rssi > -70) return 'orange';
    return 'red';
  };

  /**
   * Get signal strength percentage
   */
  const getSignalStrengthPercent = (rssi: number): number => {
    // RSSI typically ranges from -40 (strong) to -80 (weak)
    // Convert to 0-100 percentage
    const percent = ((rssi + 80) / 40) * 100;
    return Math.max(0, Math.min(100, percent));
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (continuous && cleanupRef.current) {
        cleanupRef.current();
        window.electronAPI.hardware.rfid.stopContinuous();
      }
    };
  }, [continuous]);

  return (
    <Card
      className={`rfid-scanner ${className || ''}`}
      title={
        <Space>
          <WifiOutlined />
          <span>RFID Scanner</span>
        </Space>
      }
      extra={
        showModeToggle && (
          <Space>
            <Tag color={mode === 'real' ? 'green' : 'blue'}>
              {mode === 'real' ? 'Real' : 'Mock'}
            </Tag>
            <Switch
              checked={mode === 'real'}
              onChange={handleToggleMode}
              size="small"
            />
          </Space>
        )
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Read Actions */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          {!continuous ? (
            <Button
              type="primary"
              size="large"
              icon={<ScanOutlined />}
              onClick={handleReadClick}
              loading={reading}
              disabled={disabled}
            >
              Read RFID Tag
            </Button>
          ) : (
            <Button
              danger
              size="large"
              icon={<StopOutlined />}
              onClick={handleStopContinuous}
            >
              Stop Reading
            </Button>
          )}

          {enableContinuous && !continuous && !reading && (
            <Button
              type="default"
              size="large"
              icon={<ScanOutlined />}
              onClick={handleStartContinuous}
              disabled={disabled}
            >
              Continuous
            </Button>
          )}
        </Space>

        {/* Continuous Reading Indicator */}
        {continuous && (
          <Alert
            message="Continuous Reading Active"
            description="Scanner is actively reading RFID tags. Hold tags near the reader antenna."
            type="info"
            showIcon
            icon={<WifiOutlined className="animate-pulse" />}
          />
        )}

        {/* Error Message */}
        {error && (
          <Alert
            message="Read Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            showIcon
          />
        )}

        {/* Last Read Tag */}
        {lastTag && !error && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">Last Read Tag:</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">EPC:</span>
                <Tag color="blue" className="font-mono text-xs">
                  {lastTag}
                </Tag>
              </div>

              {lastRSSI !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Signal Strength:</span>
                    <Tag color={getSignalStrengthColor(lastRSSI)}>
                      {lastRSSI} dBm
                    </Tag>
                  </div>

                  <Progress
                    percent={getSignalStrengthPercent(lastRSSI)}
                    strokeColor={getSignalStrengthColor(lastRSSI)}
                    size="small"
                    showInfo={false}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center">
          💡 Tip: Hold RFID tag close to the reader antenna for best results
        </div>
      </Space>
    </Card>
  );
};

export default RFIDScanner;
