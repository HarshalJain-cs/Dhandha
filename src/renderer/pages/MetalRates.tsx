import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setMetalTypes,
  setCurrentRates,
  setCurrentMetalType,
  setLoading,
  setError,
  addMetalType,
  updateMetalType as updateMetalTypeAction,
  updateMetalRate,
  removeMetalType,
} from '../store/slices/metalTypeSlice';

/**
 * Metal Rates Management Page
 * Manage metal types and their daily rates
 */
const MetalRates: React.FC = () => {
  const dispatch = useDispatch();
  const { metalTypes, currentRates, currentMetalType, loading, error } = useSelector(
    (state: RootState) => state.metalType
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    metal_name: '',
    metal_code: '',
    purity_percentage: 0,
    current_rate_per_gram: 0,
    unit: 'gram',
  });
  const [newRate, setNewRate] = useState(0);

  useEffect(() => {
    loadMetalTypes();
    loadCurrentRates();
  }, []);

  const loadMetalTypes = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.metalType.getAll({ is_active: true });
      if (response.success) {
        dispatch(setMetalTypes(response.data));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load metal types'));
    }
  };

  const loadCurrentRates = async () => {
    try {
      const response = await window.electronAPI.metalType.getCurrentRates();
      if (response.success) {
        dispatch(setCurrentRates(response.data));
      }
    } catch (err: any) {
      console.error('Failed to load current rates:', err);
    }
  };

  const handleOpenModal = (metalType?: any) => {
    if (metalType) {
      setEditMode(true);
      setFormData({
        metal_name: metalType.metal_name,
        metal_code: metalType.metal_code,
        purity_percentage: metalType.purity_percentage,
        current_rate_per_gram: metalType.current_rate_per_gram,
        unit: metalType.unit,
      });
      dispatch(setCurrentMetalType(metalType));
    } else {
      setEditMode(false);
      setFormData({
        metal_name: '',
        metal_code: '',
        purity_percentage: 0,
        current_rate_per_gram: 0,
        unit: 'gram',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({
      metal_name: '',
      metal_code: '',
      purity_percentage: 0,
      current_rate_per_gram: 0,
      unit: 'gram',
    });
    dispatch(setCurrentMetalType(null));
  };

  const handleOpenRateModal = (metalType: any) => {
    dispatch(setCurrentMetalType(metalType));
    setNewRate(metalType.current_rate_per_gram);
    setShowRateModal(true);
  };

  const handleCloseRateModal = () => {
    setShowRateModal(false);
    setNewRate(0);
    dispatch(setCurrentMetalType(null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      dispatch(setLoading(true));

      if (editMode && currentMetalType) {
        const response = await window.electronAPI.metalType.update(
          currentMetalType.id,
          formData,
          user.id
        );
        if (response.success) {
          dispatch(updateMetalTypeAction(response.data));
          alert('Metal type updated successfully!');
        } else {
          alert(response.message);
        }
      } else {
        const response = await window.electronAPI.metalType.create({
          ...formData,
          created_by: user.id,
        });
        if (response.success) {
          dispatch(addMetalType(response.data));
          alert('Metal type created successfully!');
        } else {
          alert(response.message);
        }
      }

      handleCloseModal();
      loadMetalTypes();
      loadCurrentRates();
    } catch (err: any) {
      alert(err.message || 'Failed to save metal type');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentMetalType) return;

    try {
      const response = await window.electronAPI.metalType.updateRate(
        currentMetalType.id,
        newRate,
        user.id
      );
      if (response.success) {
        dispatch(updateMetalRate({ id: currentMetalType.id, rate: newRate }));
        alert('Metal rate updated successfully!');
        handleCloseRateModal();
        loadMetalTypes();
        loadCurrentRates();
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update rate');
    }
  };

  const handleDelete = async (metalTypeId: number) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this metal type?')) {
      return;
    }

    try {
      const response = await window.electronAPI.metalType.delete(metalTypeId, user.id);
      if (response.success) {
        dispatch(removeMetalType(metalTypeId));
        loadMetalTypes();
        loadCurrentRates();
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete metal type');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metal Rates</h1>
          <p className="text-gray-600 mt-1">Manage metal types and daily rates</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Add Metal Type
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Current Rates Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {currentRates.map((rate) => (
          <div key={rate.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{rate.metal_name}</h3>
                <p className="text-sm text-gray-500">{rate.metal_code}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {rate.purity_percentage}%
              </span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Current Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{rate.rate_per_gram.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/{rate.unit}</span>
              </p>
            </div>
            <button
              onClick={() => {
                const metalType = metalTypes.find((m) => m.id === rate.id);
                if (metalType) handleOpenRateModal(metalType);
              }}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Update Rate
            </button>
          </div>
        ))}
      </div>

      {/* Metal Types Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Metal Types</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading metal types...</div>
        ) : metalTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No metal types found. Create your first metal type!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metal Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metalTypes.map((metalType) => (
                  <tr key={metalType.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metalType.metal_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metalType.metal_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metalType.purity_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{metalType.current_rate_per_gram.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {metalType.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenRateModal(metalType)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Update Rate
                      </button>
                      <button
                        onClick={() => handleOpenModal(metalType)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(metalType.id)}
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

      {/* Add/Edit Metal Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editMode ? 'Edit Metal Type' : 'Add New Metal Type'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.metal_name}
                      onChange={(e) =>
                        setFormData({ ...formData, metal_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Gold 24K, Gold 22K"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.metal_code}
                      onChange={(e) =>
                        setFormData({ ...formData, metal_code: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., G24, G22"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purity (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.purity_percentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purity_percentage: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 100 for 24K, 91.67 for 22K"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gram">Gram</option>
                      <option value="kg">Kilogram</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Rate per {formData.unit} (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_rate_per_gram}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_rate_per_gram: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
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

      {/* Update Rate Modal */}
      {showRateModal && currentMetalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Update Metal Rate</h2>
              <p className="text-gray-600 mb-4">
                {currentMetalType.metal_name} ({currentMetalType.purity_percentage}%)
              </p>

              <form onSubmit={handleUpdateRate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Rate: ₹{currentMetalType.current_rate_per_gram.toLocaleString()}/
                    {currentMetalType.unit}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Rate (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>

                {newRate > 0 && newRate !== currentMetalType.current_rate_per_gram && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-700">
                      Change:{' '}
                      <span
                        className={
                          newRate > currentMetalType.current_rate_per_gram
                            ? 'text-green-700 font-semibold'
                            : 'text-red-700 font-semibold'
                        }
                      >
                        {newRate > currentMetalType.current_rate_per_gram ? '+' : ''}₹
                        {(newRate - currentMetalType.current_rate_per_gram).toFixed(2)} (
                        {(
                          ((newRate - currentMetalType.current_rate_per_gram) /
                            currentMetalType.current_rate_per_gram) *
                          100
                        ).toFixed(2)}
                        %)
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseRateModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Update Rate
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

export default MetalRates;
