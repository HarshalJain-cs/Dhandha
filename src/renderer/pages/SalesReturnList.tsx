import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setReturns, setLoading, setError } from '../store/slices/salesReturnSlice';
import { useNavigate } from 'react-router-dom';

const SalesReturnList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { returns, loading, error } = useSelector((state: RootState) => state.salesReturn);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.salesReturn.getAll({});
      if (response.success) {
        dispatch(setReturns({ returns: response.data.returns }));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message));
    }
  };

  const handleApprove = async (returnId: number) => {
    if (confirm('Are you sure you want to approve this return?')) {
      try {
        const response = await window.electronAPI.salesReturn.approve(returnId, user!.id);
        if (response.success) {
          loadReturns();
          alert('Return approved successfully');
        } else {
          alert(response.message);
        }
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Returns</h1>
        <button
          onClick={() => navigate('/sales-returns/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Return
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {returns.map((ret) => (
              <tr key={ret.return_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{ret.return_number}</td>
                <td className="px-4 py-3 capitalize">{ret.return_type}</td>
                <td className="px-4 py-3">{ret.customer_id}</td>
                <td className="px-4 py-3">{new Date(ret.return_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">₹{ret.refund_amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ret.status)}`}>
                    {ret.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  {ret.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(ret.return_id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                  )}
                  <button className="text-blue-600 hover:text-blue-900">
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

export default SalesReturnList;
