import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Tabs,
  InputNumber,
  DatePicker,
  Progress,
  Popconfirm,
  Badge,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { RootState } from '../store';
import {
  setOrders,
  setCurrentOrder,
  setLoading,
  setError,
  addOrder,
  updateOrder,
} from '../store/slices/karigarSlice';
import type { KarigarOrder, Karigar } from '../store/slices/karigarSlice';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * Karigar Orders Management Page
 */
const KarigarOrders: React.FC = () => {
  const dispatch = useDispatch();
  const { orders, currentOrder, loading } = useSelector((state: RootState) => state.karigar);
  const { user } = useSelector((state: RootState) => state.auth);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [metalTypes, setMetalTypes] = useState<any[]>([]);
  const [selectedKarigar, setSelectedKarigar] = useState<Karigar | null>(null);
  const [orderForm] = Form.useForm();
  const [receiveForm] = Form.useForm();

  useEffect(() => {
    loadOrders();
    loadKarigars();
    loadMetalTypes();
  }, []);

  const loadOrders = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.karigar.getAllOrders({ is_active: true }, undefined);
      if (response.success) {
        dispatch(setOrders({ orders: response.data }));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load orders'));
    }
  };

  const loadKarigars = async () => {
    try {
      const response = await window.electronAPI.karigar.getAll({ is_active: true, status: 'active' }, undefined);
      if (response.success) {
        setKarigars(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load karigars:', err);
    }
  };

  const loadMetalTypes = async () => {
    try {
      const response = await window.electronAPI.metalType.getAll({ is_active: true });
      if (response.success) {
        setMetalTypes(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load metal types:', err);
    }
  };

  const handleOpenOrderModal = () => {
    orderForm.resetFields();
    orderForm.setFieldsValue({
      order_date: dayjs(),
      expected_delivery_date: dayjs().add(7, 'days'),
      order_type: 'new_making',
      priority: 'medium',
      quantity: 1,
      metal_issued_purity: 91.6,
    });
    setShowOrderModal(true);
  };

  const handleCreateOrder = async () => {
    try {
      const values = await orderForm.validateFields();
      dispatch(setLoading(true));

      const orderData = {
        ...values,
        order_date: values.order_date.format('YYYY-MM-DD'),
        expected_delivery_date: values.expected_delivery_date.format('YYYY-MM-DD'),
      };

      const response = await window.electronAPI.karigar.createOrder(orderData, user?.id || 1);

      if (response.success) {
        dispatch(addOrder(response.data));
        message.success('Order created successfully and metal issued');
        setShowOrderModal(false);
        orderForm.resetFields();
        loadOrders();
      } else {
        message.error(response.message || 'Failed to create order');
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      console.error('Form validation failed:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleOpenReceiveModal = (order: KarigarOrder) => {
    dispatch(setCurrentOrder(order));
    receiveForm.resetFields();
    receiveForm.setFieldsValue({
      metal_received_weight: 0,
      metal_received_purity: order.metal_issued_purity,
    });
    setShowReceiveModal(true);
  };

  const handleReceiveMetal = async () => {
    if (!currentOrder) return;

    try {
      const values = await receiveForm.validateFields();
      dispatch(setLoading(true));

      const response = await window.electronAPI.karigar.receiveMetal(
        currentOrder.id,
        values,
        user?.id || 1
      );

      if (response.success) {
        dispatch(updateOrder(response.data));
        message.success('Metal received successfully');
        setShowReceiveModal(false);
        receiveForm.resetFields();
        loadOrders();
      } else {
        message.error(response.message || 'Failed to receive metal');
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      console.error('Form validation failed:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      dispatch(setLoading(true));
      let cancellationReason = undefined;

      if (status === 'cancelled') {
        cancellationReason = await new Promise<string>((resolve) => {
          Modal.confirm({
            title: 'Cancel Order',
            content: (
              <TextArea
                placeholder="Enter cancellation reason"
                onChange={(e) => resolve(e.target.value)}
              />
            ),
            onOk: () => {},
          });
        });
      }

      const response = await window.electronAPI.karigar.updateOrderStatus(
        orderId,
        status,
        user?.id || 1,
        cancellationReason
      );

      if (response.success) {
        dispatch(updateOrder(response.data));
        message.success(`Order ${status} successfully`);
        loadOrders();
      } else {
        message.error(response.message || 'Failed to update order status');
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to update status');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleViewDetails = (order: KarigarOrder) => {
    dispatch(setCurrentOrder(order));
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const getOrderTypeLabel = (orderType: string) => {
    const labels: Record<string, string> = {
      new_making: 'New Making',
      repair: 'Repair',
      stone_setting: 'Stone Setting',
      polishing: 'Polishing',
      designing: 'Designing',
      custom: 'Custom',
    };
    return labels[orderType] || orderType;
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: 'Karigar',
      key: 'karigar',
      width: 150,
      render: (record: KarigarOrder) => record.karigar?.name || 'N/A',
    },
    {
      title: 'Type',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 130,
      render: (orderType: string) => (
        <Tag color="cyan">{getOrderTypeLabel(orderType)}</Tag>
      ),
    },
    {
      title: 'Metal Type',
      dataIndex: 'metal_type',
      key: 'metal_type',
      width: 100,
    },
    {
      title: 'Issued (g)',
      dataIndex: 'metal_issued_weight',
      key: 'metal_issued_weight',
      width: 100,
      render: (weight: number) => weight.toFixed(3),
    },
    {
      title: 'Received (g)',
      dataIndex: 'metal_received_weight',
      key: 'metal_received_weight',
      width: 110,
      render: (weight: number) => (
        <span className={weight > 0 ? 'text-green-600' : ''}>
          {weight.toFixed(3)}
        </span>
      ),
    },
    {
      title: 'Wastage',
      key: 'wastage',
      width: 120,
      render: (record: KarigarOrder) => (
        <Space direction="vertical" size={0}>
          <span className="text-xs text-red-600">{record.wastage_weight.toFixed(3)}g</span>
          <span className="text-xs text-red-600">({record.wastage_percentage.toFixed(2)}%)</span>
        </Space>
      ),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expected_delivery_date',
      key: 'expected_delivery_date',
      width: 130,
      render: (date: string) => dayjs(date).format('DD-MMM-YYYY'),
    },
    {
      title: 'Progress',
      dataIndex: 'progress_percentage',
      key: 'progress_percentage',
      width: 120,
      render: (progress: number) => <Progress percent={progress} size="small" />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Badge status={getStatusColor(status) as any} text={status.toUpperCase()} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: KarigarOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === 'in_progress' && (
            <Button
              type="link"
              size="small"
              icon={<InboxOutlined />}
              onClick={() => handleOpenReceiveModal(record)}
            >
              Receive
            </Button>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="Start Order"
              description="Start this order?"
              onConfirm={() => handleUpdateStatus(record.id, 'in_progress')}
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                Start
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'pending' || record.status === 'in_progress') && (
            <Popconfirm
              title="Cancel Order"
              description="Are you sure you want to cancel this order?"
              onConfirm={() => handleUpdateStatus(record.id, 'cancelled')}
            >
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Karigar Orders</h1>
          <p className="text-gray-600">Manage orders and metal transactions</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenOrderModal}>
          Create Order
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title="Create Karigar Order"
        open={showOrderModal}
        onOk={handleCreateOrder}
        onCancel={() => setShowOrderModal(false)}
        width={800}
        okText="Create Order & Issue Metal"
        confirmLoading={loading}
      >
        <Form form={orderForm} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Karigar"
              name="karigar_id"
              rules={[{ required: true, message: 'Please select karigar' }]}
            >
              <Select
                placeholder="Select karigar"
                showSearch
                optionFilterProp="children"
                onChange={(value) => {
                  const karigar = karigars.find((k) => k.id === value);
                  setSelectedKarigar(karigar || null);
                }}
              >
                {karigars.map((k) => (
                  <Option key={k.id} value={k.id}>
                    {k.name} ({k.karigar_code}) - {k.specialization}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Order Type"
              name="order_type"
              rules={[{ required: true, message: 'Please select order type' }]}
            >
              <Select placeholder="Select order type">
                <Option value="new_making">New Making</Option>
                <Option value="repair">Repair</Option>
                <Option value="stone_setting">Stone Setting</Option>
                <Option value="polishing">Polishing</Option>
                <Option value="designing">Designing</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Order Date"
              name="order_date"
              rules={[{ required: true, message: 'Please select order date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Expected Delivery Date"
              name="expected_delivery_date"
              rules={[{ required: true, message: 'Please select delivery date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Metal Type"
              name="metal_type"
              rules={[{ required: true, message: 'Please select metal type' }]}
            >
              <Select placeholder="Select metal type">
                {metalTypes.map((mt) => (
                  <Option key={mt.id} value={mt.metal_name}>
                    {mt.metal_name} - {mt.purity}%
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Metal Issued Weight (g)"
              name="metal_issued_weight"
              rules={[{ required: true, message: 'Please enter metal weight' }]}
            >
              <InputNumber min={0} step={0.001} precision={3} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Metal Purity (%)"
              name="metal_issued_purity"
              rules={[{ required: true, message: 'Please enter purity' }]}
            >
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Payment Type"
              name="payment_type"
              rules={[{ required: true, message: 'Please select payment type' }]}
            >
              <Select placeholder="Select payment type">
                <Option value="per_piece">Per Piece</Option>
                <Option value="per_gram">Per Gram</Option>
                <Option value="fixed">Fixed</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Payment Rate (₹)"
              name="payment_rate"
              rules={[{ required: true, message: 'Please enter payment rate' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="Labour Charges (₹)"
              name="labour_charges"
              rules={[{ required: true, message: 'Please enter labour charges' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Priority" name="priority">
              <Select placeholder="Select priority">
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter order description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Receive Metal Modal */}
      <Modal
        title="Receive Metal from Karigar"
        open={showReceiveModal}
        onOk={handleReceiveMetal}
        onCancel={() => setShowReceiveModal(false)}
        width={600}
        okText="Receive Metal"
        confirmLoading={loading}
      >
        {currentOrder && (
          <>
            <Descriptions bordered size="small" column={2} className="mb-4">
              <Descriptions.Item label="Order Number">{currentOrder.order_number}</Descriptions.Item>
              <Descriptions.Item label="Karigar">{currentOrder.karigar?.name}</Descriptions.Item>
              <Descriptions.Item label="Metal Issued">
                {currentOrder.metal_issued_weight.toFixed(3)}g
              </Descriptions.Item>
              <Descriptions.Item label="Purity">{currentOrder.metal_issued_purity}%</Descriptions.Item>
            </Descriptions>

            <Form form={receiveForm} layout="vertical">
              <Form.Item
                label="Metal Received Weight (g)"
                name="metal_received_weight"
                rules={[{ required: true, message: 'Please enter received weight' }]}
              >
                <InputNumber
                  min={0}
                  max={currentOrder.metal_issued_weight}
                  step={0.001}
                  precision={3}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Metal Received Purity (%)"
                name="metal_received_purity"
                rules={[{ required: true, message: 'Please enter purity' }]}
              >
                <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Form>

            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Wastage will be automatically calculated based on issued vs received metal.
              </p>
            </div>
          </>
        )}
      </Modal>

      {/* Order Details Modal */}
      <Modal
        title="Order Details"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {currentOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Number">{currentOrder.order_number}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge status={getStatusColor(currentOrder.status) as any} text={currentOrder.status.toUpperCase()} />
              </Descriptions.Item>
              <Descriptions.Item label="Karigar">{currentOrder.karigar?.name}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{currentOrder.karigar?.mobile}</Descriptions.Item>
              <Descriptions.Item label="Order Type">
                {getOrderTypeLabel(currentOrder.order_type)}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={getPriorityColor(currentOrder.priority)}>
                  {currentOrder.priority.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {dayjs(currentOrder.order_date).format('DD-MMM-YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Delivery">
                {dayjs(currentOrder.expected_delivery_date).format('DD-MMM-YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {currentOrder.description}
              </Descriptions.Item>
            </Descriptions>

            <h3 className="text-lg font-semibold mt-6 mb-3">Metal Details</h3>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Metal Type">{currentOrder.metal_type}</Descriptions.Item>
              <Descriptions.Item label="Purity">{currentOrder.metal_issued_purity}%</Descriptions.Item>
              <Descriptions.Item label="Issued Weight">
                {currentOrder.metal_issued_weight.toFixed(3)}g
              </Descriptions.Item>
              <Descriptions.Item label="Received Weight">
                <span className={currentOrder.metal_received_weight > 0 ? 'text-green-600' : ''}>
                  {currentOrder.metal_received_weight.toFixed(3)}g
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Wastage Weight">
                <span className="text-red-600">{currentOrder.wastage_weight.toFixed(3)}g</span>
              </Descriptions.Item>
              <Descriptions.Item label="Wastage %">
                <span className="text-red-600">{currentOrder.wastage_percentage.toFixed(2)}%</span>
              </Descriptions.Item>
            </Descriptions>

            <h3 className="text-lg font-semibold mt-6 mb-3">Payment Details</h3>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Payment Type">{currentOrder.payment_type}</Descriptions.Item>
              <Descriptions.Item label="Payment Rate">₹{currentOrder.payment_rate}</Descriptions.Item>
              <Descriptions.Item label="Labour Charges">
                ₹{currentOrder.labour_charges.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Payment">
                ₹{currentOrder.total_payment.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount Paid">
                ₹{currentOrder.amount_paid.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={currentOrder.payment_status === 'paid' ? 'success' : 'warning'}>
                  {currentOrder.payment_status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {currentOrder.remarks && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3">Remarks</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">{currentOrder.remarks}</p>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KarigarOrders;
