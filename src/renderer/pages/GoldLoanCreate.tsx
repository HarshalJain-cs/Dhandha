import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  message,
  Row,
  Col,
  Descriptions,
  Upload,
  Divider,
  InputNumber,
} from 'antd';
import {
  SaveOutlined,
  InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import type { UploadFile } from 'antd/es/upload/interface';

const { Option } = Select;
const { TextArea } = Input;

type TabType = 'collateral' | 'valuation' | 'documentation';

interface FormData {
  customer_id: number | '';
  item_description: string;
  gross_weight: number | '';
  stone_weight: number | '';
  purity_percentage: number | '';
  current_gold_rate: number | '';
  ltv_ratio: number;
  loan_amount: number | '';
  interest_rate: number | '';
  interest_calculation_type: 'monthly' | 'quarterly' | 'maturity';
  tenure_months: number | '';
  processing_fee: number | '';
  item_photos: UploadFile[];
  customer_photo: UploadFile | null;
  documents: UploadFile[];
  agreement_terms: string;
  special_conditions: string;
  notes: string;
}

interface Calculations {
  netWeight: number;
  fineWeight: number;
  marketValue: number;
  appraisedValue: number;
  monthlyInterest: number;
  totalInterest: number;
  totalPayable: number;
}

const GoldLoanCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('collateral');
  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    item_description: '',
    gross_weight: '',
    stone_weight: 0,
    purity_percentage: '',
    current_gold_rate: '',
    ltv_ratio: 75,
    loan_amount: '',
    interest_rate: '',
    interest_calculation_type: 'monthly',
    tenure_months: '',
    processing_fee: 0,
    item_photos: [],
    customer_photo: null,
    documents: [],
    agreement_terms: '',
    special_conditions: '',
    notes: '',
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [calculations, setCalculations] = useState<Calculations>({
    netWeight: 0,
    fineWeight: 0,
    marketValue: 0,
    appraisedValue: 0,
    monthlyInterest: 0,
    totalInterest: 0,
    totalPayable: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    calculateLoanDetails();
  }, [
    formData.gross_weight,
    formData.stone_weight,
    formData.purity_percentage,
    formData.current_gold_rate,
    formData.ltv_ratio,
    formData.loan_amount,
    formData.interest_rate,
    formData.interest_calculation_type,
    formData.tenure_months,
    formData.processing_fee,
  ]);

  const loadCustomers = async () => {
    try {
      const response = await window.electronAPI.customer.getAll({ is_active: true });
      if (response.success) {
        setCustomers(response.data.customers || response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      message.error('Failed to load customers');
    }
  };

  const calculateLoanDetails = () => {
    const grossWeight = Number(formData.gross_weight) || 0;
    const stoneWeight = Number(formData.stone_weight) || 0;
    const purity = Number(formData.purity_percentage) || 0;
    const goldRate = Number(formData.current_gold_rate) || 0;
    const ltvRatio = Number(formData.ltv_ratio) || 75;
    const loanAmount = Number(formData.loan_amount) || 0;
    const interestRate = Number(formData.interest_rate) || 0;
    const tenure = Number(formData.tenure_months) || 0;
    const processingFee = Number(formData.processing_fee) || 0;

    const netWeight = grossWeight - stoneWeight;
    const fineWeight = (netWeight * purity) / 100;
    const marketValue = fineWeight * goldRate;
    const appraisedValue = (marketValue * ltvRatio) / 100;

    let monthlyInterest = 0;
    let totalInterest = 0;

    if (loanAmount > 0 && interestRate > 0 && tenure > 0) {
      if (formData.interest_calculation_type === 'monthly') {
        monthlyInterest = (loanAmount * (interestRate / 12)) / 100;
        totalInterest = monthlyInterest * tenure;
      } else if (formData.interest_calculation_type === 'quarterly') {
        const quarterlyInterest = (loanAmount * (interestRate / 4)) / 100;
        const quarters = Math.ceil(tenure / 3);
        totalInterest = quarterlyInterest * quarters;
      } else if (formData.interest_calculation_type === 'maturity') {
        totalInterest = (loanAmount * interestRate * (tenure / 12)) / 100;
      }
    }

    const totalPayable = loanAmount + totalInterest + processingFee;

    setCalculations({
      netWeight: parseFloat(netWeight.toFixed(3)),
      fineWeight: parseFloat(fineWeight.toFixed(3)),
      marketValue: parseFloat(marketValue.toFixed(2)),
      appraisedValue: parseFloat(appraisedValue.toFixed(2)),
      monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      totalPayable: parseFloat(totalPayable.toFixed(2)),
    });

    // Auto-set loan amount if not manually entered
    if (!formData.loan_amount && appraisedValue > 0) {
      setFormData((prev) => ({ ...prev, loan_amount: parseFloat(appraisedValue.toFixed(2)) }));
    }
  };

  const validateTab = (tab: TabType): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (tab === 'collateral') {
      if (!formData.customer_id) errors.push('Customer is required');
      if (!formData.gross_weight || Number(formData.gross_weight) <= 0)
        errors.push('Gross weight must be greater than 0');
      if (!formData.purity_percentage) errors.push('Purity is required');
      if (!formData.item_description) errors.push('Item description is required');
    }

    if (tab === 'valuation') {
      if (!formData.current_gold_rate) errors.push('Gold rate is required');
      if (!formData.loan_amount || Number(formData.loan_amount) <= 0)
        errors.push('Loan amount must be greater than 0');
      if (!formData.interest_rate) errors.push('Interest rate is required');
      if (!formData.tenure_months) errors.push('Tenure is required');
    }

    if (tab === 'documentation') {
      if (!formData.item_photos || formData.item_photos.length === 0)
        errors.push('At least one item photo is required');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleNextTab = () => {
    const validation = validateTab(activeTab);
    if (!validation.valid) {
      message.error(validation.errors.join(', '));
      return;
    }

    const tabs: TabType[] = ['collateral', 'valuation', 'documentation'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevTab = () => {
    const tabs: TabType[] = ['collateral', 'valuation', 'documentation'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleCreateLoan = async () => {
    // Validate all tabs
    const tabs: TabType[] = ['collateral', 'valuation', 'documentation'];
    for (const tab of tabs) {
      const validation = validateTab(tab);
      if (!validation.valid) {
        message.error(`${tab}: ${validation.errors.join(', ')}`);
        setActiveTab(tab);
        return;
      }
    }

    setLoading(true);

    try {
      const goldLoanData = {
        customer_id: formData.customer_id,
        item_description: formData.item_description,
        gross_weight: Number(formData.gross_weight),
        stone_weight: Number(formData.stone_weight || 0),
        purity_percentage: Number(formData.purity_percentage),
        current_gold_rate: Number(formData.current_gold_rate),
        ltv_ratio: Number(formData.ltv_ratio),
        loan_amount: Number(formData.loan_amount),
        interest_rate: Number(formData.interest_rate),
        interest_calculation_type: formData.interest_calculation_type,
        tenure_months: Number(formData.tenure_months),
        processing_fee: Number(formData.processing_fee || 0),
        agreement_terms: formData.agreement_terms,
        special_conditions: formData.special_conditions,
        notes: formData.notes,
      };

      const response = await window.electronAPI.goldLoan.create(goldLoanData, user?.id || 1);

      if (response.success) {
        message.success('Gold loan created successfully');
        navigate(`/gold-loans/${response.data.id}`);
      } else {
        message.error(response.message || 'Failed to create gold loan');
      }
    } catch (error) {
      console.error('Error creating gold loan:', error);
      message.error('An error occurred while creating gold loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Gold Loan</h1>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            {[
              { key: 'collateral', label: 'Customer & Collateral' },
              { key: 'valuation', label: 'Valuation & Loan Terms' },
              { key: 'documentation', label: 'Documentation' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.key as TabType)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Customer & Collateral */}
          {activeTab === 'collateral' && (
            <Card className="mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <Select
                    showSearch
                    placeholder="Search customer by name or mobile"
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={customers.map((c) => ({
                      label: `${c.name} - ${c.mobile}`,
                      value: c.id,
                    }))}
                    onChange={(value) => {
                      const customer = customers.find((c) => c.id === value);
                      setFormData({ ...formData, customer_id: value });
                      setSelectedCustomer(customer);
                    }}
                    value={formData.customer_id || undefined}
                  />
                </div>

                {selectedCustomer && (
                  <Descriptions size="small" column={2} bordered>
                    <Descriptions.Item label="Name">{selectedCustomer.name}</Descriptions.Item>
                    <Descriptions.Item label="Mobile">{selectedCustomer.mobile}</Descriptions.Item>
                    <Descriptions.Item label="Address">{selectedCustomer.address || 'N/A'}</Descriptions.Item>
                  </Descriptions>
                )}

                <Divider />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Weight (g) <span className="text-red-500">*</span>
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      step={0.001}
                      precision={3}
                      value={formData.gross_weight}
                      onChange={(val) => setFormData({ ...formData, gross_weight: val || '' })}
                      placeholder="0.000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stone Weight (g)
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      step={0.001}
                      precision={3}
                      value={formData.stone_weight}
                      onChange={(val) => setFormData({ ...formData, stone_weight: val || 0 })}
                      placeholder="0.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purity (%) <span className="text-red-500">*</span>
                  </label>
                  <Select
                    style={{ width: '100%' }}
                    value={formData.purity_percentage}
                    onChange={(val) => setFormData({ ...formData, purity_percentage: val })}
                    placeholder="Select purity"
                  >
                    <Option value={99.9}>24K (99.9%)</Option>
                    <Option value={91.6}>22K (91.6%)</Option>
                    <Option value={75.0}>18K (75.0%)</Option>
                    <Option value={58.5}>14K (58.5%)</Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Description <span className="text-red-500">*</span>
                  </label>
                  <TextArea
                    rows={3}
                    value={formData.item_description}
                    onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                    placeholder="Describe the collateral item (e.g., Gold bangles, necklace with stones)"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Tab 2: Valuation & Loan Terms */}
          {activeTab === 'valuation' && (
            <Card className="mb-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Gold Rate (₹/g) <span className="text-red-500">*</span>
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      precision={2}
                      value={formData.current_gold_rate}
                      onChange={(val) => setFormData({ ...formData, current_gold_rate: val || '' })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LTV Ratio (%)
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={60}
                      max={80}
                      value={formData.ltv_ratio}
                      onChange={(val) => setFormData({ ...formData, ltv_ratio: val || 75 })}
                    />
                  </div>
                </div>

                {calculations.fineWeight > 0 && (
                  <Card className="bg-blue-50 border border-blue-200">
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="Net Weight">
                        {calculations.netWeight}g
                      </Descriptions.Item>
                      <Descriptions.Item label="Fine Weight">
                        {calculations.fineWeight}g
                      </Descriptions.Item>
                      <Descriptions.Item label="Market Value">
                        ₹{calculations.marketValue.toFixed(2)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Appraised Value (LTV)">
                        <span className="font-semibold">
                          ₹{calculations.appraisedValue.toFixed(2)}
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}

                <Divider />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      precision={2}
                      value={formData.loan_amount}
                      onChange={(val) => setFormData({ ...formData, loan_amount: val || '' })}
                      max={calculations.appraisedValue}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (% p.a.) <span className="text-red-500">*</span>
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      step={0.1}
                      precision={2}
                      value={formData.interest_rate}
                      onChange={(val) => setFormData({ ...formData, interest_rate: val || '' })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Calculation Type
                    </label>
                    <Select
                      style={{ width: '100%' }}
                      value={formData.interest_calculation_type}
                      onChange={(val) => setFormData({ ...formData, interest_calculation_type: val })}
                    >
                      <Option value="monthly">Monthly</Option>
                      <Option value="quarterly">Quarterly</Option>
                      <Option value="maturity">At Maturity</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tenure (Months) <span className="text-red-500">*</span>
                    </label>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      value={formData.tenure_months}
                      onChange={(val) => setFormData({ ...formData, tenure_months: val || '' })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Fee (₹)
                  </label>
                  <InputNumber
                    style={{ width: '100%' }}
                    precision={2}
                    value={formData.processing_fee}
                    onChange={(val) => setFormData({ ...formData, processing_fee: val || 0 })}
                    placeholder="0.00"
                  />
                </div>

                {calculations.totalInterest > 0 && (
                  <Card className="bg-green-50 border border-green-200">
                    <Descriptions column={2} size="small">
                      {formData.interest_calculation_type === 'monthly' && (
                        <Descriptions.Item label="Monthly Interest">
                          ₹{calculations.monthlyInterest.toFixed(2)}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Total Interest">
                        ₹{calculations.totalInterest.toFixed(2)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Payable">
                        <span className="font-semibold text-lg">
                          ₹{calculations.totalPayable.toFixed(2)}
                        </span>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}
              </div>
            </Card>
          )}

          {/* Tab 3: Documentation */}
          {activeTab === 'documentation' && (
            <Card className="mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Photos <span className="text-red-500">*</span>
                  </label>
                  <Upload.Dragger
                    name="file"
                    multiple
                    listType="picture"
                    fileList={formData.item_photos}
                    onChange={(info) => {
                      setFormData({ ...formData, item_photos: info.fileList });
                    }}
                    beforeUpload={() => false}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag files to upload item photos</p>
                    <p className="ant-upload-hint">Supported formats: JPG, PNG (Max 5MB each)</p>
                  </Upload.Dragger>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents
                  </label>
                  <Upload.Dragger
                    name="file"
                    multiple
                    listType="text"
                    fileList={formData.documents}
                    onChange={(info) => {
                      setFormData({ ...formData, documents: info.fileList });
                    }}
                    beforeUpload={() => false}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag files to upload documents</p>
                  </Upload.Dragger>
                </div>

                <Divider />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agreement Terms
                  </label>
                  <TextArea
                    rows={3}
                    value={formData.agreement_terms}
                    onChange={(e) => setFormData({ ...formData, agreement_terms: e.target.value })}
                    placeholder="Standard loan agreement terms..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Conditions
                  </label>
                  <TextArea
                    rows={3}
                    value={formData.special_conditions}
                    onChange={(e) => setFormData({ ...formData, special_conditions: e.target.value })}
                    placeholder="Any special conditions or notes..."
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Tab Navigation Buttons */}
          <div className="flex gap-2 justify-between">
            <Button onClick={() => navigate('/gold-loans')}>Cancel</Button>
            <Space>
              {activeTab !== 'collateral' && (
                <Button onClick={handlePrevTab}>Previous</Button>
              )}
              {activeTab !== 'documentation' ? (
                <Button type="primary" onClick={handleNextTab}>
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleCreateLoan}
                  loading={loading}
                >
                  Create Loan
                </Button>
              )}
            </Space>
          </div>
        </Col>

        {/* Right Column - Summary */}
        <Col span={8}>
          <Card title="Loan Summary" className="sticky top-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Customer</h4>
                {selectedCustomer ? (
                  <p className="text-sm">{selectedCustomer.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Not selected</p>
                )}
              </div>

              <Divider className="my-3" />

              <div>
                <h4 className="font-semibold mb-2">Collateral</h4>
                <div className="text-sm space-y-1">
                  <p>Gross Weight: {formData.gross_weight || 0}g</p>
                  <p>Purity: {formData.purity_percentage || 0}%</p>
                  <p className="font-medium">Fine Weight: {calculations.fineWeight}g</p>
                </div>
              </div>

              <Divider className="my-3" />

              <div>
                <h4 className="font-semibold mb-2">Valuation</h4>
                <div className="text-sm space-y-1">
                  <p>Gold Rate: ₹{formData.current_gold_rate || 0}/g</p>
                  <p>Market Value: ₹{calculations.marketValue.toFixed(2)}</p>
                  <p className="font-medium">Appraised: ₹{calculations.appraisedValue.toFixed(2)}</p>
                </div>
              </div>

              <Divider className="my-3" />

              <div>
                <h4 className="font-semibold mb-2">Loan Details</h4>
                <div className="text-sm space-y-1">
                  <p>Loan Amount: ₹{formData.loan_amount || 0}</p>
                  <p>Interest Rate: {formData.interest_rate || 0}% p.a.</p>
                  <p>Tenure: {formData.tenure_months || 0} months</p>
                  <p className="font-medium text-lg text-green-600">
                    Total Payable: ₹{calculations.totalPayable.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GoldLoanCreate;
