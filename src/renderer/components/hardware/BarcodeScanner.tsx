import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Button, Tag, Space, Alert, Switch } from 'antd';
import { BarcodeOutlined, ScanOutlined, StopOutlined } from '@ant-design/icons';

/**
 * Barcode Scanner Component
 * Supports keyboard wedge detection and button-triggered scanning
 * Works with both real hardware and mock mode
 */

interface BarcodeScannerProps {
  /** Callback when barcode is scanned */
  onScan: (barcode: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Auto-focus input */
  autoFocus?: boolean;
  /** Show mode toggle (real/mock) */
  showModeToggle?: boolean;
  /** Enable continuous scanning */
  enableContinuous?: boolean;
  /** Custom class name */
  className?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  placeholder = 'Scan barcode or enter manually...',
  disabled = false,
  autoFocus = true,
  showModeToggle = false,
  enableContinuous = false,
  className,
}) => {
  const [value, setValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [mode, setMode] = useState<'real' | 'mock'>('mock');
  const [error, setError] = useState<string | null>(null);

  // Keyboard wedge detection
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
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
   * Handle keyboard wedge input (automatic barcode scanner detection)
   */
  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;

      // Barcode scanners typically send keys very fast (< 50ms between characters)
      // Manual typing is slower (> 100ms)
      if (timeDiff > 100) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        // Check if this is a barcode scan (buffer has data and keys came fast)
        if (bufferRef.current.length > 3) {
          e.preventDefault();
          handleBarcodeScanned(bufferRef.current);
          bufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        // Accumulate characters
        bufferRef.current += e.key;
      }

      lastKeyTimeRef.current = currentTime;
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [disabled, onScan]);

  /**
   * Handle barcode scanned (from wedge or button)
   */
  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      if (!barcode || barcode.trim().length === 0) return;

      setLastScanned(barcode);
      setError(null);
      onScan(barcode);

      // Show success notification
      console.log('Barcode scanned:', barcode);
    },
    [onScan]
  );

  /**
   * Handle manual input submission
   */
  const handleManualSubmit = () => {
    if (value.trim()) {
      handleBarcodeScanned(value.trim());
      setValue('');
    }
  };

  /**
   * Handle scan button click
   */
  const handleScanClick = async () => {
    setScanning(true);
    setError(null);

    try {
      const result = await window.electronAPI.hardware.barcode.scan();

      if (result.success && result.data?.barcode) {
        handleBarcodeScanned(result.data.barcode);
      } else {
        setError(result.message || 'Failed to scan barcode');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to scan barcode');
      console.error('Barcode scan error:', error);
    } finally {
      setScanning(false);
    }
  };

  /**
   * Start continuous scanning
   */
  const handleStartContinuous = async () => {
    setError(null);

    try {
      // Set up event listener for continuous scans
      const cleanup = window.electronAPI.hardware.barcode.onData((barcode: string) => {
        handleBarcodeScanned(barcode);
      });

      cleanupRef.current = cleanup;

      // Start continuous scanning
      const result = await window.electronAPI.hardware.barcode.startContinuous();

      if (result.success) {
        setContinuous(true);
      } else {
        setError(result.message || 'Failed to start continuous scan');
        cleanup();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to start continuous scan');
      console.error('Continuous scan error:', error);
    }
  };

  /**
   * Stop continuous scanning
   */
  const handleStopContinuous = async () => {
    try {
      // Clean up event listener
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // Stop continuous scanning
      await window.electronAPI.hardware.barcode.stopContinuous();
      setContinuous(false);
    } catch (error: any) {
      console.error('Stop continuous scan error:', error);
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (continuous && cleanupRef.current) {
        cleanupRef.current();
        window.electronAPI.hardware.barcode.stopContinuous();
      }
    };
  }, [continuous]);

  return (
    <div className={`barcode-scanner ${className || ''}`}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Mode Toggle */}
        {showModeToggle && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Hardware Mode:</span>
            <Space>
              <Tag color={mode === 'real' ? 'green' : 'blue'}>
                {mode === 'real' ? 'Real Hardware' : 'Mock Mode'}
              </Tag>
              <Switch
                checked={mode === 'real'}
                onChange={handleToggleMode}
                checkedChildren="Real"
                unCheckedChildren="Mock"
              />
            </Space>
          </div>
        )}

        {/* Input and Actions */}
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPressEnter={handleManualSubmit}
            placeholder={placeholder}
            disabled={disabled || scanning || continuous}
            autoFocus={autoFocus}
            prefix={<BarcodeOutlined />}
            size="large"
          />
          <Button
            type="primary"
            icon={<ScanOutlined />}
            onClick={handleScanClick}
            loading={scanning}
            disabled={disabled || continuous}
            size="large"
          >
            Scan
          </Button>
        </Space.Compact>

        {/* Continuous Scan Toggle */}
        {enableContinuous && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Continuous Scanning:</span>
            {!continuous ? (
              <Button
                type="default"
                icon={<ScanOutlined />}
                onClick={handleStartContinuous}
                disabled={disabled}
                size="small"
              >
                Start Continuous
              </Button>
            ) : (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleStopContinuous}
                size="small"
              >
                Stop Continuous
              </Button>
            )}
          </div>
        )}

        {/* Continuous Scanning Indicator */}
        {continuous && (
          <Alert
            message="Continuous Scanning Active"
            description="Scanner is actively listening for barcodes. Scan any barcode near the scanner."
            type="info"
            showIcon
            icon={<ScanOutlined className="animate-pulse" />}
          />
        )}

        {/* Error Message */}
        {error && (
          <Alert
            message="Scan Error"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            showIcon
          />
        )}

        {/* Last Scanned */}
        {lastScanned && !error && (
          <div className="text-sm">
            <span className="text-gray-600">Last scanned: </span>
            <Tag color="success">{lastScanned}</Tag>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500">
          💡 Tip: With keyboard wedge scanners, simply scan - no need to click the button
        </div>
      </Space>
    </div>
  );
};

export default BarcodeScanner;
