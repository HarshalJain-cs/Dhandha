import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Card,
  Button,
  Table,
  Descriptions,
  Space,
  Tag,
  Divider,
  message,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { setCurrentInvoice, setCurrentInvoiceItems, setCurrentInvoicePayments, addPayment } from '../store/slices/invoiceSlice';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Invoice Detail Page
 */
const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [oldGold, setOldGold] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  /**
   * Load invoice on mount
   */
  useEffect(() => {
    if (id) {
      loadInvoice(parseInt(id));
    }
  }, [id]);

  /**
   * Load invoice details
   */
  const loadInvoice = async (invoiceId: number) => {
    setLoading(true);

    try {
      const response = await window.electronAPI.invoice.getById(invoiceId);

      if (response.success) {
        const data = response.data;
        setInvoice(data);
        setItems(data.items || []);
        setPayments(data.payments || []);
        setOldGold(data.oldGoldTransaction || null);

        dispatch(setCurrentInvoice(data));
        dispatch(setCurrentInvoiceItems(data.items || []));
        dispatch(setCurrentInvoicePayments(data.payments || []));
      } else {
        message.error(response.message || 'Failed to load invoice');
        navigate('/billing');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      message.error('An error occurred while loading invoice');
      navigate('/billing');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle print
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Handle add payment
   */
  const handleAddPayment = async (values: any) => {
    try {
      const response = await window.electronAPI.invoice.addPayment(
        parseInt(id!),
        values,
        1 // TODO: Get from auth state
      );

      if (response.success) {
        message.success('Payment added successfully');
        setShowPaymentModal(false);
        loadInvoice(parseInt(id!));
      } else {
        message.error(response.message || 'Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      message.error('An error occurred while adding payment');
    }
  };

  /**
   * Handle cancel invoice
   */
  const handleCancelInvoice = async (values: any) => {
    try {
      const response = await window.electronAPI.invoice.cancel(
        parseInt(id!),
        values.reason,
        1 // TODO: Get from auth state
      );

      if (response.success) {
        message.success('Invoice cancelled successfully');
        setShowCancelModal(false);
        loadInvoice(parseInt(id!));
      } else {
        message.error(response.message || 'Failed to cancel invoice');
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      message.error('An error occurred while cancelling invoice');
    }
  };

  /**
   * Get payment status tag
   */
  const getPaymentStatusTag = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      paid: { color: 'success', label: 'Paid' },
      partial: { color: 'warning', label: 'Partial' },
      pending: { color: 'default', label: 'Pending' },
      overdue: { color: 'error', label: 'Overdue' },
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
      title: 'Purity',
      dataIndex: 'purity',
      key: 'purity',
      render: (purity: number) => `${purity}%`,
    },
    {
      title: 'Rate/g',
      dataIndex: 'metal_rate',
      key: 'metal_rate',
      render: (rate: number) => `₹${Number(rate).toFixed(2)}`,
    },
    {
      title: 'Metal Amount',
      dataIndex: 'metal_amount',
      key: 'metal_amount',
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'Making',
      dataIndex: 'making_charge_amount',
      key: 'making_charge_amount',
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'GST',
      dataIndex: 'total_gst',
      key: 'total_gst',
      render: (gst: number) => `₹${Number(gst).toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'line_total',
      key: 'line_total',
      render: (total: number) => (
        <span className="font-semibold">₹{Number(total).toFixed(2)}</span>
      ),
    },
  ];

  /**
   * Payments table columns
   */
  const paymentsColumns = [
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date: string) => dayjs(date).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Mode',
      dataIndex: 'payment_mode',
      key: 'payment_mode',
      render: (mode: string) => mode.toUpperCase(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'Reference',
      dataIndex: 'transaction_ref',
      key: 'transaction_ref',
      render: (ref: string) => ref || '-',
    },
    {
      title: 'Receipt #',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Tag color={status === 'cleared' ? 'success' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (loading || !invoice) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div>Loading invoice...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center no-print">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/billing')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
          {getPaymentStatusTag(invoice.payment_status)}
          {invoice.is_cancelled && <Tag color="red">CANCELLED</Tag>}
        </Space>

        <Space>
          {invoice.payment_status !== 'paid' && !invoice.is_cancelled && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => setShowPaymentModal(true)}
            >
              Add Payment
            </Button>
          )}
          {!invoice.is_cancelled && (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Invoice
            </Button>
          )}
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Space>
      </div>

      <div ref={printRef}>
        {/* Invoice Header */}
        <Card className="mb-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Jewellery ERP</h2>
            <div className="text-sm text-gray-600">
              Tax Invoice
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-4">
            <Descriptions title="Customer Details" column={1} size="small">
              <Descriptions.Item label="Name">{invoice.customer_name}</Descriptions.Item>
              <Descriptions.Item label="Mobile">{invoice.customer_mobile}</Descriptions.Item>
              <Descriptions.Item label="Email">{invoice.customer_email || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Address">{invoice.customer_address || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="GSTIN">{invoice.customer_gstin || 'N/A'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Invoice Details" column={1} size="small">
              <Descriptions.Item label="Invoice #">{invoice.invoice_number}</Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(invoice.invoice_date).format('DD MMM YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {invoice.invoice_type.toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="GST Type">
                {invoice.gst_type === 'intra' ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Card>

        {/* Invoice Items */}
        <Card title="Invoice Items" className="mb-4">
          <Table
            dataSource={items}
            columns={itemsColumns}
            pagination={false}
            size="small"
            rowKey="id"
          />
        </Card>

        {/* Old Gold */}
        {oldGold && (
          <Card title="Old Gold Exchange" className="mb-4">
            <Descriptions column={4} size="small">
              <Descriptions.Item label="Metal Type">{oldGold.metal_type}</Descriptions.Item>
              <Descriptions.Item label="Gross Weight">{oldGold.gross_weight}g</Descriptions.Item>
              <Descriptions.Item label="Net Weight">{oldGold.net_weight}g</Descriptions.Item>
              <Descriptions.Item label="Purity">{oldGold.purity}%</Descriptions.Item>
              <Descriptions.Item label="Fine Weight">{oldGold.fine_weight}g</Descriptions.Item>
              <Descriptions.Item label="Rate">₹{Number(oldGold.current_rate).toFixed(2)}/g</Descriptions.Item>
              <Descriptions.Item label="Melting Loss">{oldGold.melting_loss_percentage}%</Descriptions.Item>
              <Descriptions.Item label="Value">
                <span className="font-semibold text-green-600">
                  ₹{Number(oldGold.final_value).toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Invoice Summary */}
        <Card title="Invoice Summary" className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Subtotal">₹{Number(invoice.subtotal).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Metal Amount">₹{Number(invoice.metal_amount).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Making Charges">₹{Number(invoice.making_charges).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Wastage">₹{Number(invoice.wastage_amount).toFixed(2)}</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} size="small">
              <Descriptions.Item label={invoice.gst_type === 'intra' ? 'CGST' : 'IGST (Metal)'}>
                ₹{invoice.gst_type === 'intra' ? Number(invoice.metal_cgst).toFixed(2) : Number(invoice.metal_igst).toFixed(2)}
              </Descriptions.Item>
              {invoice.gst_type === 'intra' && (
                <Descriptions.Item label="SGST (Metal)">₹{Number(invoice.metal_sgst).toFixed(2)}</Descriptions.Item>
              )}
              <Descriptions.Item label={invoice.gst_type === 'intra' ? 'CGST (Making)' : 'IGST (Making)'}>
                ₹{invoice.gst_type === 'intra' ? Number(invoice.making_cgst).toFixed(2) : Number(invoice.making_igst).toFixed(2)}
              </Descriptions.Item>
              {invoice.gst_type === 'intra' && (
                <Descriptions.Item label="SGST (Making)">₹{Number(invoice.making_sgst).toFixed(2)}</Descriptions.Item>
              )}
              <Descriptions.Item label="Total GST">
                <span className="font-semibold">₹{Number(invoice.total_gst).toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Divider />

          <Descriptions column={2} size="small">
            {invoice.discount_amount > 0 && (
              <Descriptions.Item label="Discount">
                -₹{Number(invoice.discount_amount).toFixed(2)}
              </Descriptions.Item>
            )}
            {invoice.old_gold_amount > 0 && (
              <Descriptions.Item label="Old Gold">
                -₹{Number(invoice.old_gold_amount).toFixed(2)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Round Off">
              ₹{Number(invoice.round_off).toFixed(2)}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Descriptions column={2} size="large">
            <Descriptions.Item label={<strong>Grand Total</strong>}>
              <span className="text-2xl font-bold text-green-600">
                ₹{Number(invoice.grand_total).toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={<strong>Amount Paid</strong>}>
              <span className="text-xl font-semibold">
                ₹{Number(invoice.amount_paid).toFixed(2)}
              </span>
            </Descriptions.Item>
          </Descriptions>

          {invoice.balance_due > 0 && (
            <Descriptions column={1} size="large">
              <Descriptions.Item label={<strong>Balance Due</strong>}>
                <span className="text-2xl font-bold text-red-600">
                  ₹{Number(invoice.balance_due).toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        {/* Payments */}
        {payments.length > 0 && (
          <Card title="Payments" className="mb-4">
            <Table
              dataSource={payments}
              columns={paymentsColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card title="Notes" className="mb-4">
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </Card>
        )}

        {/* Terms & Conditions */}
        <Card title="Terms & Conditions" size="small">
          <p className="text-xs text-gray-600">
            {invoice.terms_conditions || 'Standard terms and conditions apply.'}
          </p>
        </Card>
      </div>

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
              max={Number(invoice.balance_due)}
              prefix="₹"
              placeholder={`Max: ₹${Number(invoice.balance_due).toFixed(2)}`}
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

      {/* Cancel Invoice Modal */}
      <Modal
        title="Cancel Invoice"
        open={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCancelInvoice}>
          <Form.Item
            label="Cancellation Reason"
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason for cancellation' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for cancelling this invoice..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                Cancel Invoice
              </Button>
              <Button onClick={() => setShowCancelModal(false)}>Close</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetail;
