import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  message,
  Space,
  Descriptions,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { addPurchaseOrder } from '../store/slices/purchaseOrderSlice';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Purchase Order Create Page
 * Allows users to create new purchase orders for metal procurement from vendors
 */
const PurchaseOrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [vendors, setVendors] = useState<any[]>([]);
  const [metalTypes, setMetalTypes] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    totalAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
  });

  /**
   * Load initial data on mount
   */
  useEffect(() => {
    loadVendors();
    loadMetalTypes();
  }, []);

  /**
   * Load vendors from backend
   */
  const loadVendors = async () => {
    try {
      const response = await window.electronAPI.vendor.getAll({ is_active: true });
      if (response.success) {
        setVendors(response.data.vendors || response.data);
      } else {
        message.error('Failed to load vendors');
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      message.error('An error occurred while loading vendors');
    }
  };

  /**
   * Load metal types from backend
   */
  const loadMetalTypes = async () => {
    try {
      const response = await window.electronAPI.metalType.getAll();
      if (response.success) {
        setMetalTypes(response.data);
      } else {
        message.error('Failed to load metal types');
      }
    } catch (error) {
      console.error('Error loading metal types:', error);
      message.error('An error occurred while loading metal types');
    }
  };

  /**
   * Handle vendor selection
   */
  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.vendor_id === vendorId);
    setSelectedVendor(vendor);
    calculateTotals();
  };

  /**
   * Calculate GST and totals
   * Intra-state: CGST 1.5% + SGST 1.5%
   * Inter-state: IGST 3%
   */
  const calculateTotals = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    const ratePerGram = form.getFieldValue('rate_per_gram') || 0;
    const totalAmount = quantity * ratePerGram;

    // Default business state (you can make this dynamic from settings)
    const businessState = 'Maharashtra';
    const vendorState = selectedVendor?.state || '';

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (vendorState === businessState) {
      // Intra-state transaction
      cgst = totalAmount * 0.015;
      sgst = totalAmount * 0.015;
    } else {
      // Inter-state transaction
      igst = totalAmount * 0.03;
    }

    const grandTotal = totalAmount + cgst + sgst + igst;

    setTotals({
      totalAmount,
      cgst,
      sgst,
      igst,
      grandTotal,
    });
  };

  /**
   * Handle form value changes
   */
  const handleValuesChange = () => {
    calculateTotals();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: any) => {
    if (!selectedVendor) {
      message.error('Please select a vendor');
      return;
    }

    if (!user) {
      message.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const poData = {
        vendor_id: values.vendor_id,
        metal_type_id: values.metal_type_id,
        quantity: values.quantity,
        rate_per_gram: values.rate_per_gram,
        expected_delivery_date: values.expected_delivery_date.format('YYYY-MM-DD'),
        total_amount: totals.totalAmount,
        cgst_amount: totals.cgst,
        sgst_amount: totals.sgst,
        igst_amount: totals.igst,
        grand_total: totals.grandTotal,
        notes: values.notes || '',
      };

      const response = await window.electronAPI.purchaseOrder.create(poData, user.id);

      if (response.success) {
        message.success('Purchase Order created successfully');
        dispatch(addPurchaseOrder(response.data));
        navigate(`/purchase-orders/${response.data.purchase_order_id}`);
      } else {
        message.error(response.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate('/purchase-orders');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold m-0">Create Purchase Order</h1>
        </Space>
      </div>

      {/* Main Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={{
            quantity: 1000,
            expected_delivery_date: dayjs().add(7, 'days'),
          }}
        >
          <Row gutter={16}>
            {/* Vendor Selection */}
            <Col span={12}>
              <Form.Item
                label="Vendor"
                name="vendor_id"
                rules={[
                  { required: true, message: 'Please select a vendor' },
                ]}
              >
                <Select
                  placeholder="Select vendor"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleVendorChange}
                  filterOption={(input, option: any) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {vendors.map((vendor) => (
                    <Option key={vendor.vendor_id} value={vendor.vendor_id}>
                      {vendor.vendor_name} ({vendor.vendor_code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Metal Type Selection */}
            <Col span={12}>
              <Form.Item
                label="Metal Type"
                name="metal_type_id"
                rules={[
                  { required: true, message: 'Please select metal type' },
                ]}
              >
                <Select
                  placeholder="Select metal type"
                  showSearch
                  optionFilterProp="children"
                  onChange={calculateTotals}
                >
                  {metalTypes.map((metal) => (
                    <Option key={metal.metal_type_id} value={metal.metal_type_id}>
                      {metal.metal_name} ({metal.purity}%)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Vendor Details (if selected) */}
          {selectedVendor && (
            <Card size="small" className="mb-4" style={{ backgroundColor: '#f5f5f5' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Contact Person">
                  {selectedVendor.contact_person}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedVendor.phone}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedVendor.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="State">
                  {selectedVendor.state}
                </Descriptions.Item>
                <Descriptions.Item label="GSTIN">
                  {selectedVendor.gstin || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Balance">
                  ₹{Number(selectedVendor.current_balance || 0).toFixed(2)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          <Row gutter={16}>
            {/* Quantity */}
            <Col span={8}>
              <Form.Item
                label="Quantity (grams)"
                name="quantity"
                rules={[
                  { required: true, message: 'Please enter quantity' },
                  {
                    type: 'number',
                    min: 0.01,
                    message: 'Quantity must be greater than 0',
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter quantity in grams"
                  style={{ width: '100%' }}
                  min={0.01}
                  precision={3}
                  addonAfter="g"
                />
              </Form.Item>
            </Col>

            {/* Rate per Gram */}
            <Col span={8}>
              <Form.Item
                label="Rate per Gram (₹)"
                name="rate_per_gram"
                rules={[
                  { required: true, message: 'Please enter rate per gram' },
                  {
                    type: 'number',
                    min: 1,
                    message: 'Rate must be greater than 0',
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter rate per gram"
                  style={{ width: '100%' }}
                  min={1}
                  precision={2}
                  prefix="₹"
                />
              </Form.Item>
            </Col>

            {/* Expected Delivery Date */}
            <Col span={8}>
              <Form.Item
                label="Expected Delivery Date"
                name="expected_delivery_date"
                rules={[
                  { required: true, message: 'Please select delivery date' },
                  {
                    validator: (_, value) => {
                      if (value && value.isBefore(dayjs(), 'day')) {
                        return Promise.reject('Delivery date cannot be in the past');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Notes */}
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Notes" name="notes">
                <TextArea
                  placeholder="Enter any notes or special instructions"
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Totals Section */}
          <Card
            title={
              <Space>
                <DollarOutlined />
                <span>Order Summary</span>
              </Space>
            }
            size="small"
            style={{ backgroundColor: '#f9f9f9' }}
          >
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Total Amount">
                <strong>₹{totals.totalAmount.toFixed(2)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="GST Type">
                {selectedVendor?.state === 'Maharashtra' ? (
                  <span>Intra-state (CGST + SGST)</span>
                ) : (
                  <span>Inter-state (IGST)</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="CGST (1.5%)">
                ₹{totals.cgst.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="SGST (1.5%)">
                ₹{totals.sgst.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="IGST (3%)">
                ₹{totals.igst.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Total GST">
                <strong>₹{(totals.cgst + totals.sgst + totals.igst).toFixed(2)}</strong>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ textAlign: 'right' }}>
              <h2 className="text-2xl font-bold m-0">
                Grand Total: ₹{totals.grandTotal.toFixed(2)}
              </h2>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end">
            <Space>
              <Button onClick={handleCancel} size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                Create Purchase Order
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PurchaseOrderCreate;
