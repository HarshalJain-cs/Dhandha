import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Form,
  InputNumber,
  Modal,
  Space,
  Divider,
  Tag,
  message,
  Row,
  Col,
  Descriptions,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ScanOutlined,
  SearchOutlined,
  SaveOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * Invoice Item Interface
 */
interface InvoiceLineItem {
  key: string;
  product_id: number;
  product_code: string;
  product_name: string;
  category_name: string;
  metal_type_name: string;
  gross_weight: number;
  net_weight: number;
  purity: number;
  metal_rate: number;
  quantity: number;
  making_charge_type: string;
  making_charge_rate: number;
  making_charge_amount: number;
  wastage_percentage: number;
  wastage_amount: number;
  stone_amount: number;
  metal_amount: number;
  subtotal: number;
  metal_gst: number;
  making_gst: number;
  total_gst: number;
  line_total: number;
  discount_percentage: number;
  discount_amount: number;
}

/**
 * Invoice Create Page
 */
const InvoiceCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const barcodeInputRef = useRef<any>(null);

  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchText, setCustomerSearchText] = useState('');

  // Product state
  const [products, setProducts] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Metal rates
  const [metalRates, setMetalRates] = useState<any[]>([]);
  const [selectedMetalRate, setSelectedMetalRate] = useState<number>(0);

  // Old gold state
  const [oldGoldData, setOldGoldData] = useState<any>(null);
  const [showOldGoldModal, setShowOldGoldModal] = useState(false);

  // Payment state
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Invoice data
  const [invoiceType, setInvoiceType] = useState<'sale' | 'estimate'>('sale');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [notes, setNotes] = useState('');

  // Totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    metalAmount: 0,
    makingCharges: 0,
    stoneAmount: 0,
    wastageAmount: 0,
    metalGST: 0,
    makingGST: 0,
    totalGST: 0,
    discountAmount: 0,
    oldGoldAmount: 0,
    grandTotal: 0,
    amountPaid: 0,
    balanceDue: 0,
  });

  const [loading, setLoading] = useState(false);

  /**
   * Load initial data
   */
  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadMetalRates();
  }, []);

  /**
   * Calculate totals whenever line items, discount, old gold, or payments change
   */
  useEffect(() => {
    calculateTotals();
  }, [lineItems, discountPercentage, oldGoldData, payments]);

  /**
   * Load customers
   */
  const loadCustomers = async () => {
    try {
      const response = await window.electronAPI.customer.getAll({ is_active: true });
      if (response.success) {
        setCustomers(response.data.customers || response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  /**
   * Load products
   */
  const loadProducts = async () => {
    try {
      const response = await window.electronAPI.product.getAll({ is_active: true });
      if (response.success) {
        setProducts(response.data.products || response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  /**
   * Load metal rates
   */
  const loadMetalRates = async () => {
    try {
      const response = await window.electronAPI.metalType.getAll();
      if (response.success) {
        setMetalRates(response.data);
        // Set default metal rate (e.g., Gold 22K)
        const gold22k = response.data.find((m: any) => m.name.includes('22'));
        if (gold22k) {
          setSelectedMetalRate(gold22k.current_rate_per_gram);
        }
      }
    } catch (error) {
      console.error('Error loading metal rates:', error);
    }
  };

  /**
   * Handle barcode scan
   */
  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) return;

    try {
      // Search product by barcode
      const response = await window.electronAPI.product.getAll({
        is_active: true,
        barcode: barcodeInput,
      });

      if (response.success && response.data.length > 0) {
        const product = response.data[0];
        addProductToInvoice(product);
        setBarcodeInput('');
        message.success(`Product ${product.product_name} added`);
      } else {
        message.warning('Product not found with this barcode');
      }
    } catch (error) {
      message.error('Error scanning barcode');
    }
  };

  /**
   * Add product to invoice
   */
  const addProductToInvoice = (product: any) => {
    if (!selectedCustomer) {
      message.warning('Please select a customer first');
      return;
    }

    if (!selectedMetalRate || selectedMetalRate === 0) {
      message.warning('Please select a metal rate');
      return;
    }

    // Check if product already exists in line items
    const existingItem = lineItems.find((item) => item.product_id === product.id);
    if (existingItem) {
      message.warning('Product already added. Please update quantity in the table.');
      return;
    }

    // Calculate amounts
    const metalAmount = product.net_weight * selectedMetalRate;
    const wastageAmount = (product.net_weight * product.wastage_percentage / 100) * selectedMetalRate;

    let makingChargeAmount = 0;
    switch (product.making_charge_type) {
      case 'per_gram':
        makingChargeAmount = product.making_charge * product.net_weight;
        break;
      case 'percentage':
        makingChargeAmount = (metalAmount * product.making_charge) / 100;
        break;
      case 'fixed':
        makingChargeAmount = product.making_charge;
        break;
      case 'slab':
        makingChargeAmount = product.making_charge;
        break;
    }

    const subtotal = metalAmount + wastageAmount + makingChargeAmount;

    // Calculate GST (assume intra-state for now)
    const metalGSTRate = 3; // 3% for metal
    const makingGSTRate = 5; // 5% for making charges

    const metalGST = ((metalAmount + wastageAmount) * metalGSTRate) / 100;
    const makingGST = (makingChargeAmount * makingGSTRate) / 100;
    const totalGST = metalGST + makingGST;

    const lineTotal = subtotal + totalGST;

    const lineItem: InvoiceLineItem = {
      key: `${product.id}-${Date.now()}`,
      product_id: product.id,
      product_code: product.product_code,
      product_name: product.product_name,
      category_name: product.category?.name || '',
      metal_type_name: product.metalType?.name || '',
      gross_weight: product.gross_weight,
      net_weight: product.net_weight,
      purity: product.purity,
      metal_rate: selectedMetalRate,
      quantity: 1,
      making_charge_type: product.making_charge_type,
      making_charge_rate: product.making_charge,
      making_charge_amount: makingChargeAmount,
      wastage_percentage: product.wastage_percentage,
      wastage_amount: wastageAmount,
      stone_amount: 0,
      metal_amount: metalAmount,
      subtotal,
      metal_gst: metalGST,
      making_gst: makingGST,
      total_gst: totalGST,
      line_total: lineTotal,
      discount_percentage: 0,
      discount_amount: 0,
    };

    setLineItems([...lineItems, lineItem]);
  };

  /**
   * Remove line item
   */
  const removeLineItem = (key: string) => {
    setLineItems(lineItems.filter((item) => item.key !== key));
  };

  /**
   * Calculate totals
   */
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const metalAmount = lineItems.reduce((sum, item) => sum + item.metal_amount, 0);
    const makingCharges = lineItems.reduce((sum, item) => sum + item.making_charge_amount, 0);
    const stoneAmount = lineItems.reduce((sum, item) => sum + item.stone_amount, 0);
    const wastageAmount = lineItems.reduce((sum, item) => sum + item.wastage_amount, 0);
    const metalGST = lineItems.reduce((sum, item) => sum + item.metal_gst, 0);
    const makingGST = lineItems.reduce((sum, item) => sum + item.making_gst, 0);
    const totalGST = metalGST + makingGST;

    const discountAmount = (subtotal * discountPercentage) / 100;
    const oldGoldAmount = oldGoldData?.final_value || 0;
    const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const grandTotal = Math.round(subtotal + totalGST - discountAmount - oldGoldAmount);
    const balanceDue = grandTotal - amountPaid;

    setTotals({
      subtotal,
      metalAmount,
      makingCharges,
      stoneAmount,
      wastageAmount,
      metalGST,
      makingGST,
      totalGST,
      discountAmount,
      oldGoldAmount,
      grandTotal,
      amountPaid,
      balanceDue,
    });
  };

  /**
   * Add old gold
   */
  const handleAddOldGold = (values: any) => {
    const netWeight = values.gross_weight - (values.stone_weight || 0);
    const fineWeight = (netWeight * values.tested_purity) / 100;
    const metalValue = fineWeight * values.current_rate;
    const meltingLossWeight = (fineWeight * (values.melting_loss_percentage || 0.5)) / 100;
    const finalWeight = fineWeight - meltingLossWeight;
    const finalValue = finalWeight * values.current_rate;

    setOldGoldData({
      ...values,
      net_weight: netWeight,
      fine_weight: fineWeight,
      metal_value: metalValue,
      melting_loss_weight: meltingLossWeight,
      final_weight: finalWeight,
      final_value: finalValue,
    });

    setShowOldGoldModal(false);
    message.success('Old gold added successfully');
  };

  /**
   * Add payment
   */
  const handleAddPayment = (values: any) => {
    setPayments([...payments, { ...values, id: Date.now() }]);
    setShowPaymentModal(false);
    message.success('Payment added successfully');
  };

  /**
   * Save invoice
   */
  const handleSaveInvoice = async () => {
    if (!selectedCustomer) {
      message.error('Please select a customer');
      return;
    }

    if (lineItems.length === 0) {
      message.error('Please add at least one product');
      return;
    }

    setLoading(true);

    try {
      // Prepare invoice items
      const items = lineItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        metal_rate: item.metal_rate,
        discount_percentage: item.discount_percentage,
      }));

      // Prepare invoice data
      const invoiceData = {
        invoice_type: invoiceType,
        discount_percentage: discountPercentage,
        notes,
      };

      const response = await window.electronAPI.invoice.create(
        selectedCustomer.id,
        items,
        oldGoldData,
        payments,
        invoiceData,
        user?.id || 1
      );

      if (response.success) {
        message.success('Invoice created successfully');
        navigate(`/billing/${response.data.invoice_id}`);
      } else {
        message.error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      message.error('An error occurred while creating invoice');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Line items table columns
   */
  const columns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text: string, record: InvoiceLineItem) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Weight (g)',
      key: 'weight',
      render: (_: any, record: InvoiceLineItem) => (
        <div className="text-xs">
          <div>Gross: {record.gross_weight}g</div>
          <div>Net: {record.net_weight}g</div>
        </div>
      ),
    },
    {
      title: 'Purity',
      dataIndex: 'purity',
      key: 'purity',
      render: (purity: number) => `${purity}%`,
    },
    {
      title: 'Rate/g',
      dataIndex: 'metal_rate',
      key: 'metal_rate',
      render: (rate: number) => `₹${rate.toFixed(2)}`,
    },
    {
      title: 'Metal Amt',
      dataIndex: 'metal_amount',
      key: 'metal_amount',
      render: (amt: number) => `₹${amt.toFixed(2)}`,
    },
    {
      title: 'Making',
      dataIndex: 'making_charge_amount',
      key: 'making_charge_amount',
      render: (amt: number) => `₹${amt.toFixed(2)}`,
    },
    {
      title: 'GST',
      dataIndex: 'total_gst',
      key: 'total_gst',
      render: (gst: number) => `₹${gst.toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'line_total',
      key: 'line_total',
      render: (total: number) => (
        <span className="font-semibold">₹{total.toFixed(2)}</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: InvoiceLineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLineItem(record.key)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Invoice</h1>
        <Space>
          <Select
            value={invoiceType}
            onChange={setInvoiceType}
            style={{ width: 120 }}
          >
            <Option value="sale">Sale</Option>
            <Option value="estimate">Estimate</Option>
          </Select>
        </Space>
      </div>

      <Row gutter={16}>
        {/* Left Column - Customer & Products */}
        <Col span={16}>
          {/* Customer Selection */}
          <Card className="mb-4" title="Customer Details">
            <Select
              showSearch
              placeholder="Search customer by name or mobile"
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map((c) => ({
                label: `${c.first_name} ${c.last_name || ''} - ${c.mobile}`,
                value: c.id,
              }))}
              onChange={(value) => {
                const customer = customers.find((c) => c.id === value);
                setSelectedCustomer(customer);
              }}
            />

            {selectedCustomer && (
              <Descriptions size="small" className="mt-3" column={2}>
                <Descriptions.Item label="Name">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </Descriptions.Item>
                <Descriptions.Item label="Mobile">
                  {selectedCustomer.mobile}
                </Descriptions.Item>
                <Descriptions.Item label="GSTIN">
                  {selectedCustomer.gstin || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="State">
                  {selectedCustomer.state || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          {/* Barcode Scanner */}
          <Card className="mb-4" title="Add Products">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                ref={barcodeInputRef}
                placeholder="Scan or enter barcode"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onPressEnter={handleBarcodeScan}
                prefix={<ScanOutlined />}
              />
              <Button type="primary" onClick={handleBarcodeScan}>
                Add
              </Button>
            </Space.Compact>

            <div className="mt-3">
              <Select
                placeholder="Select metal rate"
                style={{ width: 200 }}
                value={selectedMetalRate}
                onChange={setSelectedMetalRate}
              >
                {metalRates.map((rate) => (
                  <Option key={rate.id} value={rate.current_rate_per_gram}>
                    {rate.name} - ₹{rate.current_rate_per_gram}/g
                  </Option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Line Items Table */}
          <Card title="Invoice Items">
            <Table
              dataSource={lineItems}
              columns={columns}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>

        {/* Right Column - Summary */}
        <Col span={8}>
          <Card title="Invoice Summary" className="mb-4">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Subtotal">
                ₹{totals.subtotal.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Metal Amount">
                ₹{totals.metalAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Making Charges">
                ₹{totals.makingCharges.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="GST (Metal)">
                ₹{totals.metalGST.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="GST (Making)">
                ₹{totals.makingGST.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Total GST">
                <span className="font-semibold">₹{totals.totalGST.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className="mb-3">
              <label className="block text-sm mb-1">Discount %</label>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                value={discountPercentage}
                onChange={(val) => setDiscountPercentage(val || 0)}
              />
              {discountPercentage > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Discount: -₹{totals.discountAmount.toFixed(2)}
                </div>
              )}
            </div>

            {oldGoldData && (
              <div className="mb-3 p-2 bg-yellow-50 rounded">
                <div className="flex justify-between text-sm">
                  <span>Old Gold ({oldGoldData.final_weight}g)</span>
                  <span className="font-medium">
                    -₹{totals.oldGoldAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Divider />

            <Descriptions column={1}>
              <Descriptions.Item label={<strong>Grand Total</strong>}>
                <span className="text-xl font-bold text-green-600">
                  ₹{totals.grandTotal.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Amount Paid">
                ₹{totals.amountPaid.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label={<strong>Balance Due</strong>}>
                <span className="text-lg font-semibold text-red-600">
                  ₹{totals.balanceDue.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                onClick={() => setShowOldGoldModal(true)}
                icon={<PlusOutlined />}
              >
                {oldGoldData ? 'Update Old Gold' : 'Add Old Gold'}
              </Button>
              <Button
                block
                onClick={() => setShowPaymentModal(true)}
                icon={<PlusOutlined />}
              >
                Add Payment ({payments.length})
              </Button>
            </Space>

            <Divider />

            <TextArea
              placeholder="Invoice notes..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                block
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSaveInvoice}
                loading={loading}
                disabled={!selectedCustomer || lineItems.length === 0}
              >
                Save Invoice
              </Button>
              <Button block onClick={() => navigate('/billing')}>
                Cancel
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Old Gold Modal */}
      <Modal
        title="Add Old Gold"
        open={showOldGoldModal}
        onCancel={() => setShowOldGoldModal(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={handleAddOldGold}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Metal Type" name="metal_type" rules={[{ required: true }]}>
                <Select>
                  <Option value="Gold">Gold</Option>
                  <Option value="Silver">Silver</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Test Method" name="test_method" rules={[{ required: true }]}>
                <Select>
                  <Option value="touchstone">Touchstone</Option>
                  <Option value="acid_test">Acid Test</Option>
                  <Option value="xrf_machine">XRF Machine</Option>
                  <Option value="fire_assay">Fire Assay</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Gross Weight (g)" name="gross_weight" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.001} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Stone Weight (g)" name="stone_weight">
                <InputNumber style={{ width: '100%' }} min={0} step={0.001} defaultValue={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Purity (%)" name="purity" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tested Purity (%)" name="tested_purity" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.01} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Current Rate (₹/g)" name="current_rate" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Melting Loss %" name="melting_loss_percentage">
                <InputNumber style={{ width: '100%' }} min={0} max={5} step={0.1} defaultValue={0.5} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Item Description" name="item_description">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Old Gold
              </Button>
              <Button onClick={() => setShowOldGoldModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Add Payment"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAddPayment}>
          <Form.Item label="Payment Mode" name="payment_mode" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="upi">UPI</Option>
              <Option value="cheque">Cheque</Option>
              <Option value="bank_transfer">Bank Transfer</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              prefix="₹"
              placeholder={`Max: ₹${totals.balanceDue.toFixed(2)}`}
            />
          </Form.Item>

          <Form.Item label="Transaction Reference" name="transaction_ref">
            <Input placeholder="Optional" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Payment
              </Button>
              <Button onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoiceCreate;
