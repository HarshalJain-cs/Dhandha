import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCustomer, deleteCustomer } from '../../store/slices/customerSlice';
import { Button, Card, Badge, Spinner, ConfirmDialog, Table } from '../../components/ui';
import { notification } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

/**
 * CustomerDetail Page
 * Displays complete customer information and related data
 */
const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCustomer, loading } = useAppSelector((state) => state.customer);

  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomer(id));
    }
  }, [id, dispatch]);

  const handleDelete = async () => {
    if (id) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        notification.success({
          message: 'Success',
          description: 'Customer deleted successfully',
        });
        navigate('/customers');
      } catch (error: any) {
        notification.error({
          message: 'Error',
          description: error || 'Failed to delete customer',
        });
      }
    }
  };

  if (loading || !currentCustomer) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  // Invoice columns for the recent invoices table
  const invoiceColumns: ColumnsType<any> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
    },
    {
      title: 'Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `₹${amount.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Badge
          color={
            status === 'paid'
              ? 'success'
              : status === 'partial'
              ? 'warning'
              : 'error'
          }
        >
          {status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  const fullName = `${currentCustomer.first_name} ${currentCustomer.last_name || ''}`.trim();

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
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-600 mt-1">
              {currentCustomer.customer_code} •{' '}
              <Badge
                color={
                  currentCustomer.customer_type === 'vip'
                    ? 'gold'
                    : currentCustomer.customer_type === 'wholesale'
                    ? 'blue'
                    : 'default'
                }
              >
                {currentCustomer.customer_type.toUpperCase()}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/customers/edit/${id}`)}>
            Edit
          </Button>
          <Button type="primary" danger onClick={() => setDeleteDialog(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card title="Contact Information">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Mobile</label>
              <p className="text-gray-900">{currentCustomer.mobile || '-'}</p>
            </div>
            {currentCustomer.alternate_mobile && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Alternate Mobile
                </label>
                <p className="text-gray-900">{currentCustomer.alternate_mobile}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{currentCustomer.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900">
                {currentCustomer.address_line1 && (
                  <>
                    {currentCustomer.address_line1}
                    <br />
                  </>
                )}
                {currentCustomer.address_line2 && (
                  <>
                    {currentCustomer.address_line2}
                    <br />
                  </>
                )}
                {currentCustomer.city && `${currentCustomer.city}, `}
                {currentCustomer.state && `${currentCustomer.state} `}
                {currentCustomer.pincode}
                {!currentCustomer.address_line1 && '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Financial Info */}
        <Card title="Financial Information">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Outstanding Balance
              </label>
              <p
                className={`text-lg font-semibold ${
                  currentCustomer.outstanding_balance > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                ₹{currentCustomer.outstanding_balance.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Credit Limit</label>
              <p className="text-gray-900">
                ₹{currentCustomer.credit_limit.toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Credit Days</label>
              <p className="text-gray-900">{currentCustomer.credit_days} days</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Discount</label>
              <p className="text-gray-900">{currentCustomer.discount_percentage}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Loyalty Points
              </label>
              <p className="text-gray-900">{currentCustomer.loyalty_points}</p>
            </div>
          </div>
        </Card>

        {/* Documents */}
        <Card title="Documents">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">PAN Number</label>
              <p className="text-gray-900">{currentCustomer.pan_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Aadhar Number
              </label>
              <p className="text-gray-900">{currentCustomer.aadhar_number || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">GSTIN</label>
              <p className="text-gray-900">{currentCustomer.gstin || '-'}</p>
            </div>
            {currentCustomer.date_of_birth && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Date of Birth
                </label>
                <p className="text-gray-900">
                  {new Date(currentCustomer.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}
            {currentCustomer.anniversary_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Anniversary
                </label>
                <p className="text-gray-900">
                  {new Date(currentCustomer.anniversary_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card
        title="Recent Invoices"
        extra={
          <Button type="link" onClick={() => navigate(`/invoices?customer=${id}`)}>
            View All
          </Button>
        }
      >
        <Table
          columns={invoiceColumns}
          dataSource={(currentCustomer as any).sales_invoices || []}
          rowKey="id"
          pagination={false}
          onRow={(invoice) => ({
            onClick: () => navigate(`/invoices/${invoice.id}`),
            className: 'cursor-pointer hover:bg-gray-50',
          })}
        />
        {!(currentCustomer as any).sales_invoices ||
          ((currentCustomer as any).sales_invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No invoices found
            </div>
          ))}
      </Card>

      {/* Notes */}
      {currentCustomer.notes && (
        <Card title="Notes">
          <p className="text-gray-900 whitespace-pre-wrap">{currentCustomer.notes}</p>
        </Card>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog}
        title="Delete Customer"
        message={`Are you sure you want to delete ${fullName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default CustomerDetail;
