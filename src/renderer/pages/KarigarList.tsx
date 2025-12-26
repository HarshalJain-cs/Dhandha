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
  Badge,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import {
  setKarigars,
  setCurrentKarigar,
  setLoading,
  setError,
  addKarigar,
  updateKarigar,
  removeKarigar,
  setKarigarFilters,
  setStats,
} from '../store/slices/karigarSlice';
import type { Karigar } from '../store/slices/karigarSlice';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * Karigar List Management Page
 */
const KarigarList: React.FC = () => {
  const dispatch = useDispatch();
  const { karigars, karigarFilters, loading, error, stats } = useSelector(
    (state: RootState) => state.karigar
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'payment' | 'documents'>('basic');
  const [form] = Form.useForm();

  useEffect(() => {
    loadKarigars();
    loadStats();
  }, []);

  useEffect(() => {
    loadKarigars();
  }, [karigarFilters]);

  const loadKarigars = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.karigar.getAll({ is_active: true }, undefined);
      if (response.success) {
        dispatch(setKarigars({ karigars: response.data }));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load karigars'));
    }
  };

  const loadStats = async () => {
    try {
      const response = await window.electronAPI.karigar.getStats(undefined);
      if (response.success) {
        dispatch(setStats(response.data));
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleOpenModal = async (karigar?: Karigar) => {
    if (karigar) {
      setEditMode(true);
      form.setFieldsValue({
        name: karigar.name,
        mobile: karigar.mobile,
        alternate_mobile: karigar.alternate_mobile || '',
        email: karigar.email || '',
        address: karigar.address || '',
        city: karigar.city || '',
        state: karigar.state || '',
        pincode: karigar.pincode || '',
        specialization: karigar.specialization,
        experience_years: karigar.experience_years,
        skill_level: karigar.skill_level,
        payment_type: karigar.payment_type,
        payment_rate: karigar.payment_rate,
        aadhar_number: karigar.aadhar_number || '',
        pan_number: karigar.pan_number || '',
        notes: karigar.notes || '',
      });
      dispatch(setCurrentKarigar(karigar));
    } else {
      setEditMode(false);
      form.resetFields();
      form.setFieldsValue({
        specialization: 'general',
        skill_level: 'beginner',
        payment_type: 'per_piece',
        experience_years: 0,
        payment_rate: 0,
      });
    }
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setActiveTab('basic');
    form.resetFields();
    dispatch(setCurrentKarigar(null));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      dispatch(setLoading(true));

      if (editMode) {
        const currentKarigar = karigars.find((k) => k.id === (form.getFieldValue('id') || 0));
        if (!currentKarigar) {
          message.error('Karigar not found');
          return;
        }

        const response = await window.electronAPI.karigar.update(
          currentKarigar.id,
          values,
          user?.id || 1
        );

        if (response.success) {
          dispatch(updateKarigar(response.data));
          message.success('Karigar updated successfully');
          handleCloseModal();
          loadStats();
        } else {
          message.error(response.message || 'Failed to update karigar');
          dispatch(setError(response.message));
        }
      } else {
        const response = await window.electronAPI.karigar.create(values, user?.id || 1);

        if (response.success) {
          dispatch(addKarigar(response.data));
          message.success('Karigar created successfully');
          handleCloseModal();
          loadStats();
        } else {
          message.error(response.message || 'Failed to create karigar');
          dispatch(setError(response.message));
        }
      }
    } catch (err: any) {
      console.error('Form validation failed:', err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (karigar: Karigar) => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.karigar.delete(karigar.id, user?.id || 1);

      if (response.success) {
        dispatch(removeKarigar(karigar.id));
        message.success('Karigar deleted successfully');
        loadStats();
      } else {
        message.error(response.message || 'Failed to delete karigar');
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to delete karigar');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSearch = (value: string) => {
    dispatch(setKarigarFilters({ ...karigarFilters, search: value }));
  };

  const handleFilterChange = (field: string, value: any) => {
    dispatch(setKarigarFilters({ ...karigarFilters, [field]: value }));
  };

  const getSpecializationColor = (specialization: string) => {
    const colors: Record<string, string> = {
      general: 'default',
      stone_setting: 'blue',
      polishing: 'green',
      casting: 'orange',
      designing: 'purple',
      engraving: 'cyan',
    };
    return colors[specialization] || 'default';
  };

  const getSkillLevelColor = (skillLevel: string) => {
    const colors: Record<string, string> = {
      beginner: 'default',
      intermediate: 'blue',
      expert: 'green',
      master: 'gold',
    };
    return colors[skillLevel] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      inactive: 'default',
      suspended: 'error',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'karigar_code',
      key: 'karigar_code',
      width: 140,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: Karigar) => (
        <Space>
          <UserOutlined />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
      width: 130,
    },
    {
      title: 'Specialization',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 140,
      render: (specialization: string) => (
        <Tag color={getSpecializationColor(specialization)}>
          {specialization.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Skill Level',
      dataIndex: 'skill_level',
      key: 'skill_level',
      width: 120,
      render: (skillLevel: string) => (
        <Tag color={getSkillLevelColor(skillLevel)}>{skillLevel.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
      render: (years: number) => `${years} years`,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Metal Account',
      key: 'metal_account',
      width: 150,
      render: (record: Karigar) => (
        <Space direction="vertical" size={0}>
          <span className="text-xs">Gold: {record.metal_account_gold.toFixed(3)}g</span>
          <span className="text-xs">Silver: {record.metal_account_silver.toFixed(3)}g</span>
        </Space>
      ),
    },
    {
      title: 'Orders',
      key: 'orders',
      width: 120,
      render: (record: Karigar) => (
        <Space direction="vertical" size={0}>
          <span className="text-xs">Pending: {record.total_orders_pending}</span>
          <span className="text-xs">Completed: {record.total_orders_completed}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Badge status={getStatusColor(status) as any} text={status.toUpperCase()} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (record: Karigar) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Karigar"
            description="Are you sure you want to delete this karigar?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Filter karigars based on filters
  const filteredKarigars = karigars.filter((karigar) => {
    if (karigarFilters.search) {
      const searchLower = karigarFilters.search.toLowerCase();
      if (
        !karigar.name.toLowerCase().includes(searchLower) &&
        !karigar.mobile.includes(searchLower) &&
        !karigar.karigar_code.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (karigarFilters.specialization && karigar.specialization !== karigarFilters.specialization) {
      return false;
    }
    if (karigarFilters.status && karigar.status !== karigarFilters.status) {
      return false;
    }
    if (karigarFilters.skill_level && karigar.skill_level !== karigarFilters.skill_level) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Karigar Management</h1>
          <p className="text-gray-600">Manage craftsmen and their details</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Karigar
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-gray-600 text-sm">Total Karigars</div>
            <div className="text-2xl font-bold">{stats.total_karigars}</div>
          </Card>
          <Card>
            <div className="text-gray-600 text-sm">Active Karigars</div>
            <div className="text-2xl font-bold text-green-600">{stats.active_karigars}</div>
          </Card>
          <Card>
            <div className="text-gray-600 text-sm">Pending Orders</div>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_orders}</div>
          </Card>
          <Card>
            <div className="text-gray-600 text-sm">Total Metal (Gold)</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.total_metal_gold.toFixed(2)}g
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <Space wrap>
          <Input
            placeholder="Search by name, mobile, or code"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Specialization"
            style={{ width: 180 }}
            onChange={(value) => handleFilterChange('specialization', value)}
            allowClear
          >
            <Option value="">All Specializations</Option>
            <Option value="general">General</Option>
            <Option value="stone_setting">Stone Setting</Option>
            <Option value="polishing">Polishing</Option>
            <Option value="casting">Casting</Option>
            <Option value="designing">Designing</Option>
            <Option value="engraving">Engraving</Option>
          </Select>
          <Select
            placeholder="Skill Level"
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('skill_level', value)}
            allowClear
          >
            <Option value="">All Levels</Option>
            <Option value="beginner">Beginner</Option>
            <Option value="intermediate">Intermediate</Option>
            <Option value="expert">Expert</Option>
            <Option value="master">Master</Option>
          </Select>
          <Select
            placeholder="Status"
            style={{ width: 120 }}
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
          >
            <Option value="">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="suspended">Suspended</Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredKarigars}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} karigars`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editMode ? 'Edit Karigar' : 'Add Karigar'}
        open={showModal}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        width={800}
        okText={editMode ? 'Update' : 'Create'}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Tabs activeKey={activeTab} onChange={(key: any) => setActiveTab(key)}>
            {/* Basic Details Tab */}
            <TabPane tab="Basic Details" key="basic">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter name' }]}
                >
                  <Input placeholder="Enter karigar name" />
                </Form.Item>

                <Form.Item
                  label="Mobile"
                  name="mobile"
                  rules={[
                    { required: true, message: 'Please enter mobile number' },
                    { pattern: /^[0-9]{10,15}$/, message: 'Invalid mobile number' },
                  ]}
                >
                  <Input placeholder="Enter mobile number" />
                </Form.Item>

                <Form.Item label="Alternate Mobile" name="alternate_mobile">
                  <Input placeholder="Enter alternate mobile" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ type: 'email', message: 'Invalid email' }]}
                >
                  <Input placeholder="Enter email" />
                </Form.Item>

                <Form.Item
                  label="Specialization"
                  name="specialization"
                  rules={[{ required: true, message: 'Please select specialization' }]}
                >
                  <Select placeholder="Select specialization">
                    <Option value="general">General</Option>
                    <Option value="stone_setting">Stone Setting</Option>
                    <Option value="polishing">Polishing</Option>
                    <Option value="casting">Casting</Option>
                    <Option value="designing">Designing</Option>
                    <Option value="engraving">Engraving</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Skill Level"
                  name="skill_level"
                  rules={[{ required: true, message: 'Please select skill level' }]}
                >
                  <Select placeholder="Select skill level">
                    <Option value="beginner">Beginner</Option>
                    <Option value="intermediate">Intermediate</Option>
                    <Option value="expert">Expert</Option>
                    <Option value="master">Master</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Experience (Years)"
                  name="experience_years"
                  rules={[{ required: true, message: 'Please enter experience' }]}
                >
                  <InputNumber min={0} max={50} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="City" name="city">
                  <Input placeholder="Enter city" />
                </Form.Item>

                <Form.Item label="State" name="state">
                  <Input placeholder="Enter state" />
                </Form.Item>

                <Form.Item label="Pincode" name="pincode">
                  <Input placeholder="Enter pincode" />
                </Form.Item>
              </div>

              <Form.Item label="Address" name="address">
                <TextArea rows={2} placeholder="Enter full address" />
              </Form.Item>
            </TabPane>

            {/* Payment Details Tab */}
            <TabPane tab="Payment Details" key="payment">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Payment Type"
                  name="payment_type"
                  rules={[{ required: true, message: 'Please select payment type' }]}
                >
                  <Select placeholder="Select payment type">
                    <Option value="per_piece">Per Piece</Option>
                    <Option value="per_gram">Per Gram</Option>
                    <Option value="daily_wage">Daily Wage</Option>
                    <Option value="monthly_salary">Monthly Salary</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Payment Rate (₹)"
                  name="payment_rate"
                  rules={[{ required: true, message: 'Please enter payment rate' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </TabPane>

            {/* Documents Tab */}
            <TabPane tab="Documents" key="documents">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Aadhar Number"
                  name="aadhar_number"
                  rules={[
                    { pattern: /^[0-9]{12}$/, message: 'Aadhar must be 12 digits' },
                  ]}
                >
                  <Input placeholder="Enter 12-digit Aadhar number" maxLength={12} />
                </Form.Item>

                <Form.Item
                  label="PAN Number"
                  name="pan_number"
                  rules={[
                    {
                      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                      message: 'Invalid PAN format',
                    },
                  ]}
                >
                  <Input placeholder="Enter PAN (e.g., ABCDE1234F)" maxLength={10} />
                </Form.Item>
              </div>

              <Form.Item label="Notes" name="notes">
                <TextArea rows={4} placeholder="Additional notes about the karigar" />
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </div>
  );
};

export default KarigarList;
