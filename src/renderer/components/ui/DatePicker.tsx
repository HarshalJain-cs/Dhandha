import React from 'react';
import { DatePicker as AntDatePicker, DatePickerProps as AntDatePickerProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

interface DatePickerProps extends Omit<AntDatePickerProps, 'value' | 'onChange'> {
  label?: string;
  value?: string; // ISO date string
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
}

/**
 * DatePicker Component
 * Wraps Ant Design DatePicker with standardized interface
 */
const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  fullWidth = true,
  ...antProps
}) => {
  const handleChange = (date: Dayjs | null) => {
    if (onChange) {
      onChange(date ? date.toISOString() : '');
    }
  };

  const dayjsValue = value ? dayjs(value) : undefined;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <AntDatePicker
        value={dayjsValue}
        onChange={handleChange}
        status={error ? 'error' : undefined}
        style={{ width: fullWidth ? '100%' : undefined }}
        {...antProps}
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default DatePicker;
