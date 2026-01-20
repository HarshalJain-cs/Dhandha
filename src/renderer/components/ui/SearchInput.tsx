import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { InputProps } from 'antd';

export interface SearchInputProps extends Omit<InputProps, 'prefix'> {
  onSearch: (searchTerm: string) => void;
  debounceMs?: number;
  value?: string;  // Controlled value
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;  // Controlled onChange
}

/**
 * SearchInput Component
 * Debounced search input with search icon and clear functionality
 * Supports both controlled and uncontrolled modes
 */
const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  debounceMs = 300,
  placeholder = 'Search...',
  value: controlledValue,
  onChange: controlledOnChange,
  ...inputProps
}) => {
  const [internalValue, setInternalValue] = useState('');

  // Use controlled value if provided
  const isControlled = controlledValue !== undefined;
  const searchTerm = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    controlledOnChange?.(e);
  };

  return (
    <Input
      prefix={<SearchOutlined className="text-gray-400" />}
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleChange}
      allowClear
      {...inputProps}
    />
  );
};

export default SearchInput;
