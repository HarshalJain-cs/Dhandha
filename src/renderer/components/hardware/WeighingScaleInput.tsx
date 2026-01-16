import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Button, Space, Alert, Switch, Tag, InputNumber } from 'antd';
import { ScaleOutlined, SyncOutlined, StopOutlined } from '@ant-design/icons';

/**
 * Weighing Scale Input Component
 * Reads weight from scale with real/mock mode support
 * Supports manual entry, tare, and continuous reading
 */

interface WeighingScaleInputProps {
  /** Current weight value */
  value?: number;
  /** Change callback */
  onChange?: (weight: number) => void;
  /** Label */
  label?: string;
  /** Unit (g or kg) */
  unit?: 'g' | 'kg';
  /** Precision (decimal places) */
  precision?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Show tare button */
  showTareButton?: boolean;
  /** Show mode toggle */
  showModeToggle?: boolean;
  /** Enable continuous reading */
  enableContinuous?: boolean;
  /** Required field */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Custom class name */
  className?: string;
}

const WeighingScaleInput: React.FC<WeighingScaleInputProps> = ({
  value,
  onChange,
  label,
  unit = 'g',
  precision = 3,
  disabled = false,
  showTareButton = true,
  showModeToggle = false,
  enableContinuous = false,
  required = false,
  error,
  className,
}) => {
  const [reading, setReading] = useState(false);
  const [taring, setTaring] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [stable, setStable] = useState(true);
  const [mode, setMode] = useState<'real' | 'mock'>('mock');
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

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
   * Handle weight read
   */
  const handleWeightRead = useCallback(
    (weight: number, isStable: boolean) => {
      setLastWeight(weight);
      setStable(isStable);
      setReadError(null);

      // Only update value if stable
      if (isStable) {
        onChange?.(weight);
      }
    },
    [onChange]
  );

  /**
   * Handle read button click
   */
  const handleReadClick = async () => {
    setReading(true);
    setReadError(null);

    try {
      const result = await window.electronAPI.hardware.scale.read();

      if (result.success && result.data) {
        handleWeightRead(result.data.weight, result.data.stable);
      } else {
        setReadError(result.message || 'Failed to read weight');
      }
    } catch (error: any) {
      setReadError(error.message || 'Failed to read weight');
      console.error('Scale read error:', error);
    } finally {
      setReading(false);
    }
  };

  /**
   * Handle tare button click
   */
  const handleTareClick = async () => {
    setTaring(true);
    setReadError(null);

    try {
      const result = await window.electronAPI.hardware.scale.tare();

      if (!result.success) {
        setReadError(result.message || 'Failed to tare scale');
      }
    } catch (error: any) {
      setReadError(error.message || 'Failed to tare scale');
      console.error('Scale tare error:', error);
    } finally {
      setTaring(false);
    }
  };

  /**
   * Start continuous reading
   */
  const handleStartContinuous = async () => {
    setReadError(null);

    try {
      // Set up event listener for continuous reads
      const cleanup = window.electronAPI.hardware.scale.onData(
        (data: { weight: number; stable: boolean }) => {
          handleWeightRead(data.weight, data.stable);
        }
      );

      cleanupRef.current = cleanup;

      // Start continuous reading
      const result = await window.electronAPI.hardware.scale.startContinuous();

      if (result.success) {
        setContinuous(true);
      } else {
        setReadError(result.message || 'Failed to start continuous read');
        cleanup();
      }
    } catch (error: any) {
      setReadError(error.message || 'Failed to start continuous read');
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
      await window.electronAPI.hardware.scale.stopContinuous();
      setContinuous(false);
    } catch (error: any) {
      console.error('Stop continuous read error:', error);
    }
  };

  /**
   * Handle manual input change
   */
  const handleManualChange = (newValue: number | null) => {
    if (newValue !== null) {
      onChange?.(newValue);
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (continuous && cleanupRef.current) {
        cleanupRef.current();
        window.electronAPI.hardware.scale.stopContinuous();
      }
    };
  }, [continuous]);

  return (
    <div className={`weighing-scale-input ${className || ''}`}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {/* Mode Toggle */}
            {showModeToggle && (
              <Space size="small">
                <Tag color={mode === 'real' ? 'green' : 'blue'} style={{ margin: 0 }}>
                  {mode === 'real' ? 'Real' : 'Mock'}
                </Tag>
                <Switch
                  checked={mode === 'real'}
                  onChange={handleToggleMode}
                  size="small"
                />
              </Space>
            )}
          </div>
        )}

        {/* Input and Actions */}
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            value={value}
            onChange={handleManualChange}
            placeholder={`Enter weight in ${unit}...`}
            disabled={disabled || continuous}
            precision={precision}
            min={0}
            style={{ width: '100%' }}
            addonAfter={unit}
            status={error ? 'error' : undefined}
          />
          <Button
            type="primary"
            icon={<ScaleOutlined />}
            onClick={handleReadClick}
            loading={reading}
            disabled={disabled || continuous}
            title="Read from Scale"
          >
            Read
          </Button>
          {showTareButton && (
            <Button
              icon={<SyncOutlined />}
              onClick={handleTareClick}
              loading={taring}
              disabled={disabled || continuous}
              title="Tare (Zero) Scale"
            >
              Tare
            </Button>
          )}
        </Space.Compact>

        {/* Continuous Reading Controls */}
        {enableContinuous && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Continuous Reading:</span>
            {!continuous ? (
              <Button
                type="default"
                size="small"
                icon={<ScaleOutlined />}
                onClick={handleStartContinuous}
                disabled={disabled}
              >
                Start
              </Button>
            ) : (
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={handleStopContinuous}
              >
                Stop
              </Button>
            )}
          </div>
        )}

        {/* Continuous Reading Indicator */}
        {continuous && (
          <Alert
            message={
              <Space>
                <span>Continuous Reading Active</span>
                {!stable && <Tag color="orange">Unstable</Tag>}
                {stable && <Tag color="green">Stable</Tag>}
              </Space>
            }
            description="Scale is continuously sending weight updates. Place item on scale."
            type="info"
            showIcon
            icon={<ScaleOutlined className="animate-pulse" />}
          />
        )}

        {/* Error Message */}
        {(readError || error) && (
          <Alert
            message={error || readError}
            type="error"
            closable={!!readError}
            onClose={() => setReadError(null)}
            showIcon
            size="small"
          />
        )}

        {/* Last Reading Info */}
        {lastWeight !== null && !readError && !error && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Last reading:</span>
            <Space size="small">
              <span className="font-mono">
                {lastWeight.toFixed(precision)} {unit}
              </span>
              {!stable && <Tag color="orange">Unstable</Tag>}
              {stable && <Tag color="green">Stable</Tag>}
            </Space>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500">
          💡 Tip: Tare the scale before weighing to zero out container weight
        </div>
      </Space>
    </div>
  );
};

export default WeighingScaleInput;
