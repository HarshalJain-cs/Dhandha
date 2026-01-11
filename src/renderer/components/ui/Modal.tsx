import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

interface ModalProps extends AntModalProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  size = 'md',
  closeOnOverlayClick = true,
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 400,
    md: 600,
    lg: 800,
    xl: 1000,
  };

  return (
    <AntModal
      width={sizeMap[size]}
      maskClosable={closeOnOverlayClick}
      className={className}
      {...props}
    />
  );
};

export default Modal;
