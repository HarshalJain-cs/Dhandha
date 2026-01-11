import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

interface ButtonProps extends Omit<AntButtonProps, 'type'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const variantMap = {
    primary: 'primary' as const,
    secondary: 'default' as const,
    danger: 'primary' as const,
    success: 'primary' as const,
    ghost: 'text' as const,
  };

  const customClasses = {
    danger: 'ant-btn-dangerous',
    success: 'bg-green-600 hover:bg-green-700 border-green-600',
  };

  return (
    <AntButton
      type={variantMap[variant]}
      danger={variant === 'danger'}
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${customClasses[variant as keyof typeof customClasses] || ''}
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
