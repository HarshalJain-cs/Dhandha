import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

type CustomVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'warning' | 'text' | 'link';

interface ButtonProps extends Omit<AntButtonProps, 'type' | 'variant'> {
  variant?: CustomVariant;
  type?: CustomVariant;  // Alias for variant for compatibility
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant,
  type,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  // Support both 'variant' and 'type' props, with variant taking precedence
  const buttonVariant = variant || type || 'primary';

  const typeMap: Record<CustomVariant, AntButtonProps['type']> = {
    primary: 'primary',
    secondary: 'default',
    danger: 'primary',
    success: 'primary',
    ghost: 'text',
    warning: 'primary',
    text: 'text',
    link: 'link',
  };

  const customClasses: Partial<Record<CustomVariant, string>> = {
    danger: 'ant-btn-dangerous',
    success: 'bg-green-600 hover:bg-green-700 border-green-600',
    warning: 'bg-orange-500 hover:bg-orange-600 border-orange-500',
  };

  return (
    <AntButton
      type={typeMap[buttonVariant]}
      danger={buttonVariant === 'danger'}
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${customClasses[buttonVariant as keyof typeof customClasses] || ''}
        ${className}
      `}
      icon={leftIcon}
      {...props}
    >
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </AntButton>
  );
};

export default Button;
