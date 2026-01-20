import React from 'react';
import { Modal } from 'antd';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  type?: 'danger' | 'warning' | 'primary';  // Alias for variant
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant,
  type,
  loading = false,
}) => {
  // Support both 'variant' and 'type' props
  const dialogVariant = variant || type || 'primary';
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>,
        <Button key="confirm" variant={dialogVariant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>,
      ]}
    >
      <p>{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;
