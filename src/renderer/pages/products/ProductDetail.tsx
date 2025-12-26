import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentProduct, setLoading, setError } from '../../store/slices/productSlice';

/**
 * Product Detail Page
 * View detailed information about a specific product
 */
const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, loading, error } = useSelector(
    (state: RootState) => state.product
  );

  useEffect(() => {
    if (id) {
      loadProduct(Number(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      dispatch(setLoading(true));
      const response = await window.electronAPI.product.getById(productId);

      if (response.success) {
        dispatch(setCurrentProduct(response.data));
      } else {
        dispatch(setError(response.message));
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load product'));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Product not found</div>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  const product = currentProduct;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/products')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.product_name}</h1>
            <p className="text-gray-600 mt-1">{product.product_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/products/${product.id}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Product Code</label>
                <p className="font-medium">{product.product_code}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Barcode</label>
                <p className="font-medium">{product.barcode || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <p className="font-medium">{product.category?.category_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Metal Type</label>
                <p className="font-medium">{product.metalType?.metal_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Design Number</label>
                <p className="font-medium">{product.design_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Size</label>
                <p className="font-medium">{product.size || '-'}</p>
              </div>
            </div>
          </div>

          {/* Weight Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Weight Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Gross Weight</label>
                <p className="font-medium">{product.gross_weight}g</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Net Weight</label>
                <p className="font-medium">{product.net_weight}g</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Stone Weight</label>
                <p className="font-medium">{product.stone_weight}g</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Fine Weight</label>
                <p className="font-medium">{product.fine_weight}g</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Purity</label>
                <p className="font-medium">{product.purity}%</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Wastage</label>
                <p className="font-medium">{product.wastage_percentage}%</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">Unit Price</label>
                <p className="font-medium text-lg">₹{product.unit_price.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">MRP</label>
                <p className="font-medium text-lg">{product.mrp ? `₹${product.mrp.toLocaleString()}` : '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Making Charge</label>
                <p className="font-medium">₹{product.making_charge} ({product.making_charge_type})</p>
              </div>
            </div>
          </div>

          {/* Stones */}
          {product.stones && product.stones.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Stones / Diamonds</h2>
              <div className="space-y-3">
                {product.stones.map((ps: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ps.stone?.stone_name}</p>
                        <p className="text-sm text-gray-600">{ps.stone?.stone_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{ps.value_with_4c?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{ps.quantity} pc(s)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Carat:</span> {ps.carat_weight}
                      </div>
                      {ps.cut_grade && (
                        <div>
                          <span className="text-gray-600">Cut:</span> {ps.cut_grade}
                        </div>
                      )}
                      {ps.color_grade && (
                        <div>
                          <span className="text-gray-600">Color:</span> {ps.color_grade}
                        </div>
                      )}
                      {ps.clarity_grade && (
                        <div>
                          <span className="text-gray-600">Clarity:</span> {ps.clarity_grade}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Stock</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Current Stock</label>
                <p className="font-medium text-2xl">{product.current_stock}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Minimum Level</label>
                <p className="font-medium">{product.min_stock_level}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Reorder Level</label>
                <p className="font-medium">{product.reorder_level}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  product.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                  product.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                  product.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {product.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600">Location</label>
                <p className="font-medium">{product.location || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Rack Number</label>
                <p className="font-medium">{product.rack_number || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Shelf Number</label>
                <p className="font-medium">{product.shelf_number || '-'}</p>
              </div>
            </div>
          </div>

          {/* Hallmark */}
          {(product.hallmark_number || product.huid) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Certification</h2>
              <div className="space-y-2">
                {product.huid && (
                  <div>
                    <label className="text-sm text-gray-600">HUID</label>
                    <p className="font-medium">{product.huid}</p>
                  </div>
                )}
                {product.hallmark_number && (
                  <div>
                    <label className="text-sm text-gray-600">Hallmark Number</label>
                    <p className="font-medium">{product.hallmark_number}</p>
                  </div>
                )}
                {product.hallmark_center && (
                  <div>
                    <label className="text-sm text-gray-600">Hallmark Center</label>
                    <p className="font-medium">{product.hallmark_center}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700">{product.description}</p>
        </div>
      )}

      {/* Notes */}
      {product.notes && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <p className="text-gray-700">{product.notes}</p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
