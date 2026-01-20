import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';

const { TextArea } = AntInput;

interface InputProps extends AntInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  rows?: number;  // For textarea support
}

const Input = React.forwardRef<any, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      fullWidth = true,
      className = '',
      rows,
      type,
      ...props
    },
    ref
  ) => {
    const isTextArea = type === 'textarea' || rows !== undefined;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {isTextArea ? (
          <TextArea
            ref={ref}
            status={error ? 'error' : undefined}
            className={className}
            rows={rows || 4}
            {...(props as any)}
          />
        ) : (
          <AntInput
            ref={ref}
            status={error ? 'error' : undefined}
            className={className}
            type={type}
            {...props}
          />
        )}

        {error && <div className="mt-1 text-sm text-red-600">{error}</div>}

        {helperText && !error && (
          <div className="mt-1 text-sm text-gray-500">{helperText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
