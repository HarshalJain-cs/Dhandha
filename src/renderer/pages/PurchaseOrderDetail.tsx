import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Descriptions,
  Space,
  Tag,
  Divider,
  message,
  Modal,
  Form,
  InputNumber,
  Input,
  Row,
  Col,
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  StopOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { setCurrentPurchaseOrder, updatePurchaseOrder } from '../store/slices/purchaseOrderSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;

/**
 * Purchase Order Detail Page
 * Displays complete details of a purchase order and allows status management
 */
const PurchaseOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [po, setPO] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [metalType, setMetalType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [receiveForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  /**
   * Load purchase order on mount
   */
  useEffect(() => {
    if (id) {
      loadPurchaseOrder(id);
    }
  }, [id]);

  /**
   * Load purchase order details
   */
  const loadPurchaseOrder = async (poId: string) => {
    setLoading(true);

    try {
      const response = await window.electronAPI.purchaseOrder.getById(Number(poId));

      if (response.success) {
        const data = response.data;
        setPO(data);
        setVendor(data.vendor);
        setMetalType(data.metal_type);

        dispatch(setCurrentPurchaseOrder(data));
      } else {
        message.error(response.message || 'Failed to load purchase order');
        navigate('/purchase-orders');
      }
    } catch (error) {
      console.error('Error loading purchase order:', error);
      message.error('An error occurred while loading purchase order');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle receive purchase order
   */
  const handleReceive = async (values: any) => {
    if (!po || !user) return;

    try {
      const response = await window.electronAPI.purchaseOrder.receive(
        po.purchase_order_id,
        values.received_quantity,
        user.id
      );

      if (response.success) {
        message.success('Quantity received successfully');
        setShowReceiveModal(false);
        receiveForm.resetFields();
        loadPurchaseOrder(id!);
      } else {
        message.error(response.message || 'Failed to receive purchase order');
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      message.error('An error occurred while receiving purchase order');
    }
  };

  /**
   * Handle cancel purchase order
   */
  const handleCancel = async (values: any) => {
    if (!po || !user) return;

    try {
      const response = await window.electronAPI.purchaseOrder.cancel(
        po.purchase_order_id,
        values.reason,
        user.id
      );

      if (response.success) {
        message.success('Purchase order cancelled successfully');
        setShowCancelModal(false);
        cancelForm.resetFields();
        loadPurchaseOrder(id!);
      } else {
        message.error(response.message || 'Failed to cancel purchase order');
      }
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      message.error('An error occurred while cancelling purchase order');
    }
  };

  /**
   * Handle print
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Handle edit
   */
  const handleEdit = () => {
    // Navigate to edit page (you can create this later if needed)
    message.info('Edit functionality will be implemented soon');
  };

  /**
   * Get status tag
   */
  const getStatusTag = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'warning', label: 'Pending' },
      partial: { color: 'processing', label: 'Partial' },
      received: { color: 'success', label: 'Received' },
      cancelled: { color: 'default', label: 'Cancelled' },
    };

    const statusConfig = config[status] || { color: 'default', label: status };
    return <Tag color={statusConfig.color}>{statusConfig.label}</Tag>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center p-8">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!po) {
    return null;
  }

  const remainingQuantity = po.quantity - po.received_quantity;
  const isFullyReceived = po.status === 'received';
  const isCancelled = po.status === 'cancelled';
  const canReceive = po.status === 'pending' || po.status === 'partial';
  const canCancel = po.status === 'pending' || po.status === 'partial';
  const canEdit = po.status === 'pending';

  return (
    <div className="p-6 no-print">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/purchase-orders')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold m-0">Purchase Order Details</h1>
          {getStatusTag(po.status)}
        </Space>

        <Space>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              Edit
            </Button>
          )}
          {canReceive && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setShowReceiveModal(true)}
            >
              Mark as Received
            </Button>
          )}
          {canCancel && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => setShowCancelModal(true)}
            >
              Cancel PO
            </Button>
          )}
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </Space>
      </div>

      {/* Purchase Order Details */}
      <Card title="Purchase Order Information" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="PO Number" span={1}>
            <strong>{po.po_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="PO Date" span={1}>
            {dayjs(po.po_date).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Delivery" span={1}>
            {dayjs(po.expected_delivery_date).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            {getStatusTag(po.status)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Vendor Details */}
      <Card title="Vendor Information" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Vendor Name" span={1}>
            <strong>{vendor?.vendor_name || 'N/A'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Vendor Code" span={1}>
            {vendor?.vendor_code || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Contact Person" span={1}>
            {vendor?.contact_person || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone" span={1}>
            {vendor?.phone || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={1}>
            {vendor?.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="GSTIN" span={1}>
            {vendor?.gstin || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {vendor?.address || 'N/A'}, {vendor?.city || ''}, {vendor?.state || ''} - {vendor?.pincode || ''}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Order Details */}
      <Card title="Order Details" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Metal Type" span={1}>
            <strong>{metalType?.metal_name || 'N/A'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Purity" span={1}>
            {metalType?.purity ? `${metalType.purity}%` : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Ordered Quantity" span={1}>
            {po.quantity} grams
          </Descriptions.Item>
          <Descriptions.Item label="Received Quantity" span={1}>
            <span className={po.received_quantity < po.quantity ? 'text-orange-600' : 'text-green-600'}>
              <strong>{po.received_quantity} grams</strong>
            </span>
          </Descriptions.Item>
          {remainingQuantity > 0 && (
            <Descriptions.Item label="Remaining Quantity" span={1}>
              <span className="text-red-600">
                <strong>{remainingQuantity} grams</strong>
              </span>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Rate per Gram" span={1}>
            ₹{Number(po.rate_per_gram).toFixed(2)}
          </Descriptions.Item>
        </Descriptions>

        {po.notes && (
          <>
            <Divider />
            <div>
              <strong>Notes:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded">{po.notes}</div>
            </div>
          </>
        )}
      </Card>

      {/* Financial Details */}
      <Card title="Financial Summary">
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Total Amount">
                ₹{Number(po.total_amount).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="CGST (1.5%)">
                ₹{Number(po.cgst_amount).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="SGST (1.5%)">
                ₹{Number(po.sgst_amount).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="IGST (3%)">
                ₹{Number(po.igst_amount).toFixed(2)}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ backgroundColor: '#f0f9ff', border: '1px solid #0284c7' }}>
              <div className="text-center">
                <div className="text-gray-600 mb-2">Grand Total</div>
                <div className="text-3xl font-bold text-blue-600">
                  ₹{Number(po.grand_total).toFixed(2)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Receive Modal */}
      <Modal
        title="Receive Purchase Order"
        open={showReceiveModal}
        onCancel={() => {
          setShowReceiveModal(false);
          receiveForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={receiveForm}
          layout="vertical"
          onFinish={handleReceive}
          initialValues={{
            received_quantity: remainingQuantity,
          }}
        >
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <div>Ordered Quantity: <strong>{po.quantity} grams</strong></div>
            <div>Already Received: <strong>{po.received_quantity} grams</strong></div>
            <div className="text-orange-600">
              Remaining: <strong>{remainingQuantity} grams</strong>
            </div>
          </div>

          <Form.Item
            label="Quantity to Receive (grams)"
            name="received_quantity"
            rules={[
              { required: true, message: 'Please enter quantity to receive' },
              {
                type: 'number',
                min: 0.01,
                max: remainingQuantity,
                message: `Quantity must be between 0.01 and ${remainingQuantity} grams`,
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={remainingQuantity}
              precision={3}
              addonAfter="grams"
              placeholder="Enter quantity received"
            />
          </Form.Item>

          <div className="flex justify-end">
            <Space>
              <Button
                onClick={() => {
                  setShowReceiveModal(false);
                  receiveForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                Confirm Receipt
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        title="Cancel Purchase Order"
        open={showCancelModal}
        onCancel={() => {
          setShowCancelModal(false);
          cancelForm.resetFields();
        }}
        footer={null}
      >
        <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
          <div className="mb-4 p-3 bg-red-50 rounded text-red-700">
            <strong>Warning:</strong> This action cannot be undone. The purchase order will be marked as cancelled.
          </div>

          <Form.Item
            label="Reason for Cancellation"
            name="reason"
            rules={[
              { required: true, message: 'Please enter reason for cancellation' },
              { min: 10, message: 'Reason must be at least 10 characters' },
            ]}
          >
            <TextArea
              placeholder="Enter reason for cancelling this purchase order"
              rows={4}
            />
          </Form.Item>

          <div className="flex justify-end">
            <Space>
              <Button
                onClick={() => {
                  setShowCancelModal(false);
                  cancelForm.resetFields();
                }}
              >
                Go Back
              </Button>
              <Button type="primary" danger htmlType="submit" icon={<StopOutlined />}>
                Cancel Purchase Order
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseOrderDetail;
