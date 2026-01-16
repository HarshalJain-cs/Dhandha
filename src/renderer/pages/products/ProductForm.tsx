import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Steps,
  Card,
  Space,
  Row,
  Col,
  message,
  Divider,
  Tag,
  Tooltip,
  Modal,
  Tabs,
  Radio,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  BarcodeOutlined,
  WifiOutlined,
  ScaleOutlined,
  PictureOutlined,
  TagsOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { RootState } from '../../store';
import { useForm } from '../../hooks';
import { BarcodeScanner, RFIDScanner, WeighingScaleInput } from '../../components/hardware';
import { ImageUpload } from '../../components/ui';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ProductFormData {
  // Basic Info
  category_id: number | null;
  metal_type_id: number | null;
  product_name: string;
  description: string;
  design_number: string;
  size: string;

  // Weight Details
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  purity: number;
  wastage_percentage: number;

  // Pricing
  unit_price: number;
  mrp: number;
  making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  making_charge: number;

  // Stock & Location
  quantity: number;
  current_stock: number;
  min_stock_level: number;
  reorder_level: number;
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

  // Images and Additional
  images: string[];
  tags: string[];
  notes: string;
}

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { categories } = useSelector((state: RootState) => state.category);
  const { metalTypes } = useSelector((state: RootState) => state.metalType);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Hardware modals
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showRFIDScanner, setShowRFIDScanner] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState('');

  // Validation schema
  const validationSchema = {
    category_id: (value: any) => (!value ? 'Category is required' : ''),
    metal_type_id: (value: any) => (!value ? 'Metal type is required' : ''),
    product_name: (value: string) => (!value?.trim() ? 'Product name is required' : ''),
    gross_weight: (value: number) => (!value || value <= 0 ? 'Valid gross weight is required' : ''),
    net_weight: (value: number) => (!value || value <= 0 ? 'Valid net weight is required' : ''),
    purity: (value: number) => (!value || value <= 0 || value > 100 ? 'Purity must be between 0 and 100' : ''),
    unit_price: (value: number) => (!value || value <= 0 ? 'Valid unit price is required' : ''),
  };

  const form = useForm<ProductFormData>({
    initialValues: {
      category_id: null,
      metal_type_id: null,
      product_name: '',
      description: '',
      design_number: '',
      size: '',
      gross_weight: 0,
      net_weight: 0,
      stone_weight: 0,
      purity: 0,
      wastage_percentage: 0,
      unit_price: 0,
      mrp: 0,
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
      images: [],
      tags: [],
      notes: '',
    },
    validationSchema,
    onSubmit: handleSubmit,
    enableAutoSave: true,
    autoSaveKey: `product-form-${id || 'new'}`,
  });

  // Load product data for edit mode
  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Generate product code when category and metal type change
  useEffect(() => {
    if (form.values.category_id && form.values.metal_type_id && !isEditMode) {
      generateProductCode();
    }
  }, [form.values.category_id, form.values.metal_type_id]);

  // Calculate fine weight automatically
  useEffect(() => {
    if (form.values.net_weight && form.values.purity) {
      // Fine weight calculation is handled by backend, but we can show a preview
    }
  }, [form.values.net_weight, form.values.purity]);

  const loadInitialData = async () => {
    if (!isEditMode) return;

    try {
      setLoading(true);
      const response = await window.api.products.getById(Number(id));

      if (response.success && response.data) {
        const product = response.data;
        form.setValues({
          category_id: product.category_id,
          metal_type_id: product.metal_type_id,
          product_name: product.product_name,
          description: product.description || '',
          design_number: product.design_number || '',
          size: product.size || '',
          gross_weight: product.gross_weight,
          net_weight: product.net_weight,
          stone_weight: product.stone_weight || 0,
          purity: product.purity,
          wastage_percentage: product.wastage_percentage || 0,
          unit_price: product.unit_price,
          mrp: product.mrp || 0,
          making_charge_type: product.making_charge_type,
          making_charge: product.making_charge || 0,
          quantity: product.quantity || 1,
          current_stock: product.current_stock,
          min_stock_level: product.min_stock_level || 0,
          reorder_level: product.reorder_level || 0,
          location: product.location || '',
          rack_number: product.rack_number || '',
          shelf_number: product.shelf_number || '',
          status: product.status,
          barcode: product.barcode || '',
          rfid_tag: product.rfid_tag || '',
          huid: product.huid || '',
          hallmark_number: product.hallmark_number || '',
          hallmark_center: product.hallmark_center || '',
          images: product.images || [],
          tags: product.tags || [],
          notes: product.notes || '',
        });
      } else {
        message.error(response.message || 'Failed to load product');
        navigate('/products');
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      message.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const generateProductCode = async () => {
    try {
      const response = await window.api.products.generateCode(
        Number(form.values.category_id),
        Number(form.values.metal_type_id)
      );

      if (response.success) {
        setGeneratedCode(response.data.product_code);
      }
    } catch (error) {
      console.error('Failed to generate product code:', error);
    }
  };

  async function handleSubmit(values: ProductFormData) {
    if (!user) {
      message.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        ...values,
        created_by: user.id,
      };

      let response;
      if (isEditMode) {
        response = await window.api.products.update(Number(id), productData, user.id);
      } else {
        response = await window.api.products.create(productData);
      }

      if (response.success) {
        message.success(isEditMode ? 'Product updated successfully' : 'Product created successfully');
        form.clearDraft();
        navigate('/products');
      } else {
        message.error(response.message);
      }
    } catch (error: any) {
      console.error('Failed to save product:', error);
      message.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  }

  const handleBarcodeScanned = useCallback((barcode: string) => {
    form.setFieldValue('barcode', barcode);
    setShowBarcodeScanner(false);
    message.success('Barcode scanned successfully');
  }, [form]);

  const handleRFIDRead = useCallback((rfidTag: string) => {
    form.setFieldValue('rfid_tag', rfidTag);
    setShowRFIDScanner(false);
    message.success('RFID tag read successfully');
  }, [form]);

  const handleWeightRead = useCallback((weight: number) => {
    if (currentStep === 1) {
      // Assuming step 1 is weight details
      form.setFieldValue('gross_weight', weight);
    }
  }, [form, currentStep]);

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !form.values.tags.includes(trimmedTag)) {
      form.setFieldValue('tags', [...form.values.tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setFieldValue('tags', form.values.tags.filter(tag => tag !== tagToRemove));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return !!(form.values.category_id && form.values.metal_type_id && form.values.product_name.trim());
      case 1: // Weight Details
        return !!(form.values.gross_weight > 0 && form.values.net_weight > 0 && form.values.purity > 0);
      case 2: // Pricing
        return form.values.unit_price > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    } else {
      message.warning('Please fill in all required fields before proceeding');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    { title: 'Basic Info', icon: <TagsOutlined /> },
    { title: 'Weight Details', icon: <ScaleOutlined /> },
    { title: 'Pricing', icon: <TagsOutlined /> },
    { title: 'Stock & Location', icon: <TagsOutlined /> },
    { title: 'Identification', icon: <BarcodeOutlined /> },
    { title: 'Images & Tags', icon: <PictureOutlined /> },
    { title: 'Review', icon: <CheckOutlined /> },
  ];

  // Step 0: Basic Information
  const renderBasicInfo = () => (
    <Card title="Basic Information">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Category"
            required
            validateStatus={form.errors.category_id ? 'error' : ''}
            help={form.errors.category_id}
          >
            <Select
              placeholder="Select category"
              value={form.values.category_id}
              onChange={(value) => form.setFieldValue('category_id', value)}
              showSearch
              optionFilterProp="children"
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Metal Type"
            required
            validateStatus={form.errors.metal_type_id ? 'error' : ''}
            help={form.errors.metal_type_id}
          >
            <Select
              placeholder="Select metal type"
              value={form.values.metal_type_id}
              onChange={(value) => form.setFieldValue('metal_type_id', value)}
              showSearch
              optionFilterProp="children"
            >
              {metalTypes.map((metal) => (
                <Option key={metal.id} value={metal.id}>
                  {metal.metal_name} ({metal.purity_percentage}%)
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {generatedCode && (
        <Alert
          message={`Generated Product Code: ${generatedCode}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Product Name"
            required
            validateStatus={form.errors.product_name ? 'error' : ''}
            help={form.errors.product_name}
          >
            <Input
              placeholder="Enter product name"
              value={form.values.product_name}
              onChange={(e) => form.setFieldValue('product_name', e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Design Number">
            <Input
              placeholder="Enter design number"
              value={form.values.design_number}
              onChange={(e) => form.setFieldValue('design_number', e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Size">
            <Input
              placeholder="Enter size"
              value={form.values.size}
              onChange={(e) => form.setFieldValue('size', e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Status">
            <Select
              value={form.values.status}
              onChange={(value) => form.setFieldValue('status', value)}
            >
              <Option value="in_stock">In Stock</Option>
              <Option value="sold">Sold</Option>
              <Option value="reserved">Reserved</Option>
              <Option value="in_repair">In Repair</Option>
              <Option value="with_karigar">With Karigar</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Description">
        <TextArea
          rows={3}
          placeholder="Enter product description"
          value={form.values.description}
          onChange={(e) => form.setFieldValue('description', e.target.value)}
        />
      </Form.Item>
    </Card>
  );

  // Step 1: Weight Details
  const renderWeightDetails = () => (
    <Card
      title="Weight Details"
      extra={
        <Tooltip title="Read weight from scale">
          <Button
            icon={<ScaleOutlined />}
            onClick={() => {
              // Weight reading is handled by the WeighingScaleInput component
            }}
          >
            Use Scale
          </Button>
        </Tooltip>
      }
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Gross Weight (g)"
            required
            validateStatus={form.errors.gross_weight ? 'error' : ''}
            help={form.errors.gross_weight}
          >
            <WeighingScaleInput
              value={form.values.gross_weight}
              onChange={(value) => form.setFieldValue('gross_weight', value)}
              unit="g"
              precision={3}
              showTareButton
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Net Weight (g)"
            required
            validateStatus={form.errors.net_weight ? 'error' : ''}
            help={form.errors.net_weight}
          >
            <WeighingScaleInput
              value={form.values.net_weight}
              onChange={(value) => form.setFieldValue('net_weight', value)}
              unit="g"
              precision={3}
              showTareButton
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Stone Weight (g)">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.stone_weight}
              onChange={(value) => form.setFieldValue('stone_weight', value || 0)}
              precision={3}
              min={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Purity (%)"
            required
            validateStatus={form.errors.purity ? 'error' : ''}
            help={form.errors.purity}
          >
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.purity}
              onChange={(value) => form.setFieldValue('purity', value || 0)}
              precision={2}
              min={0}
              max={100}
              addonAfter="%"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Wastage (%)">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.wastage_percentage}
              onChange={(value) => form.setFieldValue('wastage_percentage', value || 0)}
              precision={2}
              min={0}
              max={100}
              addonAfter="%"
            />
          </Form.Item>
        </Col>
      </Row>

      {form.values.net_weight > 0 && form.values.purity > 0 && (
        <Alert
          message={`Fine Weight: ${((form.values.net_weight * form.values.purity) / 100).toFixed(3)}g`}
          type="info"
          showIcon
        />
      )}
    </Card>
  );

  // Step 2: Pricing
  const renderPricing = () => (
    <Card title="Pricing Information">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Unit Price (₹)"
            required
            validateStatus={form.errors.unit_price ? 'error' : ''}
            help={form.errors.unit_price}
          >
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.unit_price}
              onChange={(value) => form.setFieldValue('unit_price', value || 0)}
              precision={2}
              min={0}
              prefix="₹"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="MRP (₹)">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.mrp}
              onChange={(value) => form.setFieldValue('mrp', value || 0)}
              precision={2}
              min={0}
              prefix="₹"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Making Charge Type">
            <Radio.Group
              value={form.values.making_charge_type}
              onChange={(e) => form.setFieldValue('making_charge_type', e.target.value)}
            >
              <Radio value="per_gram">Per Gram</Radio>
              <Radio value="percentage">Percentage</Radio>
              <Radio value="fixed">Fixed</Radio>
              <Radio value="slab">Slab</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Making Charge">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.making_charge}
              onChange={(value) => form.setFieldValue('making_charge', value || 0)}
              precision={2}
              min={0}
              addonAfter={form.values.making_charge_type === 'percentage' ? '%' : '₹'}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // Step 3: Stock & Location
  const renderStockLocation = () => (
    <Card title="Stock & Location">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Quantity">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.quantity}
              onChange={(value) => form.setFieldValue('quantity', value || 1)}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Current Stock">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.current_stock}
              onChange={(value) => form.setFieldValue('current_stock', value || 0)}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Min Stock Level">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.min_stock_level}
              onChange={(value) => form.setFieldValue('min_stock_level', value || 0)}
              min={0}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Reorder Level">
            <InputNumber
              style={{ width: '100%' }}
              value={form.values.reorder_level}
              onChange={(value) => form.setFieldValue('reorder_level', value || 0)}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Location">
            <Input
              placeholder="e.g., Warehouse A"
              value={form.values.location}
              onChange={(e) => form.setFieldValue('location', e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Rack Number">
            <Input
              placeholder="e.g., R-123"
              value={form.values.rack_number}
              onChange={(e) => form.setFieldValue('rack_number', e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Shelf Number">
            <Input
              placeholder="e.g., S-456"
              value={form.values.shelf_number}
              onChange={(e) => form.setFieldValue('shelf_number', e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // Step 4: Identification
  const renderIdentification = () => (
    <Card title="Identification & Tracking">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Barcode">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Scan or enter barcode"
                value={form.values.barcode}
                onChange={(e) => form.setFieldValue('barcode', e.target.value)}
              />
              <Button
                icon={<BarcodeOutlined />}
                onClick={() => setShowBarcodeScanner(true)}
              >
                Scan
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="RFID Tag">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Read or enter RFID tag"
                value={form.values.rfid_tag}
                onChange={(e) => form.setFieldValue('rfid_tag', e.target.value)}
              />
              <Button
                icon={<WifiOutlined />}
                onClick={() => setShowRFIDScanner(true)}
              >
                Read
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
      </Row>

      <Divider>Hallmark Information</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="HUID">
            <Input
              placeholder="Enter HUID"
              value={form.values.huid}
              onChange={(e) => form.setFieldValue('huid', e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Hallmark Number">
            <Input
              placeholder="Enter hallmark number"
              value={form.values.hallmark_number}
              onChange={(e) => form.setFieldValue('hallmark_number', e.target.value)}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Hallmark Center">
            <Input
              placeholder="Enter hallmark center"
              value={form.values.hallmark_center}
              onChange={(e) => form.setFieldValue('hallmark_center', e.target.value)}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  // Step 5: Images & Tags
  const renderImagesAndTags = () => (
    <Card title="Images & Tags">
      <Form.Item label="Product Images">
        <ImageUpload
          value={form.values.images}
          onChange={(images) => form.setFieldValue('images', images)}
          maxImages={10}
          maxSizePerImage={5}
          compressImages
        />
      </Form.Item>

      <Divider />

      <Form.Item label="Tags">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Add tags (e.g., bestseller, new-arrival)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={addTag}
            />
            <Button type="primary" onClick={addTag}>
              Add Tag
            </Button>
          </Space.Compact>
          <div>
            {form.values.tags.map((tag) => (
              <Tag
                key={tag}
                closable
                onClose={() => removeTag(tag)}
                color="blue"
              >
                {tag}
              </Tag>
            ))}
          </div>
        </Space>
      </Form.Item>

      <Form.Item label="Notes">
        <TextArea
          rows={4}
          placeholder="Additional notes about the product"
          value={form.values.notes}
          onChange={(e) => form.setFieldValue('notes', e.target.value)}
        />
      </Form.Item>
    </Card>
  );

  // Step 6: Review
  const renderReview = () => (
    <Card title="Review Product Details">
      <Tabs defaultActiveKey="1">
        <TabPane tab="Basic Info" key="1">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <strong>Product Name:</strong> {form.values.product_name || '-'}
            </Col>
            <Col span={12}>
              <strong>Category:</strong>{' '}
              {categories.find((c) => c.id === form.values.category_id)?.category_name || '-'}
            </Col>
            <Col span={12}>
              <strong>Metal Type:</strong>{' '}
              {metalTypes.find((m) => m.id === form.values.metal_type_id)?.metal_name || '-'}
            </Col>
            <Col span={12}>
              <strong>Status:</strong> <Tag color="blue">{form.values.status}</Tag>
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Weight & Pricing" key="2">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <strong>Gross Weight:</strong> {form.values.gross_weight}g
            </Col>
            <Col span={8}>
              <strong>Net Weight:</strong> {form.values.net_weight}g
            </Col>
            <Col span={8}>
              <strong>Purity:</strong> {form.values.purity}%
            </Col>
            <Col span={8}>
              <strong>Unit Price:</strong> ₹{form.values.unit_price.toLocaleString('en-IN')}
            </Col>
            <Col span={8}>
              <strong>MRP:</strong> ₹{form.values.mrp.toLocaleString('en-IN')}
            </Col>
            <Col span={8}>
              <strong>Making Charge:</strong> {form.values.making_charge}{' '}
              {form.values.making_charge_type === 'percentage' ? '%' : '₹'}
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Stock & Location" key="3">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <strong>Current Stock:</strong> {form.values.current_stock}
            </Col>
            <Col span={8}>
              <strong>Min Stock Level:</strong> {form.values.min_stock_level}
            </Col>
            <Col span={8}>
              <strong>Location:</strong> {form.values.location || '-'}
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Identification" key="4">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <strong>Barcode:</strong> {form.values.barcode || '-'}
            </Col>
            <Col span={12}>
              <strong>RFID Tag:</strong> {form.values.rfid_tag || '-'}
            </Col>
            <Col span={12}>
              <strong>HUID:</strong> {form.values.huid || '-'}
            </Col>
            <Col span={12}>
              <strong>Hallmark Number:</strong> {form.values.hallmark_number || '-'}
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="Images & Tags" key="5">
          <div>
            <strong>Images:</strong> {form.values.images.length} image(s)
          </div>
          <div style={{ marginTop: 16 }}>
            <strong>Tags:</strong>
            <div style={{ marginTop: 8 }}>
              {form.values.tags.length > 0 ? (
                form.values.tags.map((tag) => (
                  <Tag key={tag} color="blue">
                    {tag}
                  </Tag>
                ))
              ) : (
                '-'
              )}
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderWeightDetails();
      case 2:
        return renderPricing();
      case 3:
        return renderStockLocation();
      case 4:
        return renderIdentification();
      case 5:
        return renderImagesAndTags();
      case 6:
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </Space>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginTop: 16 }}>
          {isEditMode ? 'Edit Product' : 'Create New Product'}
        </h1>
      </div>

      {/* Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} size="small">
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </Card>

      {/* Form Content */}
      <Form layout="vertical">
        {renderStepContent()}
      </Form>

      {/* Navigation Buttons */}
      <Card style={{ marginTop: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            {currentStep > 0 && (
              <Button icon={<ArrowLeftOutlined />} onClick={prevStep}>
                Previous
              </Button>
            )}
          </Space>
          <Space>
            <Button icon={<CloseOutlined />} onClick={() => navigate('/products')}>
              Cancel
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={form.handleSubmit}
                loading={loading}
              >
                {isEditMode ? 'Update Product' : 'Create Product'}
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* Hardware Modals */}
      <Modal
        title="Scan Barcode"
        open={showBarcodeScanner}
        onCancel={() => setShowBarcodeScanner(false)}
        footer={null}
        width={600}
      >
        <BarcodeScanner onScan={handleBarcodeScanned} enableContinuous={false} />
      </Modal>

      <Modal
        title="Read RFID Tag"
        open={showRFIDScanner}
        onCancel={() => setShowRFIDScanner(false)}
        footer={null}
        width={600}
      >
        <RFIDScanner onRead={handleRFIDRead} enableContinuous={false} />
      </Modal>
    </div>
  );
};

export default ProductForm;
