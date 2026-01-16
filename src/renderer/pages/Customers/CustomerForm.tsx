import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCustomer } from '../../store/slices/customerSlice';
import { Button, Card, Input, Select, DatePicker, Spinner } from '../../components/ui';
import { Tabs, notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

/**
 * CustomerForm Page
 * Handles both create and edit modes for customers
 */
const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCustomer, loading } = useAppSelector((state) => state.customer);
  const { user } = useAppSelector((state) => state.auth);

  const isEditMode = !!id;
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer_code: '',
    customer_type: 'retail' as 'retail' | 'wholesale' | 'vip',
    first_name: '',
    last_name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    pan_number: '',
    aadhar_number: '',
    gstin: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    date_of_birth: '',
    anniversary_date: '',
    credit_limit: 0,
    credit_days: 0,
    discount_percentage: 0,
    notes: '',
  });

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchCustomer(id));
    } else {
      // Generate customer code for new customer
      generateCustomerCode();
    }
  }, [id, isEditMode, dispatch]);

  useEffect(() => {
    if (isEditMode && currentCustomer) {
      setFormData({
        customer_code: currentCustomer.customer_code,
        customer_type: currentCustomer.customer_type,
        first_name: currentCustomer.first_name,
        last_name: currentCustomer.last_name || '',
        mobile: currentCustomer.mobile,
        alternate_mobile: currentCustomer.alternate_mobile || '',
        email: currentCustomer.email || '',
        pan_number: currentCustomer.pan_number || '',
        aadhar_number: currentCustomer.aadhar_number || '',
        gstin: currentCustomer.gstin || '',
        address_line1: currentCustomer.address_line1 || '',
        address_line2: currentCustomer.address_line2 || '',
        city: currentCustomer.city || '',
        state: currentCustomer.state || '',
        pincode: currentCustomer.pincode || '',
        country: currentCustomer.country || 'India',
        date_of_birth: currentCustomer.date_of_birth
          ? new Date(currentCustomer.date_of_birth).toISOString()
          : '',
        anniversary_date: currentCustomer.anniversary_date
          ? new Date(currentCustomer.anniversary_date).toISOString()
          : '',
        credit_limit: currentCustomer.credit_limit || 0,
        credit_days: currentCustomer.credit_days || 0,
        discount_percentage: currentCustomer.discount_percentage || 0,
        notes: currentCustomer.notes || '',
      });
    }
  }, [isEditMode, currentCustomer]);

  const generateCustomerCode = async () => {
    try {
      const response = await window.electronAPI.customer.generateCode();
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          customer_code: response.data.customer_code,
        }));
      }
    } catch (error) {
      console.error('Failed to generate customer code:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.first_name || !formData.mobile) {
      notification.error({
        message: 'Validation Error',
        description: 'First name and mobile number are required',
      });
      return;
    }

    setSaving(true);

    try {
      if (isEditMode && id) {
        const response = await window.electronAPI.customer.update(
          parseInt(id),
          formData,
          user?.id || 0
        );

        if (response.success) {
          notification.success({
            message: 'Success',
            description: 'Customer updated successfully',
          });
          navigate(`/customers/${id}`);
        } else {
          throw new Error(response.message);
        }
      } else {
        const response = await window.electronAPI.customer.create({
          ...formData,
          created_by: user?.id || 0,
        });

        if (response.success) {
          notification.success({
            message: 'Success',
            description: 'Customer created successfully',
          });
          navigate('/customers');
        } else {
          throw new Error(response.message);
        }
      }
    } catch (error: any) {
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to save customer',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isEditMode && (loading || !currentCustomer)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic Information',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer Code"
            value={formData.customer_code}
            onChange={(e) => handleChange('customer_code', e.target.value)}
            disabled
            required
          />

          <Select
            label="Customer Type"
            value={formData.customer_type}
            onChange={(value) => handleChange('customer_type', value)}
            options={[
              { value: 'retail', label: 'Retail' },
              { value: 'wholesale', label: 'Wholesale' },
              { value: 'vip', label: 'VIP' },
            ]}
            required
          />

          <Input
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            required
          />

          <Input
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
          />

          <Input
            label="Mobile"
            value={formData.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            type="tel"
            required
          />

          <Input
            label="Alternate Mobile"
            value={formData.alternate_mobile}
            onChange={(e) => handleChange('alternate_mobile', e.target.value)}
            type="tel"
          />

          <Input
            label="Email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            type="email"
          />
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Address Line 1"
              value={formData.address_line1}
              onChange={(e) => handleChange('address_line1', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Address Line 2"
              value={formData.address_line2}
              onChange={(e) => handleChange('address_line2', e.target.value)}
            />
          </div>

          <Input
            label="City"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />

          <Input
            label="State"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
          />

          <Input
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => handleChange('pincode', e.target.value)}
          />

          <Input
            label="Country"
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
          />
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Additional Details',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="PAN Number"
            value={formData.pan_number}
            onChange={(e) => handleChange('pan_number', e.target.value)}
          />

          <Input
            label="Aadhar Number"
            value={formData.aadhar_number}
            onChange={(e) => handleChange('aadhar_number', e.target.value)}
          />

          <Input
            label="GSTIN"
            value={formData.gstin}
            onChange={(e) => handleChange('gstin', e.target.value)}
          />

          <DatePicker
            label="Date of Birth"
            value={formData.date_of_birth}
            onChange={(value) => handleChange('date_of_birth', value)}
          />

          <DatePicker
            label="Anniversary Date"
            value={formData.anniversary_date}
            onChange={(value) => handleChange('anniversary_date', value)}
          />

          <Input
            label="Credit Limit (₹)"
            value={formData.credit_limit.toString()}
            onChange={(e) =>
              handleChange('credit_limit', parseFloat(e.target.value) || 0)
            }
            type="number"
          />

          <Input
            label="Credit Days"
            value={formData.credit_days.toString()}
            onChange={(e) =>
              handleChange('credit_days', parseInt(e.target.value) || 0)
            }
            type="number"
          />

          <Input
            label="Discount (%)"
            value={formData.discount_percentage.toString()}
            onChange={(e) =>
              handleChange('discount_percentage', parseFloat(e.target.value) || 0)
            }
            type="number"
          />

          <div className="md:col-span-2">
            <Input
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              type="textarea"
              rows={4}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/customers')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Customer' : 'Add New Customer'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode
                ? 'Update customer information'
                : 'Fill in the details to create a new customer'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => navigate('/customers')}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEditMode ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CustomerForm;
