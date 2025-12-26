import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Radio,
  Table,
  Space,
  message,
  Divider,
  Checkbox,
  Descriptions,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SearchOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { addReturn } from '../store/slices/salesReturnSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Sales Return Create Page
 * Allows users to create sales returns/exchanges for invoices
 */
const SalesReturnCreate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [invoiceSearchText, setInvoiceSearchText] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  /**
   * Search invoice by number
   */
  const searchInvoice = async () => {
    if (!invoiceSearchText.trim()) {
      message.warning('Please enter an invoice number');
      return;
    }

    setSearchLoading(true);

    try {
      const response = await window.electronAPI.invoice.getAll({
        search: invoiceSearchText,
        is_cancelled: false,
      });

      if (response.success) {
        const invoiceList = response.data.invoices || response.data;

        if (invoiceList.length === 0) {
          message.warning('No invoice found with this number');
          setSelectedInvoice(null);
          setInvoiceItems([]);
          setSelectedItems([]);
          return;
        }

        // Get the first matching invoice
        const invoice = invoiceList[0];

        // Load full invoice details
        const detailResponse = await window.electronAPI.invoice.getById(invoice.invoice_id);

        if (detailResponse.success) {
          setSelectedInvoice(detailResponse.data);
          setInvoiceItems(detailResponse.data.items || []);
          setSelectedItems([]);
          message.success('Invoice loaded successfully');
        } else {
          message.error('Failed to load invoice details');
        }
      } else {
        message.error(response.message || 'Failed to search invoice');
      }
    } catch (error) {
      console.error('Error searching invoice:', error);
      message.error('An error occurred while searching invoice');
    } finally {
      setSearchLoading(false);
    }
  };

  /**
   * Handle item selection
   */
  const handleItemSelect = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  /**
   * Calculate return amount
   */
  const calculateReturnAmount = (): number => {
    return invoiceItems
      .filter((item) => selectedItems.includes(item.invoice_item_id))
      .reduce((sum, item) => sum + Number(item.item_total || 0), 0);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: any) => {
    if (!selectedInvoice) {
      message.error('Please search and select an invoice');
      return;
    }

    if (selectedItems.length === 0) {
      message.error('Please select at least one item to return');
      return;
    }

    if (!user) {
      message.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const returnData = {
        original_invoice_id: selectedInvoice.invoice_id,
        return_type: values.return_type,
        reason: values.reason,
        items: selectedItems.map((itemId) => {
          const item = invoiceItems.find((i) => i.invoice_item_id === itemId);
          return {
            invoice_item_id: itemId,
            product_id: item?.product_id,
            quantity: 1,
            return_amount: item?.item_total || 0,
          };
        }),
        refund_amount: calculateReturnAmount(),
      };

      const response = await window.electronAPI.salesReturn.create(returnData, user.id);

      if (response.success) {
        message.success('Sales return created successfully');
        dispatch(addReturn(response.data));
        navigate(`/sales-returns/${response.data.return_id}`);
      } else {
        message.error(response.message || 'Failed to create sales return');
      }
    } catch (error) {
      console.error('Error creating sales return:', error);
      message.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Items table columns
   */
  const itemsColumns = [
    {
      title: 'Select',
      key: 'select',
      width: 80,
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedItems.includes(record.invoice_item_id)}
          onChange={(e) => handleItemSelect(record.invoice_item_id, e.target.checked)}
        />
      ),
    },
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
      title: 'Amount',
      dataIndex: 'item_total',
      key: 'item_total',
      align: 'right' as const,
      render: (amount: number) => (
        <span className="font-medium">₹{Number(amount).toFixed(2)}</span>
      ),
    },
  ];

  const returnAmount = calculateReturnAmount();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/sales-returns')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold m-0">Create Sales Return</h1>
        </Space>
      </div>

      {/* Invoice Search */}
      <Card title="Search Invoice" className="mb-4">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Enter invoice number"
            value={invoiceSearchText}
            onChange={(e) => setInvoiceSearchText(e.target.value)}
            onPressEnter={searchInvoice}
            size="large"
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={searchInvoice}
            loading={searchLoading}
            size="large"
          >
            Search
          </Button>
        </Space.Compact>
      </Card>

      {/* Invoice Details (if selected) */}
      {selectedInvoice && (
        <Card title="Invoice Details" className="mb-4">
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Invoice Number" span={1}>
              <strong>{selectedInvoice.invoice_number}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Invoice Date" span={1}>
              {dayjs(selectedInvoice.invoice_date).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Name" span={1}>
              {selectedInvoice.customer_name}
            </Descriptions.Item>
            <Descriptions.Item label="Phone" span={1}>
              {selectedInvoice.customer_phone}
            </Descriptions.Item>
            <Descriptions.Item label="Invoice Amount" span={1}>
              <strong>₹{Number(selectedInvoice.grand_total).toFixed(2)}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status" span={1}>
              {selectedInvoice.payment_status}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Return Form */}
      {selectedInvoice && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            return_type: 'return',
          }}
        >
          <Card title="Return Information" className="mb-4">
            <Form.Item
              label="Return Type"
              name="return_type"
              rules={[{ required: true, message: 'Please select return type' }]}
            >
              <Radio.Group onChange={(e) => setReturnType(e.target.value)}>
                <Radio.Button value="return">Return (Refund)</Radio.Button>
                <Radio.Button value="exchange">Exchange</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Reason for Return"
              name="reason"
              rules={[
                { required: true, message: 'Please enter reason for return' },
                { min: 10, message: 'Reason must be at least 10 characters' },
              ]}
            >
              <TextArea
                placeholder="Enter detailed reason for the return/exchange"
                rows={4}
              />
            </Form.Item>
          </Card>

          {/* Items to Return */}
          <Card
            title="Select Items to Return"
            className="mb-4"
            extra={
              <span className="text-sm text-gray-500">
                {selectedItems.length} item(s) selected
              </span>
            }
          >
            <Table
              columns={itemsColumns}
              dataSource={invoiceItems}
              rowKey="invoice_item_id"
              pagination={false}
              size="small"
              locale={{
                emptyText: 'No items found in this invoice',
              }}
            />
          </Card>

          {/* Return Summary */}
          {selectedItems.length > 0 && (
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Return Summary</span>
                </Space>
              }
              className="mb-4"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <div className="text-gray-600">Items to Return</div>
                  <div className="text-2xl font-bold">{selectedItems.length}</div>
                </Col>
                <Col span={12}>
                  <div className="text-gray-600">
                    {returnType === 'return' ? 'Refund Amount' : 'Exchange Value'}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{returnAmount.toFixed(2)}
                  </div>
                </Col>
              </Row>

              {returnType === 'exchange' && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <strong>Note:</strong> After approval, a new invoice will be created for the exchange items.
                </div>
              )}

              {returnType === 'return' && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <strong>Note:</strong> Refund will be processed after approval.
                </div>
              )}
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end">
            <Space>
              <Button onClick={() => navigate('/sales-returns')} size="large">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
                disabled={selectedItems.length === 0}
              >
                Submit for Approval
              </Button>
            </Space>
          </div>
        </Form>
      )}

      {/* Empty State */}
      {!selectedInvoice && (
        <Card>
          <div className="text-center p-8 text-gray-500">
            <SearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div className="text-lg">Search for an invoice to create a return</div>
            <div className="text-sm mt-2">Enter the invoice number in the search box above</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SalesReturnCreate;
