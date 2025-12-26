import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setLogs, setLoading, setError } from '../store/slices/auditSlice';

const AuditLog: React.FC = () => {
  const dispatch = useDispatch();
  const { logs, loading, error } = useSelector((state: RootState) => state.audit);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntityType]);

  const loadLogs = async () => {
    try {
      dispatch(setLoading(true));
      const filters: any = {};
      if (filterAction) filters.action = filterAction;
      if (filterEntityType) filters.entity_type = filterEntityType;

      const response = await window.electronAPI.audit.getAll(filters);
      if (response.success) {
        dispatch(setLogs({ logs: response.data.logs }));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message));
    }
  };

  const getActionColor = (action: string) => {
    const colors: any = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Entity Type</label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="product">Product</option>
              <option value="customer">Customer</option>
              <option value="invoice">Invoice</option>
              <option value="vendor">Vendor</option>
              <option value="purchase_order">Purchase Order</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFilterAction(''); setFilterEntityType(''); }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.log_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">{log.user_id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">{log.entity_type || '-'}</td>
                <td className="px-4 py-3">{log.entity_id || '-'}</td>
                <td className="px-4 py-3">{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
