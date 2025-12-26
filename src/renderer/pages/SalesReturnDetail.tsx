import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Descriptions,
  Table,
  Space,
  Tag,
  Divider,
  message,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  StopOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { setCurrentReturn, updateReturn } from '../store/slices/salesReturnSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;

/**
 * Sales Return Detail Page
 * Displays complete details of a sales return and allows approval workflow
 */
const SalesReturnDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [returnData, setReturnData] = useState<any>(null);
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectForm] = Form.useForm();

  /**
   * Load return on mount
   */
  useEffect(() => {
    if (id) {
      loadReturn(id);
    }
  }, [id]);

  /**
   * Load return details
   */
  const loadReturn = async (returnId: string) => {
    setLoading(true);

    try {
      const response = await window.electronAPI.salesReturn.getById(returnId);

      if (response.success) {
        const data = response.data;
        setReturnData(data);
        setOriginalInvoice(data.originalInvoice);
        setReturnItems(data.items || []);

        dispatch(setCurrentReturn(data));
      } else {
        message.error(response.message || 'Failed to load return');
        navigate('/sales-returns');
      }
    } catch (error) {
      console.error('Error loading return:', error);
      message.error('An error occurred while loading return');
      navigate('/sales-returns');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user can approve
   * User cannot approve their own returns
   * Only managers and admins can approve
   */
  const canApprove = (): boolean => {
    if (!returnData || !user) return false;

    // Cannot approve own return
    if (returnData.created_by === user.user_id) return false;

    // Only managers and admins can approve
    if (user.role !== 'manager' && user.role !== 'admin') return false;

    // Only pending returns can be approved
    if (returnData.status !== 'pending') return false;

    return true;
  };

  /**
   * Handle approve
   */
  const handleApprove = () => {
    Modal.confirm({
      title: 'Approve Return?',
      content: 'This will approve the sales return for processing.',
      onOk: async () => {
        try {
          const response = await window.electronAPI.salesReturn.approve(
            returnData.return_id,
            user!.user_id
          );

          if (response.success) {
            message.success('Return approved successfully');
            loadReturn(id!);
          } else {
            message.error(response.message || 'Failed to approve return');
          }
        } catch (error) {
          console.error('Error approving return:', error);
          message.error('An error occurred while approving return');
        }
      },
    });
  };

  /**
   * Handle complete
   */
  const handleComplete = () => {
    Modal.confirm({
      title: 'Mark as Completed?',
      content: 'This will mark the return as completed. Ensure refund/exchange has been processed.',
      onOk: async () => {
        try {
          const response = await window.electronAPI.salesReturn.updateStatus(
            returnData.return_id,
            'completed',
            user!.user_id
          );

          if (response.success) {
            message.success('Return marked as completed');
            loadReturn(id!);
          } else {
            message.error(response.message || 'Failed to complete return');
          }
        } catch (error) {
          console.error('Error completing return:', error);
          message.error('An error occurred while completing return');
        }
      },
    });
  };

  /**
   * Handle reject
   */
  const handleReject = async (values: any) => {
    try {
      const response = await window.electronAPI.salesReturn.updateStatus(
        returnData.return_id,
        'rejected',
        user!.user_id,
        values.reason
      );

      if (response.success) {
        message.success('Return rejected');
        setShowRejectModal(false);
        rejectForm.resetFields();
        loadReturn(id!);
      } else {
        message.error(response.message || 'Failed to reject return');
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      message.error('An error occurred while rejecting return');
    }
  };

  /**
   * Handle print
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Get status tag
   */
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      completed: { color: 'success', label: 'Completed' },
      rejected: { color: 'error', label: 'Rejected' },
    };

    const statusConfig = config[status] || { color: 'default', label: status };
    return <Tag color={statusConfig.color}>{statusConfig.label}</Tag>;
  };

  /**
   * Items table columns
   */
  const itemsColumns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Weight (g)',
      key: 'weight',
      render: (_: any, record: any) => (
        <div className="text-xs">
          <div>Gross: {record.gross_weight}g</div>
          <div>Net: {record.net_weight}g</div>
        </div>
      ),
    },
    {
      title: 'Return Amount',
      dataIndex: 'return_amount',
      key: 'return_amount',
      align: 'right' as const,
      render: (amount: number) => (
        <span className="font-medium">₹{Number(amount).toFixed(2)}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center p-8">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!returnData) {
    return null;
  }

  return (
    <div className="p-6 no-print">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/sales-returns')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold m-0">Sales Return Details</h1>
          {getStatusTag(returnData.status)}
        </Space>

        <Space>
          {canApprove() && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApprove}
            >
              Approve Return
            </Button>
          )}

          {returnData.status === 'approved' && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleComplete}
            >
              Mark as Completed
            </Button>
          )}

          {returnData.status === 'pending' && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => setShowRejectModal(true)}
            >
              Reject
            </Button>
          )}

          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print Receipt
          </Button>
        </Space>
      </div>

      {/* Return Information */}
      <Card title="Return Information" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Return Number" span={1}>
            <strong>{returnData.return_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Return Date" span={1}>
            {dayjs(returnData.return_date).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Return Type" span={1}>
            <Tag color={returnData.return_type === 'return' ? 'blue' : 'purple'}>
              {returnData.return_type === 'return' ? 'Return (Refund)' : 'Exchange'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            {getStatusTag(returnData.status)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Original Invoice */}
      <Card title="Original Invoice" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Invoice Number" span={1}>
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/billing/${originalInvoice?.invoice_id}`)}
              style={{ padding: 0 }}
            >
              <strong>{originalInvoice?.invoice_number || 'N/A'}</strong>
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Invoice Date" span={1}>
            {originalInvoice?.invoice_date
              ? dayjs(originalInvoice.invoice_date).format('DD/MM/YYYY')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Name" span={1}>
            {originalInvoice?.customer_name || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone" span={1}>
            {originalInvoice?.customer_phone || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Invoice Amount" span={2}>
            <strong>
              ₹{Number(originalInvoice?.grand_total || 0).toFixed(2)}
            </strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Returned Items */}
      <Card title="Returned Items" className="mb-4">
        <Table
          columns={itemsColumns}
          dataSource={returnItems}
          rowKey="return_item_id"
          pagination={false}
          size="small"
          locale={{
            emptyText: 'No items found',
          }}
        />

        <Divider />

        <div className="text-right">
          <div className="text-gray-600 mb-1">Total Return Amount</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{Number(returnData.refund_amount).toFixed(2)}
          </div>
        </div>
      </Card>

      {/* Return Reason */}
      <Card title="Reason for Return">
        <div className="p-3 bg-gray-50 rounded">
          {returnData.reason || 'No reason provided'}
        </div>
      </Card>

      {/* Permission Warning (if user cannot approve own return) */}
      {returnData.status === 'pending' &&
        returnData.created_by === user?.user_id && (
          <Card className="mt-4 border-yellow-300 bg-yellow-50">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <div className="font-medium text-yellow-800">
                  Pending Approval
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  You cannot approve your own return. Please wait for a manager or admin to approve this return.
                </div>
              </div>
            </div>
          </Card>
        )}

      {/* Reject Modal */}
      <Modal
        title="Reject Return"
        open={showRejectModal}
        onCancel={() => {
          setShowRejectModal(false);
          rejectForm.resetFields();
        }}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <div className="mb-4 p-3 bg-red-50 rounded text-red-700">
            <strong>Warning:</strong> This action will reject the sales return permanently.
          </div>

          <Form.Item
            label="Reason for Rejection"
            name="reason"
            rules={[
              { required: true, message: 'Please enter reason for rejection' },
              { min: 10, message: 'Reason must be at least 10 characters' },
            ]}
          >
            <TextArea
              placeholder="Enter reason for rejecting this return"
              rows={4}
            />
          </Form.Item>

          <div className="flex justify-end">
            <Space>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  rejectForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                icon={<StopOutlined />}
              >
                Reject Return
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesReturnDetail;
