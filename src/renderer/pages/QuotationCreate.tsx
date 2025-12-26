import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  Form,
  InputNumber,
  DatePicker,
  Space,
  Divider,
  message,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ScanOutlined,
  SearchOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { addQuotation } from '../store/slices/quotationSlice';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Quotation Line Item Interface
 */
interface QuotationLineItem {
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
}

/**
 * Quotation Create Page
 * Similar to InvoiceCreate but for quotations
 */
const QuotationCreate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const barcodeInputRef = useRef<any>(null);

  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearchText, setCustomerSearchText] = useState('');

  // Product state
  const [products, setProducts] = useState<any[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);

  // Metal rates
  const [metalRates, setMetalRates] = useState<any[]>([]);
  const [selectedMetalRate, setSelectedMetalRate] = useState<number>(0);

  // Quotation data
  const [validUntil, setValidUntil] = useState(dayjs().add(30, 'days'));
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

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
    grandTotal: 0,
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
   * Calculate totals whenever line items or discount changes
   */
  useEffect(() => {
    calculateTotals();
  }, [lineItems, discountPercentage]);

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
        const gold22k = response.data.find((m: any) => m.metal_name?.includes('22'));
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
        addProductToQuotation(product);
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
      } else {
        message.warning('Product not found');
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      message.error('An error occurred while scanning barcode');
    }
  };

  /**
   * Add product to quotation
   */
  const addProductToQuotation = (product: any) => {
    // Check if product already exists
    const existingItem = lineItems.find((item) => item.product_id === product.product_id);
    if (existingItem) {
      message.warning('Product already added');
      return;
    }

    // Calculate metal amount
    const metalRate = selectedMetalRate || product.metal_rate || 0;
    const metalAmount = product.net_weight * metalRate;

    // Calculate making charges
    let makingChargeAmount = 0;
    if (product.making_charge_type === 'per_gram') {
      makingChargeAmount = product.net_weight * product.making_charge_value;
    } else if (product.making_charge_type === 'percentage') {
      makingChargeAmount = metalAmount * (product.making_charge_value / 100);
    } else if (product.making_charge_type === 'fixed') {
      makingChargeAmount = product.making_charge_value;
    }

    // Calculate wastage
    const wastageAmount = metalAmount * (product.wastage_percentage / 100);

    // Calculate stone amount
    const stoneAmount = product.stone_value || 0;

    // Calculate subtotal
    const subtotal = metalAmount + makingChargeAmount + wastageAmount + stoneAmount;

    // Calculate GST (Metal 3%, Making 5%)
    const metalGST = metalAmount * 0.03;
    const makingGST = makingChargeAmount * 0.05;
    const totalGST = metalGST + makingGST;

    // Calculate line total
    const lineTotal = subtotal + totalGST;

    const lineItem: QuotationLineItem = {
      key: `${product.product_id}-${Date.now()}`,
      product_id: product.product_id,
      product_code: product.product_code,
      product_name: product.product_name,
      category_name: product.category?.category_name || '',
      metal_type_name: product.metal_type?.metal_name || '',
      gross_weight: product.gross_weight,
      net_weight: product.net_weight,
      purity: product.metal_type?.purity || 0,
      metal_rate: metalRate,
      quantity: 1,
      making_charge_type: product.making_charge_type,
      making_charge_rate: product.making_charge_value,
      making_charge_amount: makingChargeAmount,
      wastage_percentage: product.wastage_percentage || 0,
      wastage_amount: wastageAmount,
      stone_amount: stoneAmount,
      metal_amount: metalAmount,
      subtotal,
      metal_gst: metalGST,
      making_gst: makingGST,
      total_gst: totalGST,
      line_total: lineTotal,
    };

    setLineItems([...lineItems, lineItem]);
    message.success('Product added to quotation');
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

    const discountAmount = subtotal * (discountPercentage / 100);
    const grandTotal = subtotal + totalGST - discountAmount;

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
      grandTotal,
    });
  };

  /**
   * Handle submit
   */
  const handleSubmit = async () => {
    if (!selectedCustomer) {
      message.error('Please select a customer');
      return;
    }

    if (lineItems.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    if (!user) {
      message.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const quotationData = {
        customer_id: selectedCustomer.customer_id,
        valid_until: validUntil.format('YYYY-MM-DD'),
        items: lineItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          metal_rate: item.metal_rate,
          making_charge_amount: item.making_charge_amount,
          stone_amount: item.stone_amount,
          metal_gst: item.metal_gst,
          making_gst: item.making_gst,
          item_total: item.line_total,
        })),
        subtotal: totals.subtotal,
        total_gst: totals.totalGST,
        discount_amount: totals.discountAmount,
        discount_percentage: discountPercentage,
        grand_total: totals.grandTotal,
        notes,
        terms,
      };

      const response = await window.electronAPI.quotation.create(quotationData, user.user_id);

      if (response.success) {
        message.success('Quotation created successfully');
        dispatch(addQuotation(response.data));
        navigate(`/quotations/${response.data.quotation_id}`);
      } else {
        message.error(response.message || 'Failed to create quotation');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Line items table columns
   */
  const lineItemsColumns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      render: (text: string, record: QuotationLineItem) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Weight (g)',
      key: 'weight',
      width: 100,
      render: (_: any, record: QuotationLineItem) => (
        <div className="text-xs">
          <div>Gross: {record.gross_weight}g</div>
          <div>Net: {record.net_weight}g</div>
        </div>
      ),
    },
    {
      title: 'Rate/g',
      dataIndex: 'metal_rate',
      key: 'metal_rate',
      width: 80,
      render: (rate: number) => `₹${Number(rate).toFixed(2)}`,
    },
    {
      title: 'Metal',
      dataIndex: 'metal_amount',
      key: 'metal_amount',
      width: 100,
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'Making',
      dataIndex: 'making_charge_amount',
      key: 'making_charge_amount',
      width: 100,
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'Stone',
      dataIndex: 'stone_amount',
      key: 'stone_amount',
      width: 100,
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'GST',
      dataIndex: 'total_gst',
      key: 'total_gst',
      width: 100,
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'line_total',
      key: 'line_total',
      width: 120,
      render: (amt: number) => (
        <strong className="text-blue-600">₹{Number(amt).toFixed(2)}</strong>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: QuotationLineItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLineItem(record.key)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/quotations')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold m-0">Create Quotation</h1>
        </Space>
      </div>

      {/* Customer Selection */}
      <Card title="Customer Information" className="mb-4">
        <Row gutter={16}>
          <Col span={12}>
            <label className="block mb-2 font-medium">Select Customer</label>
            <Select
              showSearch
              placeholder="Search and select customer"
              style={{ width: '100%' }}
              value={selectedCustomer?.customer_id}
              onChange={(value) => {
                const customer = customers.find((c) => c.customer_id === value);
                setSelectedCustomer(customer);
              }}
              optionFilterProp="children"
              filterOption={(input, option: any) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {customers.map((customer) => (
                <Option key={customer.customer_id} value={customer.customer_id}>
                  {customer.customer_name} - {customer.phone}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <label className="block mb-2 font-medium">Valid Until</label>
            <DatePicker
              style={{ width: '100%' }}
              value={validUntil}
              onChange={(date) => date && setValidUntil(date)}
              format="DD/MM/YYYY"
              disabledDate={(current) => {
                return current && current < dayjs().startOf('day');
              }}
            />
          </Col>
        </Row>

        {selectedCustomer && (
          <Card size="small" className="mt-4" style={{ backgroundColor: '#f5f5f5' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Phone">{selectedCustomer.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedCustomer.email || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="GSTIN">{selectedCustomer.gstin || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedCustomer.address || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Card>

      {/* Product Selection */}
      <Card title="Add Products" className="mb-4">
        <Row gutter={16}>
          <Col span={12}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                ref={barcodeInputRef}
                placeholder="Scan barcode or enter product code"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onPressEnter={handleBarcodeScan}
                prefix={<ScanOutlined />}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleBarcodeScan}
              >
                Search
              </Button>
            </Space.Compact>
          </Col>
          <Col span={12}>
            <Select
              showSearch
              placeholder="Or select product from list"
              style={{ width: '100%' }}
              onChange={(value) => {
                const product = products.find((p) => p.product_id === value);
                if (product) addProductToQuotation(product);
              }}
              value={null}
              optionFilterProp="children"
              filterOption={(input, option: any) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {products.map((product) => (
                <Option key={product.product_id} value={product.product_id}>
                  {product.product_name} ({product.product_code})
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Line Items Table */}
      <Card
        title="Quotation Items"
        className="mb-4"
        extra={<span className="text-sm text-gray-500">{lineItems.length} item(s)</span>}
      >
        <Table
          columns={lineItemsColumns}
          dataSource={lineItems}
          rowKey="key"
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: 'No items added yet. Add products using barcode or dropdown above.',
          }}
        />
      </Card>

      {/* Totals */}
      {lineItems.length > 0 && (
        <Card
          title={
            <Space>
              <DollarOutlined />
              <span>Quotation Summary</span>
            </Space>
          }
          className="mb-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Metal Amount">
                  ₹{totals.metalAmount.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Making Charges">
                  ₹{totals.makingCharges.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Stone Amount">
                  ₹{totals.stoneAmount.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Wastage">
                  ₹{totals.wastageAmount.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Subtotal">
                  <strong>₹{totals.subtotal.toFixed(2)}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Metal GST (3%)">
                  ₹{totals.metalGST.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Making GST (5%)">
                  ₹{totals.makingGST.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Total GST">
                  <strong>₹{totals.totalGST.toFixed(2)}</strong>
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-4">
                <label className="block mb-2 font-medium">Discount (%)</label>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={2}
                  value={discountPercentage}
                  onChange={(value) => setDiscountPercentage(value || 0)}
                  addonAfter="%"
                />
                {discountPercentage > 0 && (
                  <div className="mt-2 text-sm text-green-600">
                    Discount Amount: ₹{totals.discountAmount.toFixed(2)}
                  </div>
                )}
              </div>
            </Col>

            <Col span={12}>
              <Card style={{ backgroundColor: '#f0f9ff', border: '1px solid #0284c7' }}>
                <div className="text-center">
                  <div className="text-gray-600 mb-2">Grand Total</div>
                  <div className="text-4xl font-bold text-blue-600">
                    ₹{totals.grandTotal.toFixed(2)}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Notes & Terms */}
      <Card title="Additional Information">
        <Row gutter={16}>
          <Col span={12}>
            <label className="block mb-2 font-medium">Notes</label>
            <TextArea
              placeholder="Enter any additional notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Col>
          <Col span={12}>
            <label className="block mb-2 font-medium">Terms & Conditions</label>
            <TextArea
              placeholder="Enter terms and conditions"
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end">
        <Space>
          <Button onClick={() => navigate('/quotations')} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={loading}
            size="large"
            disabled={lineItems.length === 0 || !selectedCustomer}
          >
            Create Quotation
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default QuotationCreate;
