import React from 'react';
import { AutoComplete as AntAutoComplete, AutoCompleteProps as AntAutoCompleteProps } from 'antd';

export interface AutocompleteOption {
  value: string;
  label: string;
  data?: any;
}

interface AutocompleteProps extends Omit<AntAutoCompleteProps, 'options'> {
  label?: string;
  options: AutocompleteOption[];
  error?: string;
  required?: boolean;
  loading?: boolean;
  onSearch?: (searchTerm: string) => void;
  fullWidth?: boolean;
}

/**
 * Autocomplete Component
 * Wraps Ant Design AutoComplete with standardized interface
 */
const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  options,
  error,
  required,
  loading,
  onSearch,
  fullWidth = true,
  ...antProps
}) => {
  const antOptions = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <AntAutoComplete
        options={antOptions}
        onSearch={onSearch}
        status={error ? 'error' : undefined}
        style={{ width: fullWidth ? '100%' : undefined }}
        {...antProps}
      >
        {loading && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
          </span>
        )}
      </AntAutoComplete>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Autocomplete;
