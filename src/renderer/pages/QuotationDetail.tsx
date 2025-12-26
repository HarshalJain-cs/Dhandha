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
  Row,
  Col,
} from 'antd';
import {
  PrinterOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  StopOutlined,
  MailOutlined,
  FileTextOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { setCurrentQuotation, updateQuotation } from '../store/slices/quotationSlice';
import dayjs from 'dayjs';

/**
 * Quotation Detail Page
 * Displays complete details of a quotation and allows conversion to invoice
 */
const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [quotation, setQuotation] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load quotation on mount
   */
  useEffect(() => {
    if (id) {
      loadQuotation(id);
    }
  }, [id]);

  /**
   * Load quotation details
   */
  const loadQuotation = async (quotationId: string) => {
    setLoading(true);

    try {
      const response = await window.electronAPI.quotation.getById(Number(quotationId));

      if (response.success) {
        const data = response.data;
        setQuotation(data);
        setCustomer(data.customer);
        setItems(data.items || []);

        dispatch(setCurrentQuotation(data));
      } else {
        message.error(response.message || 'Failed to load quotation');
        navigate('/quotations');
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      message.error('An error occurred while loading quotation');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Convert quotation to invoice
   */
  const handleConvertToInvoice = () => {
    Modal.confirm({
      title: 'Convert to Invoice?',
      content: 'This will create an invoice from this quotation. Do you want to proceed?',
      onOk: async () => {
        try {
          const response = await window.electronAPI.quotation.convertToInvoice(
            quotation.quotation_id,
            user!.id
          );

          if (response.success) {
            message.success('Quotation converted to invoice successfully');
            navigate(`/billing/${response.data.invoice_id}`);
          } else {
            message.error(response.message || 'Failed to convert quotation');
          }
        } catch (error) {
          console.error('Error converting quotation:', error);
          message.error('An error occurred while converting quotation');
        }
      },
    });
  };

  /**
   * Update quotation status
   */
  const handleUpdateStatus = async (status: 'accepted' | 'rejected') => {
    const confirmMessage =
      status === 'accepted'
        ? 'Mark this quotation as accepted?'
        : 'Reject this quotation? This action cannot be undone.';

    Modal.confirm({
      title: 'Confirm Status Change',
      content: confirmMessage,
      onOk: async () => {
        try {
          const response = await window.electronAPI.quotation.updateStatus(
            quotation.quotation_id,
            status,
            user!.id
          );

          if (response.success) {
            message.success(`Quotation ${status}`);
            loadQuotation(id!);
          } else {
            message.error(response.message || `Failed to ${status} quotation`);
          }
        } catch (error) {
          console.error('Error updating quotation status:', error);
          message.error('An error occurred while updating quotation');
        }
      },
    });
  };

  /**
   * Handle email
   */
  const handleEmail = async () => {
    try {
      const response = await window.electronAPI.email.sendQuotation(
        quotation.quotation_id,
        customer.email
      );

      if (response.success) {
        message.success('Quotation sent via email');
      } else {
        message.error(response.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('An error occurred while sending email');
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
      accepted: { color: 'success', label: 'Accepted' },
      rejected: { color: 'error', label: 'Rejected' },
      converted: { color: 'blue', label: 'Converted to Invoice' },
    };

    const statusConfig = config[status] || { color: 'default', label: status };
    return <Tag color={statusConfig.color}>{statusConfig.label}</Tag>;
  };

  /**
   * Check if quotation is expired
   */
  const isExpired = (): boolean => {
    if (!quotation) return false;
    return dayjs().isAfter(dayjs(quotation.valid_until), 'day');
  };

  /**
   * Get validity tag
   */
  const getValidityTag = () => {
    const expired = isExpired();
    return expired ? (
      <Tag color="red">Expired</Tag>
    ) : (
      <Tag color="green">
        Valid until {dayjs(quotation.valid_until).format('DD MMM YYYY')}
      </Tag>
    );
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
      title: 'Stone',
      dataIndex: 'stone_amount',
      key: 'stone_amount',
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'GST',
      dataIndex: 'total_gst',
      key: 'total_gst',
      render: (amt: number) => `₹${Number(amt).toFixed(2)}`,
    },
    {
      title: 'Total',
      dataIndex: 'item_total',
      key: 'item_total',
      render: (amt: number) => (
        <strong className="text-blue-600">₹{Number(amt).toFixed(2)}</strong>
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

  if (!quotation) {
    return null;
  }

  const canConvert =
    quotation.status === 'pending' || quotation.status === 'accepted';
  const canAcceptReject = quotation.status === 'pending';
  const isConverted = quotation.status === 'converted';

  return (
    <div className="p-6 no-print">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/quotations')}
          >
            Back
          </Button>
          <h1 className="text-2xl font-bold m-0">Quotation Details</h1>
          {getStatusTag(quotation.status)}
          {getValidityTag()}
        </Space>

        <Space>
          {canConvert && !isExpired() && (
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={handleConvertToInvoice}
            >
              Convert to Invoice
            </Button>
          )}

          {canAcceptReject && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleUpdateStatus('accepted')}
              >
                Accept
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={() => handleUpdateStatus('rejected')}
              >
                Reject
              </Button>
            </>
          )}

          {customer?.email && (
            <Button icon={<MailOutlined />} onClick={handleEmail}>
              Email
            </Button>
          )}

          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </Space>
      </div>

      {/* Expired Warning */}
      {isExpired() && quotation.status !== 'converted' && (
        <Card className="mb-4 border-red-300 bg-red-50">
          <div className="flex items-start">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <div className="font-medium text-red-800">Quotation Expired</div>
              <div className="text-sm text-red-700 mt-1">
                This quotation expired on {dayjs(quotation.valid_until).format('DD MMM YYYY')}.
                You may need to create a new quotation with updated pricing.
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Converted Invoice Link */}
      {isConverted && quotation.converted_invoice_id && (
        <Card className="mb-4 border-blue-300 bg-blue-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div>
                <div className="font-medium text-blue-800">
                  Converted to Invoice
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  This quotation has been converted to an invoice.
                </div>
              </div>
            </div>
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() =>
                navigate(`/billing/${quotation.converted_invoice_id}`)
              }
            >
              View Invoice
            </Button>
          </div>
        </Card>
      )}

      {/* Quotation Information */}
      <Card title="Quotation Information" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Quotation Number" span={1}>
            <strong>{quotation.quotation_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Quotation Date" span={1}>
            {dayjs(quotation.quotation_date).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Valid Until" span={1}>
            {dayjs(quotation.valid_until).format('DD/MM/YYYY')}
            {isExpired() && <Tag color="red" className="ml-2">Expired</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            {getStatusTag(quotation.status)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Customer Information */}
      <Card title="Customer Information" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Customer Name" span={1}>
            <strong>{customer?.customer_name || 'N/A'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Customer Code" span={1}>
            {customer?.customer_code || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone" span={1}>
            {customer?.phone || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={1}>
            {customer?.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="GSTIN" span={2}>
            {customer?.gstin || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {customer?.address || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Quotation Items */}
      <Card title="Quotation Items" className="mb-4">
        <Table
          columns={itemsColumns}
          dataSource={items}
          rowKey="quotation_item_id"
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: 'No items found',
          }}
        />
      </Card>

      {/* Financial Summary */}
      <Card title="Financial Summary">
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Subtotal">
                ₹{Number(quotation.subtotal).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Total GST">
                ₹{Number(quotation.total_gst).toFixed(2)}
              </Descriptions.Item>
              {quotation.discount_amount > 0 && (
                <Descriptions.Item label={`Discount (${quotation.discount_percentage}%)`}>
                  <span className="text-green-600">
                    -₹{Number(quotation.discount_amount).toFixed(2)}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col span={12}>
            <Card
              size="small"
              style={{ backgroundColor: '#f0f9ff', border: '1px solid #0284c7' }}
            >
              <div className="text-center">
                <div className="text-gray-600 mb-2">Grand Total</div>
                <div className="text-3xl font-bold text-blue-600">
                  ₹{Number(quotation.grand_total).toFixed(2)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Notes & Terms */}
        {(quotation.notes || quotation.terms) && (
          <>
            <Divider />
            <Row gutter={16}>
              {quotation.notes && (
                <Col span={12}>
                  <div>
                    <strong>Notes:</strong>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      {quotation.notes}
                    </div>
                  </div>
                </Col>
              )}
              {quotation.terms && (
                <Col span={12}>
                  <div>
                    <strong>Terms & Conditions:</strong>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      {quotation.terms}
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          </>
        )}
      </Card>
    </div>
  );
};

export default QuotationDetail;
