import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setCategories,
  setCategoryTree,
  setCurrentCategory,
  setLoading,
  setError,
  addCategory,
  updateCategory as updateCategoryAction,
  removeCategory,
} from '../store/slices/categorySlice';

/**
 * Categories Management Page
 * Tree view for hierarchical category management
 */
const Categories: React.FC = () => {
  const dispatch = useDispatch();
  const { categories, categoryTree, currentCategory, loading, error } = useSelector(
    (state: RootState) => state.category
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    category_name: '',
    category_code: '',
    parent_category_id: null as number | null,
    description: '',
    hsn_code: '',
    tax_percentage: 0,
  });

  useEffect(() => {
    loadCategories();
    loadCategoryTree();
  }, []);

  const loadCategories = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.category.getAll({ is_active: true });
      if (response.success) {
        dispatch(setCategories(response.data));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load categories'));
    }
  };

  const loadCategoryTree = async () => {
    try {
      const response = await window.electronAPI.category.getTree();
      if (response.success) {
        dispatch(setCategoryTree(response.data));
      }
    } catch (err: any) {
      console.error('Failed to load category tree:', err);
    }
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditMode(true);
      setFormData({
        category_name: category.category_name,
        category_code: category.category_code,
        parent_category_id: category.parent_category_id,
        description: category.description || '',
        hsn_code: category.hsn_code || '',
        tax_percentage: category.tax_percentage,
      });
      dispatch(setCurrentCategory(category));
    } else {
      setEditMode(false);
      setFormData({
        category_name: '',
        category_code: '',
        parent_category_id: null,
        description: '',
        hsn_code: '',
        tax_percentage: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setFormData({
      category_name: '',
      category_code: '',
      parent_category_id: null,
      description: '',
      hsn_code: '',
      tax_percentage: 0,
    });
    dispatch(setCurrentCategory(null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      dispatch(setLoading(true));

      if (editMode && currentCategory) {
        const response = await window.electronAPI.category.update(
          currentCategory.id,
          formData,
          user.id
        );
        if (response.success) {
          dispatch(updateCategoryAction(response.data));
          alert('Category updated successfully!');
        } else {
          alert(response.message);
        }
      } else {
        const response = await window.electronAPI.category.create({
          ...formData,
          created_by: user.id,
        });
        if (response.success) {
          dispatch(addCategory(response.data));
          alert('Category created successfully!');
        } else {
          alert(response.message);
        }
      }

      handleCloseModal();
      loadCategories();
      loadCategoryTree();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await window.electronAPI.category.delete(categoryId, user.id);
      if (response.success) {
        dispatch(removeCategory(categoryId));
        loadCategories();
        loadCategoryTree();
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const renderTreeNode = (node: any, level: number = 0) => {
    const indentStyle = { paddingLeft: `${level * 24}px` };

    return (
      <div key={node.id}>
        <div
          className="flex items-center justify-between py-2 px-4 hover:bg-gray-50 border-b border-gray-100"
          style={indentStyle}
        >
          <div className="flex items-center gap-3">
            {node.children && node.children.length > 0 && (
              <span className="text-gray-400">▼</span>
            )}
            <div>
              <p className="font-medium text-gray-900">{node.category_name}</p>
              <p className="text-sm text-gray-500">
                {node.category_code}
                {node.hsn_code && ` • HSN: ${node.hsn_code}`}
                {node.tax_percentage > 0 && ` • Tax: ${node.tax_percentage}%`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal(node)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(node.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => {
                setFormData({ ...formData, parent_category_id: node.id });
                setShowModal(true);
              }}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              + Add Child
            </button>
          </div>
        </div>
        {node.children &&
          node.children.map((child: any) => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          Add Category
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Category Tree */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading categories...</div>
        ) : categoryTree.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No categories found. Create your first category!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categoryTree.map((node) => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editMode ? 'Edit Category' : 'Add New Category'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.category_name}
                      onChange={(e) =>
                        setFormData({ ...formData, category_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.category_code}
                      onChange={(e) =>
                        setFormData({ ...formData, category_code: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={formData.parent_category_id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_category_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (Root Category)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={formData.hsn_code}
                      onChange={(e) =>
                        setFormData({ ...formData, hsn_code: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Percentage
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_percentage: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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

export default Categories;
