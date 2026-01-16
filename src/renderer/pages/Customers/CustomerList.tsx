import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCustomers,
  setFilters,
  clearFilters,
  setPage,
  deleteCustomer,
} from '../../store/slices/customerSlice';
import {
  Button,
  SearchInput,
  Table,
  Badge,
  Pagination,
  EmptyState,
  ConfirmDialog,
  Card,
  Select,
} from '../../components/ui';
import { notification } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Customer } from '../../store/slices/customerSlice';

/**
 * CustomerList Page
 * Displays paginated list of customers with search and filter capabilities
 */
const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { customers, loading, filters, pagination } = useAppSelector(
    (state) => state.customer
  );

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    customerId: string | null;
  }>({ isOpen: false, customerId: null });

  useEffect(() => {
    dispatch(fetchCustomers({ filters, page: pagination.page }));
  }, [filters, pagination.page, dispatch]);

  const handleSearch = (searchTerm: string) => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handleFilterChange = (key: string, value: any) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handleDelete = async () => {
    if (deleteDialog.customerId) {
      try {
        await dispatch(deleteCustomer(deleteDialog.customerId)).unwrap();
        notification.success({
          message: 'Success',
          description: 'Customer deleted successfully',
        });
        setDeleteDialog({ isOpen: false, customerId: null });
        // Refresh the list
        dispatch(fetchCustomers({ filters, page: pagination.page }));
      } catch (error: any) {
        notification.error({
          message: 'Error',
          description: error || 'Failed to delete customer',
        });
      }
    }
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => {
      const value = filters[key as keyof typeof filters];
      return value !== undefined && value !== '' && value !== true; // true is default for is_active
    }
  );

  const columns: ColumnsType<Customer> = [
    {
      title: 'Code',
      dataIndex: 'customer_code',
      key: 'customer_code',
      width: 120,
    },
    {
      title: 'Name',
      key: 'name',
      render: (customer: Customer) => (
        <div>
          <div className="font-medium text-gray-900">
            {customer.first_name} {customer.last_name || ''}
          </div>
          {customer.mobile && (
            <div className="text-sm text-gray-500">{customer.mobile}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (city: string) => city || '-',
    },
    {
      title: 'Outstanding',
      dataIndex: 'outstanding_balance',
      key: 'outstanding_balance',
      render: (balance: number) => (
        <span
          className={
            balance > 0 ? 'font-medium text-red-600' : 'text-gray-900'
          }
        >
          ₹{balance.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Badge color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (customer: Customer) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/edit/${customer.id}`);
            }}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialog({ isOpen: true, customerId: customer.id.toString() });
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer database
          </p>
        </div>
        <Button type="primary" onClick={() => navigate('/customers/new')}>
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              placeholder="Search by name, code, phone, or email..."
              onSearch={handleSearch}
            />
          </div>

          <Select
            placeholder="Status"
            value={filters.is_active?.toString() || 'true'}
            onChange={(value) =>
              handleFilterChange(
                'is_active',
                value === '' ? undefined : value === 'true'
              )
            }
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />

          <Select
            placeholder="Outstanding"
            value={filters.has_outstanding?.toString() || ''}
            onChange={(value) =>
              handleFilterChange(
                'has_outstanding',
                value === '' ? undefined : value === 'true'
              )
            }
            options={[
              { value: '', label: 'All Customers' },
              { value: 'true', label: 'With Outstanding' },
              { value: 'false', label: 'No Outstanding' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            <Button type="link" onClick={handleClearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        {customers.length === 0 && !loading ? (
          <EmptyState
            icon="👥"
            title="No customers found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Get started by adding your first customer'
            }
            action={
              !hasActiveFilters
                ? {
                    label: 'Add Customer',
                    onClick: () => navigate('/customers/new'),
                  }
                : undefined
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={customers}
              loading={loading}
              rowKey="id"
              onRow={(customer) => ({
                onClick: () => navigate(`/customers/${customer.id}`),
                className: 'cursor-pointer hover:bg-gray-50',
              })}
              pagination={false}
            />

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => dispatch(setPage(page))}
              />
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.isOpen}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, customerId: null })}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default CustomerList;
