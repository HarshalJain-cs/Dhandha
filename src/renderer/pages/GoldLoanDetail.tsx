import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Button,
  Descriptions,
  Table,
  Tag,
  Space,
  Statistic,
  Progress,
  Tabs,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Image,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import { setCurrentLoan, setPayments, addPayment } from '../store/slices/goldLoanSlice';
import type { ColumnsType } from 'antd/es/table';
import type { LoanPayment } from '../store/slices/goldLoanSlice';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const GoldLoanDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const { currentLoan, payments, loading } = useSelector(
    (state: RootState) => state.goldLoan
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState('details');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [forecloseModalVisible, setForecloseModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [forecloseForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadLoan(Number(id));
      loadPayments(Number(id));
    }
  }, [id]);

  /**
   * Load loan details
   */
  const loadLoan = async (loanId: number) => {
    try {
      const response = await window.electronAPI.goldLoan.getById(loanId);
      if (response.success) {
        dispatch(setCurrentLoan(response.data));
      } else {
        message.error(response.message || 'Failed to load loan details');
        navigate('/gold-loans');
      }
    } catch (error) {
      console.error('Error loading loan:', error);
      message.error('An error occurred while loading loan details');
    }
  };

  /**
   * Load payment history
   */
  const loadPayments = async (loanId: number) => {
    try {
      const response = await window.electronAPI.goldLoan.getPayments(loanId);
      if (response.success) {
        dispatch(setPayments(response.data));
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  /**
   * Handle payment submission
   */
  const handleRecordPayment = async (values: any) => {
    if (!currentLoan) return;

    try {
      const paymentData = {
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        payment_type: values.payment_type,
        payment_mode: values.payment_mode,
        principal_amount: Number(values.principal_amount) || 0,
        interest_amount: Number(values.interest_amount) || 0,
        penalty_amount: Number(values.penalty_amount) || 0,
        total_amount:
          Number(values.principal_amount || 0) +
          Number(values.interest_amount || 0) +
          Number(values.penalty_amount || 0),
        transaction_reference: values.transaction_reference || null,
        bank_name: values.bank_name || null,
        cheque_number: values.cheque_number || null,
        cheque_date: values.cheque_date ? values.cheque_date.format('YYYY-MM-DD') : null,
        card_last_4_digits: values.card_last_4_digits || null,
        upi_transaction_id: values.upi_transaction_id || null,
        notes: values.notes || null,
      };

      const response = await window.electronAPI.goldLoan.recordPayment(
        currentLoan.id,
        paymentData,
        user?.id || 1
      );

      if (response.success) {
        message.success('Payment recorded successfully');
        dispatch(addPayment(response.data));
        loadLoan(currentLoan.id);
        loadPayments(currentLoan.id);
        setPaymentModalVisible(false);
        paymentForm.resetFields();
      } else {
        message.error(response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      message.error('An error occurred while recording payment');
    }
  };

  /**
   * Handle close loan
   */
  const handleCloseLoan = async (values: any) => {
    if (!currentLoan) return;

    try {
      const response = await window.electronAPI.goldLoan.close(
        currentLoan.id,
        user?.id || 1
      );

      if (response.success) {
        message.success('Loan closed successfully');
        loadLoan(currentLoan.id);
        setCloseModalVisible(false);
        closeForm.resetFields();
      } else {
        message.error(response.message || 'Failed to close loan');
      }
    } catch (error) {
      console.error('Error closing loan:', error);
      message.error('An error occurred while closing loan');
    }
  };

  /**
   * Handle foreclose loan
   */
  const handleForecloseLoan = async (values: any) => {
    if (!currentLoan) return;

    try {
      const forecloseData = {
        foreclosure_date: values.foreclosure_date.format('YYYY-MM-DD'),
        foreclosure_reason: values.foreclosure_reason,
        sale_method: values.sale_method,
        notes: values.notes || null,
      };

      const response = await window.electronAPI.goldLoan.foreclose(
        currentLoan.id,
        forecloseData,
        user?.id || 1
      );

      if (response.success) {
        message.success('Loan foreclosed successfully');
        loadLoan(currentLoan.id);
        setForecloseModalVisible(false);
        forecloseForm.resetFields();
      } else {
        message.error(response.message || 'Failed to foreclose loan');
      }
    } catch (error) {
      console.error('Error foreclosing loan:', error);
      message.error('An error occurred while foreclosing loan');
    }
  };

  /**
   * Print handler
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sanctioned: 'blue',
      disbursed: 'cyan',
      active: 'green',
      partial_repaid: 'orange',
      closed: 'default',
      defaulted: 'red',
      foreclosed: 'purple',
    };
    return colors[status] || 'default';
  };

  /**
   * Get risk level color
   */
  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      low: 'green',
      medium: 'orange',
      high: 'red',
    };
    return colors[riskLevel] || 'default';
  };

  /**
   * Payment history table columns
   */
  const paymentColumns: ColumnsType<LoanPayment> = [
    {
      title: 'Payment #',
      dataIndex: 'payment_number',
      key: 'payment_number',
      width: 140,
      render: (text: string, record: LoanPayment) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">
            {dayjs(record.payment_date).format('DD MMM YYYY')}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      width: 120,
      render: (type: string) => (
        <Tag>{type.replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Mode',
      dataIndex: 'payment_mode',
      key: 'payment_mode',
      width: 100,
      render: (mode: string) => mode.toUpperCase(),
    },
    {
      title: 'Principal',
      dataIndex: 'principal_amount',
      key: 'principal_amount',
      width: 110,
      align: 'right',
      render: (amount: number) => `₹${Number(amount).toFixed(2)}`,
    },
    {
      title: 'Interest',
      dataIndex: 'interest_amount',
      key: 'interest_amount',
      width: 110,
      align: 'right',
      render: (amount: number) => `₹${Number(amount).toFixed(2)}`,
    },
    {
      title: 'Penalty',
      dataIndex: 'penalty_amount',
      key: 'penalty_amount',
      width: 100,
      align: 'right',
      render: (amount: number) => (
        <span className={Number(amount) > 0 ? 'text-red-600' : ''}>
          ₹{Number(amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <span className="font-semibold">₹{Number(amount).toFixed(2)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status: string) => (
        <Tag
          color={
            status === 'verified'
              ? 'green'
              : status === 'cleared'
              ? 'blue'
              : status === 'bounced'
              ? 'red'
              : 'default'
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  if (!currentLoan) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card>Loading loan details...</Card>
      </div>
    );
  }

  const repaymentPercentage =
    currentLoan.total_payable > 0
      ? (currentLoan.amount_paid / currentLoan.total_payable) * 100
      : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 no-print">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/gold-loans')}
          className="mb-4"
        >
          Back to Loans
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">{currentLoan.loan_number}</h1>
            <p className="text-gray-600">{currentLoan.customer_name}</p>
          </div>

          <Space>
            <Tag color={getStatusColor(currentLoan.status)}>
              {currentLoan.status.replace(/_/g, ' ').toUpperCase()}
            </Tag>
            <Tag color={getRiskColor(currentLoan.risk_level)}>
              {currentLoan.risk_level.toUpperCase()} RISK
            </Tag>
            {currentLoan.is_overdue && (
              <Tag color="red" icon={<WarningOutlined />}>
                OVERDUE {currentLoan.days_overdue} DAYS
              </Tag>
            )}
          </Space>
        </div>

        <Space className="mt-4">
          {currentLoan.status === 'active' && (
            <>
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setPaymentModalVisible(true)}
              >
                Record Payment
              </Button>
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => setCloseModalVisible(true)}
                disabled={currentLoan.balance_due > 0}
              >
                Close Loan
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setForecloseModalVisible(true)}
              >
                Foreclose
              </Button>
            </>
          )}
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </Space>
      </div>

      {/* Overdue Alert */}
      {currentLoan.is_overdue && (
        <Alert
          message={`This loan is overdue by ${currentLoan.days_overdue} days`}
          description={`Maturity date was ${dayjs(currentLoan.maturity_date).format('DD MMM YYYY')}`}
          type="error"
          showIcon
          className="mb-4 no-print"
        />
      )}

      {/* Summary Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Loan Amount"
              value={currentLoan.loan_amount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Payable"
              value={currentLoan.total_payable}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#ff7a45' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Amount Paid"
              value={currentLoan.amount_paid}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Balance Due"
              value={currentLoan.balance_due}
              prefix="₹"
              precision={2}
              valueStyle={{ color: currentLoan.balance_due > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Repayment Progress */}
      <Card className="mb-6">
        <div className="mb-2">
          <span className="font-medium">Repayment Progress</span>
        </div>
        <Progress
          percent={Number(repaymentPercentage.toFixed(2))}
          status={
            currentLoan.balance_due === 0
              ? 'success'
              : currentLoan.is_overdue
              ? 'exception'
              : 'active'
          }
          strokeColor={
            currentLoan.balance_due === 0
              ? '#52c41a'
              : currentLoan.is_overdue
              ? '#ff4d4f'
              : '#1890ff'
          }
        />
      </Card>

      {/* Tabbed Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Customer & Loan Details Tab */}
          <Tabs.TabPane tab="Customer & Loan Details" key="details">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Customer Information" className="mb-4">
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Name">
                      {currentLoan.customer_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mobile">
                      {currentLoan.customer_mobile}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {currentLoan.customer_address || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Aadhar">
                      {currentLoan.customer_aadhar || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="PAN">
                      {currentLoan.customer_pan || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Loan Details" className="mb-4">
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Loan Number">
                      {currentLoan.loan_number}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loan Date">
                      {dayjs(currentLoan.loan_date).format('DD MMM YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Disbursement Date">
                      {currentLoan.disbursed_date
                        ? dayjs(currentLoan.disbursed_date).format('DD MMM YYYY')
                        : 'Not Disbursed'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Maturity Date">
                      {dayjs(currentLoan.maturity_date).format('DD MMM YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tenure">
                      {currentLoan.tenure_months} months
                    </Descriptions.Item>
                    <Descriptions.Item label="Interest Rate">
                      {currentLoan.interest_rate}% per annum
                    </Descriptions.Item>
                    <Descriptions.Item label="Interest Type">
                      {currentLoan.interest_calculation_type.replace(/_/g, ' ').toUpperCase()}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card title="Charges & Fees">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Loan Amount">
                  ₹{Number(currentLoan.loan_amount).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Total Interest">
                  ₹{Number(currentLoan.total_interest).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Processing Fee">
                  ₹{Number(currentLoan.processing_fee).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="Total Payable">
                  ₹{Number(currentLoan.total_payable).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="LTV Ratio">
                  {currentLoan.ltv_ratio}%
                </Descriptions.Item>
                <Descriptions.Item label="Appraised Value">
                  ₹{Number(currentLoan.appraised_value).toFixed(2)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Tabs.TabPane>

          {/* Collateral Details Tab */}
          <Tabs.TabPane tab="Collateral Details" key="collateral">
            <Card title="Gold Item Details" className="mb-4">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Item Description" span={2}>
                  {currentLoan.item_description}
                </Descriptions.Item>
                <Descriptions.Item label="Gross Weight">
                  {Number(currentLoan.gross_weight).toFixed(3)} g
                </Descriptions.Item>
                <Descriptions.Item label="Stone Weight">
                  {Number(currentLoan.stone_weight).toFixed(3)} g
                </Descriptions.Item>
                <Descriptions.Item label="Net Weight">
                  {Number(currentLoan.net_weight).toFixed(3)} g
                </Descriptions.Item>
                <Descriptions.Item label="Purity">
                  {Number(currentLoan.purity_percentage).toFixed(2)}%
                </Descriptions.Item>
                <Descriptions.Item label="Fine Weight">
                  {Number(currentLoan.fine_weight).toFixed(3)} g
                </Descriptions.Item>
                <Descriptions.Item label="Current Gold Rate">
                  ₹{Number(currentLoan.current_gold_rate).toFixed(2)} / g
                </Descriptions.Item>
                <Descriptions.Item label="Appraised Value">
                  ₹{Number(currentLoan.appraised_value).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="LTV Ratio">
                  {currentLoan.ltv_ratio}%
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {currentLoan.item_photos && currentLoan.item_photos.length > 0 && (
              <Card title="Item Photos" className="mb-4">
                <Image.PreviewGroup>
                  <div className="grid grid-cols-4 gap-4">
                    {currentLoan.item_photos.map((photo, index) => (
                      <Image
                        key={index}
                        src={photo}
                        alt={`Item photo ${index + 1}`}
                        className="rounded"
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </Card>
            )}

            {currentLoan.customer_photo && (
              <Card title="Customer Photo" className="mb-4">
                <Image
                  src={currentLoan.customer_photo}
                  alt="Customer photo"
                  width={200}
                  className="rounded"
                />
              </Card>
            )}

            {currentLoan.documents && currentLoan.documents.length > 0 && (
              <Card title="Documents" className="mb-4">
                <ul className="list-disc pl-5">
                  {currentLoan.documents.map((doc, index) => (
                    <li key={index}>
                      <a href={doc} target="_blank" rel="noopener noreferrer">
                        Document {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {currentLoan.agreement_terms && (
              <Card title="Agreement Terms" className="mb-4">
                <div className="whitespace-pre-wrap">{currentLoan.agreement_terms}</div>
              </Card>
            )}

            {currentLoan.special_conditions && (
              <Card title="Special Conditions">
                <div className="whitespace-pre-wrap">{currentLoan.special_conditions}</div>
              </Card>
            )}
          </Tabs.TabPane>

          {/* Payment History Tab */}
          <Tabs.TabPane tab="Payment History" key="payments">
            {payments.length > 0 && (
              <Card className="mb-4">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Total Principal Paid"
                      value={payments.reduce(
                        (sum, p) => sum + Number(p.principal_amount),
                        0
                      )}
                      prefix="₹"
                      precision={2}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Total Interest Paid"
                      value={payments.reduce(
                        (sum, p) => sum + Number(p.interest_amount),
                        0
                      )}
                      prefix="₹"
                      precision={2}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Total Penalties"
                      value={payments.reduce(
                        (sum, p) => sum + Number(p.penalty_amount),
                        0
                      )}
                      prefix="₹"
                      precision={2}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            <Table
              dataSource={payments}
              columns={paymentColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
              size="small"
            />
          </Tabs.TabPane>

          {/* Notes Tab */}
          <Tabs.TabPane tab="Notes & Remarks" key="notes">
            <Card>
              {currentLoan.notes ? (
                <div className="whitespace-pre-wrap">{currentLoan.notes}</div>
              ) : (
                <p className="text-gray-500">No notes available</p>
              )}
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Payment Modal */}
      <Modal
        title="Record Payment"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        onOk={() => paymentForm.submit()}
        width={600}
        className="no-print"
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleRecordPayment}
          initialValues={{
            payment_date: dayjs(),
            payment_type: 'partial',
            payment_mode: 'cash',
            penalty_amount: 0,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Payment Date"
                name="payment_date"
                rules={[{ required: true, message: 'Please select payment date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Payment Type"
                name="payment_type"
                rules={[{ required: true, message: 'Please select payment type' }]}
              >
                <Select>
                  <Option value="partial">Partial</Option>
                  <Option value="full">Full</Option>
                  <Option value="interest_only">Interest Only</Option>
                  <Option value="principal_only">Principal Only</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Payment Mode"
            name="payment_mode"
            rules={[{ required: true, message: 'Please select payment mode' }]}
          >
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="upi">UPI</Option>
              <Option value="bank_transfer">Bank Transfer</Option>
              <Option value="cheque">Cheque</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Principal Amount"
                name="principal_amount"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  precision={2}
                  prefix="₹"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Interest Amount"
                name="interest_amount"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  precision={2}
                  prefix="₹"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Penalty Amount" name="penalty_amount">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  precision={2}
                  prefix="₹"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Transaction Reference" name="transaction_reference">
            <Input placeholder="Transaction ID / Reference number" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Any additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Close Loan Modal */}
      <Modal
        title="Close Loan"
        open={closeModalVisible}
        onCancel={() => {
          setCloseModalVisible(false);
          closeForm.resetFields();
        }}
        onOk={() => closeForm.submit()}
        className="no-print"
      >
        <Alert
          message="Confirm Loan Closure"
          description="Please ensure all payments have been received and the collateral is ready to be returned to the customer."
          type="info"
          showIcon
          className="mb-4"
        />

        <Form form={closeForm} layout="vertical" onFinish={handleCloseLoan}>
          <Form.Item label="Release Date" name="release_date">
            <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
          </Form.Item>

          <Form.Item label="Return Method" name="return_method">
            <Select placeholder="How was the collateral returned?">
              <Option value="in_person">In Person</Option>
              <Option value="courier">Courier</Option>
              <Option value="third_party">Through Third Party</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Comments" name="comments">
            <TextArea rows={3} placeholder="Any closing notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Foreclose Modal */}
      <Modal
        title="Foreclose Loan"
        open={forecloseModalVisible}
        onCancel={() => {
          setForecloseModalVisible(false);
          forecloseForm.resetFields();
        }}
        onOk={() => forecloseForm.submit()}
        className="no-print"
      >
        <Alert
          message="Warning: Foreclosure Action"
          description="This action will foreclose the loan and mark the collateral for sale. This action cannot be undone."
          type="error"
          showIcon
          className="mb-4"
        />

        <Form
          form={forecloseForm}
          layout="vertical"
          onFinish={handleForecloseLoan}
          initialValues={{
            foreclosure_date: dayjs(),
          }}
        >
          <Form.Item
            label="Foreclosure Date"
            name="foreclosure_date"
            rules={[{ required: true, message: 'Please select foreclosure date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Foreclosure Reason"
            name="foreclosure_reason"
            rules={[{ required: true, message: 'Please select reason' }]}
          >
            <Select>
              <Option value="default">Payment Default</Option>
              <Option value="overdue">Extended Overdue</Option>
              <Option value="customer_request">Customer Request</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Sale Method" name="sale_method">
            <Select placeholder="How will collateral be sold?">
              <Option value="auction">Auction</Option>
              <Option value="market">Market Sale</Option>
              <Option value="private">Private Sale</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Additional details..." />
          </Form.Item>
        </Form>
      </Modal>

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GoldLoanDetail;
