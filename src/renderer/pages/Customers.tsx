import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setCustomers,
  setCurrentCustomer,
  setLoading,
  setError,
  addCustomer,
  updateCustomer as updateCustomerAction,
  removeCustomer,
  setFilters,
} from '../store/slices/customerSlice';

/**
 * Customers Management Page
 */
const Customers: React.FC = () => {
  const dispatch = useDispatch();
  const { customers, currentCustomer, filters, loading, error } = useSelector(
    (state: RootState) => state.customer
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'details'>('basic');

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
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.customer.getAll({ is_active: true });
      if (response.success) {
        dispatch(setCustomers({ customers: response.data }));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load customers'));
    }
  };

  const handleOpenModal = async (customer?: any) => {
    if (customer) {
      setEditMode(true);
      setFormData({
        customer_code: customer.customer_code,
        customer_type: customer.customer_type,
        first_name: customer.first_name,
        last_name: customer.last_name || '',
        mobile: customer.mobile,
        alternate_mobile: customer.alternate_mobile || '',
        email: customer.email || '',
        pan_number: customer.pan_number || '',
        aadhar_number: customer.aadhar_number || '',
        gstin: customer.gstin || '',
        address_line1: customer.address_line1 || '',
        address_line2: customer.address_line2 || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        country: customer.country || 'India',
        date_of_birth: customer.date_of_birth || '',
        anniversary_date: customer.anniversary_date || '',
        credit_limit: customer.credit_limit || 0,
        credit_days: customer.credit_days || 0,
        discount_percentage: customer.discount_percentage || 0,
        notes: customer.notes || '',
      });
      dispatch(setCurrentCustomer(customer));
    } else {
      setEditMode(false);
      // Generate customer code
      const codeResponse = await window.electronAPI.customer.generateCode();
      setFormData({
        customer_code: codeResponse.success ? codeResponse.data.customer_code : '',
        customer_type: 'retail',
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
    }
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setActiveTab('basic');
    setFormData({
      customer_code: '',
      customer_type: 'retail',
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
    dispatch(setCurrentCustomer(null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      dispatch(setLoading(true));

      const submitData: any = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        anniversary_date: formData.anniversary_date || null,
      };

      if (editMode && currentCustomer) {
        const response = await window.electronAPI.customer.update(
          currentCustomer.id,
          submitData,
          user.id
        );
        if (response.success) {
          dispatch(updateCustomerAction(response.data));
          alert('Customer updated successfully!');
        } else {
          alert(response.message);
        }
      } else {
        const response = await window.electronAPI.customer.create({
          ...submitData,
          created_by: user.id,
        });
        if (response.success) {
          dispatch(addCustomer(response.data));
          alert('Customer created successfully!');
        } else {
          alert(response.message);
        }
      }

      handleCloseModal();
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (customerId: number) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const response = await window.electronAPI.customer.delete(customerId, user.id);
      if (response.success) {
        dispatch(removeCustomer(customerId));
        loadCustomers();
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  const getFullName = (customer: any) => {
    return customer.last_name
      ? `${customer.first_name} ${customer.last_name}`
      : customer.first_name;
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesType = !selectedType || customer.customer_type === selectedType;
    const matchesSearch =
      !searchTerm ||
      getFullName(customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'retail':
        return 'bg-blue-100 text-blue-800';
      case 'wholesale':
        return 'bg-green-100 text-green-800';
      case 'vip':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer database</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, mobile, or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-64">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Customer Types</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No customers found. Create your first customer!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getFullName(customer)}
                        </p>
                        <p className="text-sm text-gray-500">{customer.customer_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {customer.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getTypeBadgeClass(
                          customer.customer_type
                        )}`}
                      >
                        {customer.customer_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {customer.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{Number(customer.outstanding_balance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editMode ? 'Edit Customer' : 'Add New Customer'}
              </h2>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'basic'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Info
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'address'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('address')}
                >
                  Address
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('details')}
                >
                  Additional Details
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({ ...formData, first_name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({ ...formData, last_name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Code
                        </label>
                        <input
                          type="text"
                          value={formData.customer_code}
                          onChange={(e) =>
                            setFormData({ ...formData, customer_code: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          readOnly={!editMode}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Customer Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.customer_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customer_type: e.target.value as 'retail' | 'wholesale' | 'vip',
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="retail">Retail</option>
                          <option value="wholesale">Wholesale</option>
                          <option value="vip">VIP</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) =>
                            setFormData({ ...formData, mobile: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          pattern="[0-9]{10,15}"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Mobile
                        </label>
                        <input
                          type="tel"
                          value={formData.alternate_mobile}
                          onChange={(e) =>
                            setFormData({ ...formData, alternate_mobile: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          pattern="[0-9]{10,15}"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Address Tab */}
                {activeTab === 'address' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={formData.address_line1}
                        onChange={(e) =>
                          setFormData({ ...formData, address_line1: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={formData.address_line2}
                        onChange={(e) =>
                          setFormData({ ...formData, address_line2: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({ ...formData, pincode: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          value={formData.pan_number}
                          onChange={(e) =>
                            setFormData({ ...formData, pan_number: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="AAAAA9999A"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aadhar Number
                        </label>
                        <input
                          type="text"
                          value={formData.aadhar_number}
                          onChange={(e) =>
                            setFormData({ ...formData, aadhar_number: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="999999999999"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          value={formData.gstin}
                          onChange={(e) =>
                            setFormData({ ...formData, gstin: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) =>
                            setFormData({ ...formData, date_of_birth: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Anniversary Date
                        </label>
                        <input
                          type="date"
                          value={formData.anniversary_date}
                          onChange={(e) =>
                            setFormData({ ...formData, anniversary_date: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Credit Limit (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.credit_limit}
                          onChange={(e) =>
                            setFormData({ ...formData, credit_limit: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Credit Days
                        </label>
                        <input
                          type="number"
                          value={formData.credit_days}
                          onChange={(e) =>
                            setFormData({ ...formData, credit_days: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount_percentage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discount_percentage: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editMode ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
