import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Tabs,
  Statistic,
  Badge,
  Spin,
  Alert,
  Divider,
  Modal,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  BarChartOutlined,
  HistoryOutlined,
  PictureOutlined,
  BarcodeOutlined,
  WifiOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { StockHistoryChart, StockActivityTimeline } from '../../components/charts';
import { ImageViewer } from '../../components/ui';

const { TabPane } = Tabs;

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  description: string;
  design_number: string;
  size: string;
  category?: { id: number; category_name: string; category_code: string };
  metalType?: { id: number; metal_name: string; purity_percentage: number };
  gross_weight: number;
  net_weight: number;
  fine_weight: number;
  stone_weight: number;
  purity: number;
  wastage_percentage: number;
  unit_price: number;
  mrp: number;
  making_charge_type: string;
  making_charge: number;
  quantity: number;
  current_stock: number;
  min_stock_level: number;
  reorder_level: number;
  location: string;
  rack_number: string;
  shelf_number: string;
  status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  barcode: string;
  rfid_tag: string;
  huid: string;
  hallmark_number: string;
  hallmark_center: string;
  images: string[];
  tags: string[];
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stock_alert?: string;
  total_stone_value?: number;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const printRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadProduct(Number(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await window.api.products.getById(productId);

      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        setError(response.message || 'Failed to load product');
      }
    } catch (err: any) {
      console.error('Failed to load product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await window.api.products.delete(product.id, user?.id || 1);
          if (response.success) {
            message.success('Product deleted successfully');
            navigate('/products');
          } else {
            message.error(response.message);
          }
        } catch (err: any) {
          message.error(err.message || 'Failed to delete product');
        }
      },
    });
  };

  const handlePrint = () => {
    if (!product) return;

    // Create a print-friendly version of the product details
    const printContent = `
      <html>
        <head>
          <title>Product: ${product.product_code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1890ff; margin-bottom: 5px; }
            .code { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; width: 30%; }
            .section-title { font-size: 16px; font-weight: bold; margin-top: 30px; margin-bottom: 10px; color: #333; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${product.product_name}</h1>
          <div class="code">Code: ${product.product_code}</div>

          <div class="section-title">Basic Information</div>
          <table>
            <tr><th>Category</th><td>${product.category?.category_name || '-'}</td></tr>
            <tr><th>Metal Type</th><td>${product.metalType ? `${product.metalType.metal_name} (${product.metalType.purity_percentage}%)` : '-'}</td></tr>
            <tr><th>Design Number</th><td>${product.design_number || '-'}</td></tr>
            <tr><th>Size</th><td>${product.size || '-'}</td></tr>
            <tr><th>Status</th><td>${product.status.replace('_', ' ').toUpperCase()}</td></tr>
          </table>

          <div class="section-title">Weight Details</div>
          <table>
            <tr><th>Gross Weight</th><td>${product.gross_weight}g</td></tr>
            <tr><th>Net Weight</th><td>${product.net_weight}g</td></tr>
            <tr><th>Stone Weight</th><td>${product.stone_weight}g</td></tr>
            <tr><th>Fine Weight</th><td>${product.fine_weight}g</td></tr>
            <tr><th>Purity</th><td>${product.purity}%</td></tr>
          </table>

          <div class="section-title">Pricing</div>
          <table>
            <tr><th>Unit Price</th><td>₹${product.unit_price.toLocaleString('en-IN')}</td></tr>
            <tr><th>MRP</th><td>₹${product.mrp?.toLocaleString('en-IN') || '-'}</td></tr>
            <tr><th>Making Charge</th><td>${product.making_charge}${product.making_charge_type === 'percentage' ? '%' : '₹'}</td></tr>
          </table>

          <div class="section-title">Stock & Location</div>
          <table>
            <tr><th>Current Stock</th><td>${product.current_stock}</td></tr>
            <tr><th>Location</th><td>${product.location || '-'}</td></tr>
            <tr><th>Rack/Shelf</th><td>${product.rack_number || '-'} / ${product.shelf_number || '-'}</td></tr>
          </table>

          <div class="section-title">Identification</div>
          <table>
            <tr><th>Barcode</th><td>${product.barcode || '-'}</td></tr>
            <tr><th>RFID Tag</th><td>${product.rfid_tag || '-'}</td></tr>
            <tr><th>HUID</th><td>${product.huid || '-'}</td></tr>
            <tr><th>Hallmark Number</th><td>${product.hallmark_number || '-'}</td></tr>
          </table>

          <div class="footer">
            Printed on ${new Date().toLocaleString('en-IN')} | Dhandha Jewellery ERP
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank') as Window | null;
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      message.error('Unable to open print window. Please check your popup blocker settings.');
    }
  };

  const handleShare = async () => {
    if (!product) return;

    // Create shareable text with product details
    const shareText = `
📿 ${product.product_name}
━━━━━━━━━━━━━━━━━━━━━

📋 Code: ${product.product_code}
📦 Category: ${product.category?.category_name || '-'}
⚙️ Metal: ${product.metalType ? `${product.metalType.metal_name} (${product.metalType.purity_percentage}%)` : '-'}

⚖️ Weight Details:
   Gross: ${product.gross_weight}g
   Net: ${product.net_weight}g
   Purity: ${product.purity}%

💰 Price: ₹${product.unit_price.toLocaleString('en-IN')}
📊 Stock: ${product.current_stock} units

${product.huid ? `🔖 HUID: ${product.huid}` : ''}
${product.barcode ? `📊 Barcode: ${product.barcode}` : ''}

━━━━━━━━━━━━━━━━━━━━━
Shared from Dhandha Jewellery ERP
    `.trim();

    try {
      // Try using the Web Share API first (for mobile/supported browsers)
      if (navigator.share) {
        await navigator.share({
          title: product.product_name,
          text: shareText,
        });
        message.success('Product shared successfully');
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareText);
        message.success('Product details copied to clipboard');
      }
    } catch (error: any) {
      // If share was cancelled or clipboard failed
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        message.error('Failed to share product details');
      }
    }
  };

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      in_stock: 'success',
      sold: 'default',
      reserved: 'blue',
      in_repair: 'orange',
      with_karigar: 'purple',
    };
    return colors[status] || 'default';
  };

  const getStockBadgeStatus = (product: Product) => {
    if (product.current_stock <= 0) {
      return { status: 'error', text: 'Out of Stock' } as const;
    }
    if (product.current_stock <= product.min_stock_level) {
      return { status: 'warning', text: 'Low Stock' } as const;
    }
    return { status: 'success', text: 'In Stock' } as const;
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: 24 }}>
        <Alert message="Error" description={error || 'Product not found'} type="error" showIcon />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
          style={{ marginTop: 16 }}
        >
          Back to Products
        </Button>
      </div>
    );
  }

  const stockBadge = getStockBadgeStatus(product);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </Space>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>{product.product_name}</h1>
            <Space style={{ marginTop: 8 }}>
              <Tag color="blue">{product.product_code}</Tag>
              <Tag color={getStatusColor(product.status)}>{product.status.replace('_', ' ').toUpperCase()}</Tag>
              <Badge status={stockBadge.status} text={stockBadge.text} />
            </Space>
          </div>

          <Space>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              Share
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/products/${product.id}/edit`)}
            >
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          </Space>
        </div>
      </div>

      {/* Stock Alert */}
      {product.stock_alert && (
        <Alert
          message={product.stock_alert}
          type={product.current_stock <= 0 ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Images and Quick Stats */}
        <Col xs={24} lg={8}>
          {/* Images */}
          <Card
            title={
              <Space>
                <PictureOutlined />
                Product Images
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            {product.images && product.images.length > 0 ? (
              <div>
                <div
                  style={{
                    width: '100%',
                    height: 300,
                    background: '#f0f0f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    marginBottom: 16,
                  }}
                  onClick={() => openImageViewer(0)}
                >
                  <img
                    src={product.images[0]}
                    alt={product.product_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                {product.images.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {product.images.slice(1, 5).map((img, index) => (
                      <div
                        key={index}
                        style={{
                          width: '100%',
                          paddingBottom: '100%',
                          position: 'relative',
                          background: '#f0f0f0',
                          borderRadius: 4,
                          overflow: 'hidden',
                          cursor: 'pointer',
                        }}
                        onClick={() => openImageViewer(index + 1)}
                      >
                        <img
                          src={img}
                          alt={`${product.product_name} ${index + 2}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {index === 3 && product.images.length > 5 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: 18,
                              fontWeight: 600,
                            }}
                          >
                            +{product.images.length - 5}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 300,
                  background: '#f0f0f0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PictureOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Unit Price"
                  value={product.unit_price}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Current Stock"
                  value={product.current_stock}
                  valueStyle={{
                    color: product.current_stock <= 0 ? '#ff4d4f' : product.current_stock <= product.min_stock_level ? '#faad14' : '#52c41a',
                  }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Gross Weight"
                  value={product.gross_weight}
                  precision={3}
                  suffix="g"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic
                  title="Purity"
                  value={product.purity}
                  precision={2}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Right Column - Detailed Information */}
        <Col xs={24} lg={16}>
          <Tabs defaultActiveKey="1">
            {/* Basic Information Tab */}
            <TabPane tab="Basic Information" key="1">
              <Card>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Product Code">{product.product_code}</Descriptions.Item>
                  <Descriptions.Item label="Product Name">{product.product_name}</Descriptions.Item>
                  <Descriptions.Item label="Category">
                    {product.category?.category_name || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Metal Type">
                    {product.metalType ? `${product.metalType.metal_name} (${product.metalType.purity_percentage}%)` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Design Number">{product.design_number || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Size">{product.size || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Status" span={2}>
                    <Tag color={getStatusColor(product.status)}>{product.status.replace('_', ' ').toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Description" span={2}>
                    {product.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>

            {/* Weight & Pricing Tab */}
            <TabPane tab="Weight & Pricing" key="2">
              <Card title="Weight Details" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Gross Weight">{product.gross_weight}g</Descriptions.Item>
                  <Descriptions.Item label="Net Weight">{product.net_weight}g</Descriptions.Item>
                  <Descriptions.Item label="Stone Weight">{product.stone_weight}g</Descriptions.Item>
                  <Descriptions.Item label="Fine Weight">{product.fine_weight}g</Descriptions.Item>
                  <Descriptions.Item label="Purity">{product.purity}%</Descriptions.Item>
                  <Descriptions.Item label="Wastage">{product.wastage_percentage}%</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Pricing Details">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Unit Price">₹{product.unit_price.toLocaleString('en-IN')}</Descriptions.Item>
                  <Descriptions.Item label="MRP">₹{product.mrp?.toLocaleString('en-IN') || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Making Charge Type">{product.making_charge_type}</Descriptions.Item>
                  <Descriptions.Item label="Making Charge">
                    {product.making_charge}{product.making_charge_type === 'percentage' ? '%' : '₹'}
                  </Descriptions.Item>
                  {product.total_stone_value !== undefined && (
                    <Descriptions.Item label="Stone Value" span={2}>
                      ₹{product.total_stone_value.toLocaleString('en-IN')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </TabPane>

            {/* Stock & Location Tab */}
            <TabPane tab="Stock & Location" key="3">
              <Card>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Current Stock">
                    <Badge status={stockBadge.status} text={product.current_stock.toString()} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Quantity">{product.quantity}</Descriptions.Item>
                  <Descriptions.Item label="Min Stock Level">{product.min_stock_level}</Descriptions.Item>
                  <Descriptions.Item label="Reorder Level">{product.reorder_level}</Descriptions.Item>
                  <Descriptions.Item label="Location" span={2}>
                    <Space>
                      <EnvironmentOutlined />
                      {product.location || '-'}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Rack Number">{product.rack_number || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Shelf Number">{product.shelf_number || '-'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>

            {/* Identification Tab */}
            <TabPane tab="Identification" key="4">
              <Card title="Tracking Information" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Barcode">
                    <Space>
                      <BarcodeOutlined />
                      {product.barcode || '-'}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="RFID Tag">
                    <Space>
                      <WifiOutlined />
                      {product.rfid_tag || '-'}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Hallmark Information">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="HUID">{product.huid || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Hallmark Number">{product.hallmark_number || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Hallmark Center">{product.hallmark_center || '-'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>

            {/* Stock History Tab */}
            <TabPane
              tab={
                <Space>
                  <BarChartOutlined />
                  Stock History
                </Space>
              }
              key="5"
            >
              <StockHistoryChart productId={product.id} defaultDays={30} showStats />
            </TabPane>

            {/* Activity Timeline Tab */}
            <TabPane
              tab={
                <Space>
                  <HistoryOutlined />
                  Activity Timeline
                </Space>
              }
              key="6"
            >
              <StockActivityTimeline productId={product.id} limit={20} showLoadMore />
            </TabPane>

            {/* Additional Info Tab */}
            <TabPane tab="Additional Info" key="7">
              <Card title="Tags" style={{ marginBottom: 16 }}>
                <Space size={[8, 8]} wrap>
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag) => (
                      <Tag key={tag} color="blue">
                        {tag}
                      </Tag>
                    ))
                  ) : (
                    <span style={{ color: '#8c8c8c' }}>No tags</span>
                  )}
                </Space>
              </Card>

              <Card title="Notes" style={{ marginBottom: 16 }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{product.notes || 'No notes available'}</p>
              </Card>

              <Card title="Metadata">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Created At">
                    {new Date(product.created_at).toLocaleString('en-IN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Updated">
                    {new Date(product.updated_at).toLocaleString('en-IN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Active Status">
                    <Tag color={product.is_active ? 'success' : 'error'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </TabPane>
          </Tabs>
        </Col>
      </Row>

      {/* Image Viewer Modal */}
      {product.images && product.images.length > 0 && (
        <ImageViewer
          images={product.images}
          initialIndex={imageViewerIndex}
          open={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;
