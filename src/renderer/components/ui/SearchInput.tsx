import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { InputProps } from 'antd';

interface SearchInputProps extends Omit<InputProps, 'onChange' | 'prefix'> {
  onSearch: (searchTerm: string) => void;
  debounceMs?: number;
}

/**
 * SearchInput Component
 * Debounced search input with search icon and clear functionality
 */
const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  debounceMs = 300,
  placeholder = 'Search...',
  ...inputProps
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onSearch]);

  return (
    <Input
      prefix={<SearchOutlined className="text-gray-400" />}
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      allowClear
      {...inputProps}
    />
  );
};

export default SearchInput;
