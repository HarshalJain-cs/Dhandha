import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setStones,
  setStoneTypes,
  setCurrentStone,
  setLoading,
  setError,
  addStone,
  updateStone as updateStoneAction,
  removeStone,
} from '../store/slices/stoneSlice';

/**
 * Stones Management Page
 * Master data management for stones and diamonds
 */
const Stones: React.FC = () => {
  const dispatch = useDispatch();
  const { stones, stoneTypes, currentStone, loading, error } = useSelector(
    (state: RootState) => state.stone
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    stone_name: '',
    stone_code: '',
    stone_type: '',
    base_rate_per_carat: 0,
    unit: 'carat',
    description: '',
  });

  useEffect(() => {
    loadStones();
    loadStoneTypes();
  }, []);

  const loadStones = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.stone.getAll({ is_active: true });
      if (response.success) {
        dispatch(setStones(response.data));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load stones'));
    }
  };

  const loadStoneTypes = async () => {
    try {
      const response = await window.electronAPI.stone.getStoneTypes();
      if (response.success) {
        dispatch(setStoneTypes(response.data));
      }
    } catch (err: any) {
      console.error('Failed to load stone types:', err);
    }
  };

  const handleOpenModal = (stone?: any) => {
    if (stone) {
      setEditMode(true);
      setFormData({
        stone_name: stone.stone_name,
        stone_code: stone.stone_code,
        stone_type: stone.stone_type,
        base_rate_per_carat: stone.base_rate_per_carat,
        unit: stone.unit,
        description: stone.description || '',
      });
      dispatch(setCurrentStone(stone));
    } else {
      setEditMode(false);
      setFormData({
        stone_name: '',
        stone_code: '',
        stone_type: '',
        base_rate_per_carat: 0,
        unit: 'carat',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({
      stone_name: '',
      stone_code: '',
      stone_type: '',
      base_rate_per_carat: 0,
      unit: 'carat',
      description: '',
    });
    dispatch(setCurrentStone(null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      dispatch(setLoading(true));

      if (editMode && currentStone) {
        const response = await window.electronAPI.stone.update(
          currentStone.id,
          formData,
          user.id
        );
        if (response.success) {
          dispatch(updateStoneAction(response.data));
          alert('Stone updated successfully!');
        } else {
          alert(response.message);
        }
      } else {
        const response = await window.electronAPI.stone.create({
          ...formData,
          created_by: user.id,
        });
        if (response.success) {
          dispatch(addStone(response.data));
          alert('Stone created successfully!');
        } else {
          alert(response.message);
        }
      }

      handleCloseModal();
      loadStones();
      loadStoneTypes();
    } catch (err: any) {
      alert(err.message || 'Failed to save stone');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (stoneId: number) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this stone?')) {
      return;
    }

    try {
      const response = await window.electronAPI.stone.delete(stoneId, user.id);
      if (response.success) {
        dispatch(removeStone(stoneId));
        loadStones();
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete stone');
    }
  };

  const filteredStones = stones.filter((stone) => {
    const matchesType = !selectedType || stone.stone_type === selectedType;
    const matchesSearch =
      !searchTerm ||
      stone.stone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stone.stone_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stones & Diamonds</h1>
          <p className="text-gray-600 mt-1">Manage stone master data</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Add Stone
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
              placeholder="Search by name or code..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-64">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stone Types</option>
              {stoneTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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

      {/* Stones Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading stones...</div>
        ) : filteredStones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No stones found. Create your first stone!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stone Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate per Carat
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
                {filteredStones.map((stone) => (
                  <tr key={stone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{stone.stone_name}</p>
                        {stone.description && (
                          <p className="text-sm text-gray-500">{stone.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stone.stone_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {stone.stone_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{stone.base_rate_per_carat.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {stone.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(stone)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(stone.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editMode ? 'Edit Stone' : 'Add New Stone'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stone Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.stone_name}
                      onChange={(e) =>
                        setFormData({ ...formData, stone_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stone Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.stone_code}
                      onChange={(e) =>
                        setFormData({ ...formData, stone_code: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stone Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.stone_type}
                      onChange={(e) =>
                        setFormData({ ...formData, stone_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Diamond, Ruby, Emerald"
                      list="stone-types"
                      required
                    />
                    <datalist id="stone-types">
                      {stoneTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
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
                      <option value="carat">Carat</option>
                      <option value="gram">Gram</option>
                      <option value="piece">Piece</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Rate per Carat (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_rate_per_carat}
                    onChange={(e) =>
                      setFormData({ ...formData, base_rate_per_carat: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
};

export default Stones;
