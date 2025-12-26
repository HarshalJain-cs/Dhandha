import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setQuotations, setLoading, setError } from '../store/slices/quotationSlice';
import { useNavigate } from 'react-router-dom';

const QuotationList: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { quotations, loading, error } = useSelector((state: RootState) => state.quotation);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.quotation.getAll({});
      if (response.success) {
        dispatch(setQuotations({ quotations: response.data.quotations }));
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
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quotations</h1>
        <button
          onClick={() => navigate('/quotations/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Quotation
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quotation #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotations.map((quotation) => (
              <tr key={quotation.quotation_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{quotation.quotation_number}</td>
                <td className="px-4 py-3">{quotation.customer_id}</td>
                <td className="px-4 py-3">{new Date(quotation.quotation_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{new Date(quotation.valid_until).toLocaleDateString()}</td>
                <td className="px-4 py-3">₹{quotation.grand_total.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quotation.status)}`}>
                    {quotation.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/quotations/${quotation.quotation_id}`)}
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

export default QuotationList;
