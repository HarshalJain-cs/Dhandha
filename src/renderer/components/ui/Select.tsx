import React from 'react';
import { Select as AntSelect, SelectProps as AntSelectProps } from 'antd';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends AntSelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  required?: boolean;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  required = false,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <AntSelect
        options={options}
        status={error ? 'error' : undefined}
        className={`${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      />

      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default Select;
