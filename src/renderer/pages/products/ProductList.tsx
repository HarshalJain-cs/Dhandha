import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Row,
  Col,
  Statistic,
  Dropdown,
  message,
  Modal,
  Image,
  Empty,
  Badge,
  Tooltip,
  InputNumber,
  Collapse,
  Switch,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  BarcodeOutlined,
  WifiOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StockOutlined,
  TagsOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { RootState } from '../../store';
import {
  setProducts,
  setFilters,
  setPagination,
  setLoading,
  setError,
} from '../../store/slices/productSlice';
import { setCategories } from '../../store/slices/categorySlice';
import { setMetalTypes } from '../../store/slices/metalTypeSlice';
import { BarcodeScanner, RFIDScanner } from '../../components/hardware';
import { SearchInput, Pagination as CustomPagination } from '../../components/ui';
import { useDebounce } from '../../hooks';

const { Option } = Select;
const { Panel } = Collapse;

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category?: { id: number; category_name: string };
  metalType?: { id: number; metal_name: string };
  gross_weight: number;
  net_weight: number;
  purity: number;
  unit_price: number;
  mrp?: number;
  current_stock: number;
  min_stock_level: number;
  status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  barcode?: string;
  rfid_tag?: string;
  images?: string[];
  tags?: string[];
  is_active: boolean;
}

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { products, filters, pagination, loading, error } = useSelector(
    (state: RootState) => state.product
  );
  const { categories } = useSelector((state: RootState) => state.category);
  const { metalTypes } = useSelector((state: RootState) => state.metalType);
  const { user } = useSelector((state: RootState) => state.auth);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedMetal, setSelectedMetal] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minWeight, setMinWeight] = useState<number | undefined>();
  const [maxWeight, setMaxWeight] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Hardware integration states
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showRFIDScanner, setShowRFIDScanner] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Load products on mount and when filters/pagination change
  useEffect(() => {
    loadProducts();
  }, [filters, pagination.page, pagination.limit]);

  // Load categories and metal types on mount
  useEffect(() => {
    loadCategoriesAndMetalTypes();
    loadStatistics();
  }, []);

  // Apply search filter when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      applyFilters();
    }
  }, [debouncedSearch]);

  const loadProducts = async () => {
    try {
      dispatch(setLoading(true));
      const response = await window.api.products.getAll(filters, {
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        dispatch(setProducts(response.data));
      } else {
        dispatch(setError(response.message));
        message.error(response.message);
      }
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load products'));
      message.error(err.message || 'Failed to load products');
    }
  };

  const loadCategoriesAndMetalTypes = async () => {
    try {
      const [catResponse, metalResponse] = await Promise.all([
        window.api.categories.getAll({ is_active: true }),
        window.api.metalTypes.getAll({ is_active: true }),
      ]);

      if (catResponse.success) {
        dispatch(setCategories(catResponse.data));
      }

      if (metalResponse.success) {
        dispatch(setMetalTypes(metalResponse.data));
      }
    } catch (err) {
      console.error('Failed to load categories/metal types:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const [totalRes, lowStockRes, outOfStockRes] = await Promise.all([
        window.api.products.getAll({ is_active: true }),
        window.api.products.getLowStock(),
        window.api.products.getOutOfStock(),
      ]);

      if (totalRes.success && lowStockRes.success && outOfStockRes.success) {
        const totalValue = totalRes.data.products.reduce(
          (sum: number, p: any) => sum + p.unit_price * p.current_stock,
          0
        );

        setStats({
          total: totalRes.data.total,
          lowStock: lowStockRes.data.length,
          outOfStock: outOfStockRes.data.length,
          totalValue,
        });
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  const applyFilters = () => {
    const newFilters: any = {};

    if (debouncedSearch) {
      newFilters.search = debouncedSearch;
    }

    if (selectedCategory) {
      newFilters.category_id = selectedCategory;
    }

    if (selectedMetal) {
      newFilters.metal_type_id = selectedMetal;
    }

    if (selectedStatus) {
      newFilters.status = selectedStatus;
    }

    if (minPrice !== undefined) {
      newFilters.min_price = minPrice;
    }

    if (maxPrice !== undefined) {
      newFilters.max_price = maxPrice;
    }

    if (minWeight !== undefined) {
      newFilters.min_weight = minWeight;
    }

    if (maxWeight !== undefined) {
      newFilters.max_weight = maxWeight;
    }

    if (selectedTags.length > 0) {
      newFilters.tags = selectedTags;
    }

    if (showLowStock) {
      newFilters.low_stock = true;
    }

    if (showOutOfStock) {
      newFilters.out_of_stock = true;
    }

    dispatch(setFilters(newFilters));
    dispatch(setPagination({ page: 1, limit: pagination.limit }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(undefined);
    setSelectedMetal(undefined);
    setSelectedStatus(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setMinWeight(undefined);
    setMaxWeight(undefined);
    setSelectedTags([]);
    setShowLowStock(false);
    setShowOutOfStock(false);
    dispatch(setFilters({}));
    dispatch(setPagination({ page: 1, limit: pagination.limit }));
  };

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    try {
      const response = await window.api.products.searchByBarcode(barcode);
      if (response.success && response.data) {
        message.success(`Found: ${response.data.product_name}`);
        navigate(`/products/${response.data.id}`);
      } else {
        message.warning('Product not found with this barcode');
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to search product');
    }
  }, [navigate]);

  const handleRFIDRead = useCallback(async (rfidTag: string) => {
    try {
      const response = await window.api.products.searchByRFID(rfidTag);
      if (response.success && response.data) {
        message.success(`Found: ${response.data.product_name}`);
        navigate(`/products/${response.data.id}`);
      } else {
        message.warning('Product not found with this RFID tag');
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to search product');
    }
  }, [navigate]);

  const handleDelete = async (productId: number) => {
    if (!user) return;

    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await window.api.products.delete(productId, user.id);
          if (response.success) {
            message.success('Product deleted successfully');
            loadProducts();
            loadStatistics();
          } else {
            message.error(response.message);
          }
        } catch (err: any) {
          message.error(err.message || 'Failed to delete product');
        }
      },
    });
  };

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    dispatch(
      setPagination({
        page: paginationConfig.current || 1,
        limit: paginationConfig.pageSize || 10,
      })
    );
  };

  const getStockStatus = (product: Product) => {
    if (product.current_stock <= 0) {
      return { status: 'error', text: 'Out of Stock' };
    }
    if (product.current_stock <= product.min_stock_level) {
      return { status: 'warning', text: 'Low Stock' };
    }
    return { status: 'success', text: 'In Stock' };
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Image',
      key: 'image',
      width: 80,
      render: (_: any, record: Product) => {
        const imageUrl = record.images && record.images.length > 0 ? record.images[0] : undefined;
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={record.product_name}
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            preview={{ mask: <EyeOutlined /> }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              background: '#f0f0f0',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppstoreOutlined style={{ fontSize: 20, color: '#bfbfbf' }} />
          </div>
        );
      },
    },
    {
      title: 'Product Code',
      dataIndex: 'product_code',
      key: 'product_code',
      sorter: true,
      render: (text: string, record: Product) => (
        <Button type="link" onClick={() => navigate(`/products/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: true,
    },
    {
      title: 'Category',
      key: 'category',
      render: (_: any, record: Product) => record.category?.category_name || '-',
    },
    {
      title: 'Metal',
      key: 'metal',
      render: (_: any, record: Product) => record.metalType?.metal_name || '-',
    },
    {
      title: 'Weight (g)',
      dataIndex: 'gross_weight',
      key: 'weight',
      align: 'right',
      sorter: true,
      render: (weight: number) => weight.toFixed(3),
    },
    {
      title: 'Price',
      dataIndex: 'unit_price',
      key: 'price',
      align: 'right',
      sorter: true,
      render: (price: number) => `₹${price.toLocaleString('en-IN')}`,
    },
    {
      title: 'Stock',
      key: 'stock',
      align: 'center',
      render: (_: any, record: Product) => {
        const stockStatus = getStockStatus(record);
        return (
          <Tooltip title={stockStatus.text}>
            <Badge status={stockStatus.status as any} text={record.current_stock.toString()} />
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: { [key: string]: string } = {
          in_stock: 'success',
          sold: 'default',
          reserved: 'blue',
          in_repair: 'orange',
          with_karigar: 'purple',
        };
        return <Tag color={colorMap[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Tags',
      key: 'tags',
      render: (_: any, record: Product) =>
        record.tags && record.tags.length > 0 ? (
          <Space size={4} wrap>
            {record.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} icon={<TagsOutlined />}>
                {tag}
              </Tag>
            ))}
            {record.tags.length > 2 && <Tag>+{record.tags.length - 2}</Tag>}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/products/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/products/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Products</h1>
            <p style={{ color: '#8c8c8c', marginTop: 4 }}>Manage your jewelry inventory</p>
          </div>
          <Space>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'barcode',
                    label: 'Scan Barcode',
                    icon: <BarcodeOutlined />,
                    onClick: () => setShowBarcodeScanner(true),
                  },
                  {
                    key: 'rfid',
                    label: 'Read RFID',
                    icon: <WifiOutlined />,
                    onClick: () => setShowRFIDScanner(true),
                  },
                ],
              }}
            >
              <Button>Quick Search</Button>
            </Dropdown>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
              Add Product
            </Button>
          </Space>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.total}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStock}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats.outOfStock}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={8}>
              <SearchInput
                placeholder="Search by product code, name, barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={applyFilters}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: '100%' }}
                allowClear
              >
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Metal Type"
                value={selectedMetal}
                onChange={setSelectedMetal}
                style={{ width: '100%' }}
                allowClear
              >
                {metalTypes.map((metal) => (
                  <Option key={metal.id} value={metal.id}>
                    {metal.metal_name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="in_stock">In Stock</Option>
                <Option value="sold">Sold</Option>
                <Option value="reserved">Reserved</Option>
                <Option value="in_repair">In Repair</Option>
                <Option value="with_karigar">With Karigar</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={applyFilters}>
                  Search
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleClearFilters}>
                  Reset
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Advanced Filters */}
          <Collapse
            ghost
            activeKey={showAdvancedFilters ? ['1'] : []}
            onChange={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Panel header="Advanced Filters" key="1" extra={<FilterOutlined />}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Price Range</label>
                    <Space>
                      <InputNumber
                        placeholder="Min"
                        value={minPrice}
                        onChange={(val) => setMinPrice(val || undefined)}
                        prefix="₹"
                        style={{ width: '100%' }}
                      />
                      <span>-</span>
                      <InputNumber
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(val) => setMaxPrice(val || undefined)}
                        prefix="₹"
                        style={{ width: '100%' }}
                      />
                    </Space>
                  </div>
                </Col>
                <Col span={6}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Weight Range (g)</label>
                    <Space>
                      <InputNumber
                        placeholder="Min"
                        value={minWeight}
                        onChange={(val) => setMinWeight(val || undefined)}
                        style={{ width: '100%' }}
                      />
                      <span>-</span>
                      <InputNumber
                        placeholder="Max"
                        value={maxWeight}
                        onChange={(val) => setMaxWeight(val || undefined)}
                        style={{ width: '100%' }}
                      />
                    </Space>
                  </div>
                </Col>
                <Col span={6}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Tags</label>
                    <Select
                      mode="tags"
                      placeholder="Select or enter tags"
                      value={selectedTags}
                      onChange={setSelectedTags}
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
                <Col span={6}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Stock Filters</label>
                    <Space direction="vertical">
                      <Space>
                        <Switch checked={showLowStock} onChange={setShowLowStock} />
                        <span>Low Stock Only</span>
                      </Space>
                      <Space>
                        <Switch checked={showOutOfStock} onChange={setShowOutOfStock} />
                        <span>Out of Stock Only</span>
                      </Space>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Space>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
          locale={{
            emptyText: <Empty description="No products found" />,
          }}
        />
      </Card>

      {/* Barcode Scanner Modal */}
      <Modal
        title="Scan Barcode"
        open={showBarcodeScanner}
        onCancel={() => setShowBarcodeScanner(false)}
        footer={null}
        width={600}
      >
        <BarcodeScanner onScan={handleBarcodeScanned} enableContinuous={false} />
      </Modal>

      {/* RFID Scanner Modal */}
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

export default ProductList;
