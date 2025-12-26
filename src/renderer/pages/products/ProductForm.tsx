import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentProduct, setLoading, setError } from '../../store/slices/productSlice';

/**
 * Product Form - Multi-step wizard
 * For creating and editing products
 */

interface FormData {
  // Basic Info
  category_id: number | '';
  metal_type_id: number | '';
  product_name: string;
  description: string;
  design_number: string;
  size: string;

  // Weight Details
  gross_weight: number | '';
  net_weight: number | '';
  stone_weight: number | '';
  purity: number | '';
  wastage_percentage: number | '';

  // Pricing
  unit_price: number | '';
  mrp: number | '';
  making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  making_charge: number | '';

  // Stock & Location
  quantity: number | '';
  current_stock: number | '';
  min_stock_level: number | '';
  reorder_level: number | '';
  location: string;
  rack_number: string;
  shelf_number: string;
  status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';

  // Identification
  barcode: string;
  rfid_tag: string;
  huid: string;
  hallmark_number: string;
  hallmark_center: string;

  // Additional
  tags: string[];
  notes: string;
}

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, loading, error } = useSelector((state: RootState) => state.product);
  const { categories } = useSelector((state: RootState) => state.category);
  const { metalTypes } = useSelector((state: RootState) => state.metalType);
  const { stones } = useSelector((state: RootState) => state.stone);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    category_id: '',
    metal_type_id: '',
    product_name: '',
    description: '',
    design_number: '',
    size: '',
    gross_weight: '',
    net_weight: '',
    stone_weight: 0,
    purity: '',
    wastage_percentage: 0,
    unit_price: '',
    mrp: '',
    making_charge_type: 'per_gram',
    making_charge: 0,
    quantity: 1,
    current_stock: 0,
    min_stock_level: 0,
    reorder_level: 0,
    location: '',
    rack_number: '',
    shelf_number: '',
    status: 'in_stock',
    barcode: '',
    rfid_tag: '',
    huid: '',
    hallmark_number: '',
    hallmark_center: '',
    tags: [],
    notes: '',
  });

  const [productStones, setProductStones] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const steps = [
    { number: 1, name: 'Basic Info', icon: '📝' },
    { number: 2, name: 'Weight Details', icon: '⚖️' },
    { number: 3, name: 'Pricing', icon: '💰' },
    { number: 4, name: 'Stock & Location', icon: '📦' },
    { number: 5, name: 'Identification', icon: '🏷️' },
    { number: 6, name: 'Stones', icon: '💎' },
    { number: 7, name: 'Review', icon: '✅' },
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (formData.category_id && formData.metal_type_id) {
      generateProductCode();
    }
  }, [formData.category_id, formData.metal_type_id]);

  const loadData = async () => {
    try {
      // Load categories
      const catResponse = await window.electronAPI.category.getAll({ is_active: true });
      // Load metal types
      const metalResponse = await window.electronAPI.metalType.getAll({ is_active: true });
      // Load stones
      const stoneResponse = await window.electronAPI.stone.getAll({ is_active: true });

      // If editing, load product
      if (id) {
        const productResponse = await window.electronAPI.product.getById(Number(id));
        if (productResponse.success) {
          const product = productResponse.data;
          setFormData({
            category_id: product.category_id,
            metal_type_id: product.metal_type_id,
            product_name: product.product_name,
            description: product.description || '',
            design_number: product.design_number || '',
            size: product.size || '',
            gross_weight: product.gross_weight,
            net_weight: product.net_weight,
            stone_weight: product.stone_weight,
            purity: product.purity,
            wastage_percentage: product.wastage_percentage,
            unit_price: product.unit_price,
            mrp: product.mrp || '',
            making_charge_type: product.making_charge_type,
            making_charge: product.making_charge,
            quantity: product.quantity,
            current_stock: product.current_stock,
            min_stock_level: product.min_stock_level,
            reorder_level: product.reorder_level,
            location: product.location || '',
            rack_number: product.rack_number || '',
            shelf_number: product.shelf_number || '',
            status: product.status,
            barcode: product.barcode || '',
            rfid_tag: product.rfid_tag || '',
            huid: product.huid || '',
            hallmark_number: product.hallmark_number || '',
            hallmark_center: product.hallmark_center || '',
            tags: product.tags || [],
            notes: product.notes || '',
          });
          if (product.stones) {
            setProductStones(product.stones);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const generateProductCode = async () => {
    if (!formData.category_id || !formData.metal_type_id) return;

    try {
      const response = await window.electronAPI.product.generateCode(
        Number(formData.category_id),
        Number(formData.metal_type_id)
      );
      if (response.success) {
        setGeneratedCode(response.data.product_code);
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.category_id &&
          formData.metal_type_id &&
          formData.product_name.trim()
        );
      case 2:
        return !!(formData.gross_weight && formData.net_weight && formData.purity);
      case 3:
        return !!formData.unit_price;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      alert('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      dispatch(setLoading(true));

      const productData = {
        ...formData,
        category_id: Number(formData.category_id),
        metal_type_id: Number(formData.metal_type_id),
        gross_weight: Number(formData.gross_weight),
        net_weight: Number(formData.net_weight),
        stone_weight: Number(formData.stone_weight),
        purity: Number(formData.purity),
        wastage_percentage: Number(formData.wastage_percentage),
        unit_price: Number(formData.unit_price),
        mrp: formData.mrp ? Number(formData.mrp) : undefined,
        making_charge: Number(formData.making_charge),
        quantity: Number(formData.quantity),
        current_stock: Number(formData.current_stock),
        min_stock_level: Number(formData.min_stock_level),
        reorder_level: Number(formData.reorder_level),
        created_by: user.id,
      };

      let response;
      if (id) {
        response = await window.electronAPI.product.update(Number(id), productData, user.id);
      } else {
        response = await window.electronAPI.product.create(productData);
      }

      if (response.success) {
        alert(id ? 'Product updated successfully!' : 'Product created successfully!');
        navigate('/products');
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metal Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.metal_type_id}
                  onChange={(e) => handleInputChange('metal_type_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Metal Type</option>
                  {metalTypes.map((metal) => (
                    <option key={metal.id} value={metal.id}>
                      {metal.metal_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {generatedCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  Product Code: <span className="font-semibold">{generatedCode}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Gold Ring with Diamond"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Design Number
                </label>
                <input
                  type="text"
                  value={formData.design_number}
                  onChange={(e) => handleInputChange('design_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 18, M, L"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Product description..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Weight Details</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gross Weight (g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.gross_weight}
                  onChange={(e) => handleInputChange('gross_weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Net Weight (g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.net_weight}
                  onChange={(e) => handleInputChange('net_weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stone Weight (g)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.stone_weight}
                  onChange={(e) => handleInputChange('stone_weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={formData.purity}
                  onChange={(e) => handleInputChange('purity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 91.67 for 22K"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wastage (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.wastage_percentage}
                  onChange={(e) => handleInputChange('wastage_percentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {formData.net_weight && formData.purity && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">
                  Fine Weight (Pure Metal): {' '}
                  <span className="font-semibold">
                    {((Number(formData.net_weight) * Number(formData.purity)) / 100).toFixed(3)}g
                  </span>
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Pricing</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => handleInputChange('unit_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => handleInputChange('mrp', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Making Charge Type
                </label>
                <select
                  value={formData.making_charge_type}
                  onChange={(e) => handleInputChange('making_charge_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="per_gram">Per Gram</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                  <option value="slab">Slab</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Making Charge
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.making_charge}
                  onChange={(e) => handleInputChange('making_charge', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Stock & Location</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => handleInputChange('current_stock', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => handleInputChange('reorder_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="in_stock">In Stock</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
                <option value="in_repair">In Repair</option>
                <option value="with_karigar">With Karigar</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rack Number
                </label>
                <input
                  type="text"
                  value={formData.rack_number}
                  onChange={(e) => handleInputChange('rack_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shelf Number
                </label>
                <input
                  type="text"
                  value={formData.shelf_number}
                  onChange={(e) => handleInputChange('shelf_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Identification</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EAN-13 / UPC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFID Tag
                </label>
                <input
                  type="text"
                  value={formData.rfid_tag}
                  onChange={(e) => handleInputChange('rfid_tag', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EPC format"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HUID (Hallmark Unique ID)
              </label>
              <input
                type="text"
                value={formData.huid}
                onChange={(e) => handleInputChange('huid', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hallmark Number
                </label>
                <input
                  type="text"
                  value={formData.hallmark_number}
                  onChange={(e) => handleInputChange('hallmark_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hallmark Center
                </label>
                <input
                  type="text"
                  value={formData.hallmark_center}
                  onChange={(e) => handleInputChange('hallmark_center', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Stones / Diamonds</h2>
            <p className="text-sm text-gray-600">
              Add stones after creating the product, or skip this step for now.
            </p>

            {productStones.length > 0 && (
              <div className="space-y-2">
                {productStones.map((ps, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ps.stone?.stone_name}</p>
                        <p className="text-sm text-gray-600">
                          {ps.quantity} pc(s) × {ps.carat_weight} carat
                        </p>
                      </div>
                      <p className="font-medium">₹{ps.value_with_4c?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Product Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-gray-600">Product:</span> {formData.product_name}</p>
                  <p><span className="text-gray-600">Code:</span> {generatedCode}</p>
                  <p><span className="text-gray-600">Weight:</span> {formData.gross_weight}g</p>
                  <p><span className="text-gray-600">Price:</span> ₹{formData.unit_price}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add tags..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          {id ? 'Update product information' : 'Create a new product in your inventory'}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.icon}
                </div>
                <p className={`text-xs mt-2 ${currentStep >= step.number ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <div className="flex gap-2">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
