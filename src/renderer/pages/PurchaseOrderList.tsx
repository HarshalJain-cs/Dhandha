import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPurchaseOrders, setLoading, setError } from '../store/slices/purchaseOrderSlice';
import { useNavigate } from 'react-router-dom';

const PurchaseOrderList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { purchaseOrders, loading, error } = useSelector((state: RootState) => state.purchaseOrder);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.purchaseOrder.getAll({});
      if (response.success) {
        dispatch(setPurchaseOrders({ purchaseOrders: response.data.purchaseOrders }));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <button
          onClick={() => navigate('/purchase-orders/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Purchase Order
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchaseOrders.map((po) => (
              <tr key={po.purchase_order_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{po.po_number}</td>
                <td className="px-4 py-3">{po.vendor_id}</td>
                <td className="px-4 py-3">{new Date(po.po_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{po.received_quantity}/{po.quantity}g</td>
                <td className="px-4 py-3">₹{po.grand_total.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(po.status)}`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/purchase-orders/${po.purchase_order_id}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrderList;
