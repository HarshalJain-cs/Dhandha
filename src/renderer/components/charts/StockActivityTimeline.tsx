import React, { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Tag,
  Space,
  Typography,
  Empty,
  Spin,
  Button,
  Tooltip,
} from 'antd';
import {
  ClockCircleOutlined,
  PlusOutlined,
  MinusOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  UndoOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

export interface StockActivityTimelineProps {
  productId: number;
  limit?: number;
  showLoadMore?: boolean;
}

interface StockActivity {
  id: number;
  product_id: number;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'production';
  quantity: number;
  running_balance: number;
  unit_cost: number | null;
  total_value: number | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
  creator: {
    id: number;
    full_name: string;
    email: string;
  };
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'purchase':
      return <PlusOutlined style={{ color: '#52c41a' }} />;
    case 'sale':
      return <ShoppingCartOutlined style={{ color: '#1890ff' }} />;
    case 'adjustment':
      return <SwapOutlined style={{ color: '#faad14' }} />;
    case 'return':
      return <UndoOutlined style={{ color: '#13c2c2' }} />;
    case 'transfer':
      return <ExportOutlined style={{ color: '#722ed1' }} />;
    case 'production':
      return <ToolOutlined style={{ color: '#eb2f96' }} />;
    default:
      return <MinusOutlined />;
  }
};

const getTransactionColor = (type: string): string => {
  switch (type) {
    case 'purchase':
      return 'success';
    case 'sale':
      return 'blue';
    case 'adjustment':
      return 'warning';
    case 'return':
      return 'cyan';
    case 'transfer':
      return 'purple';
    case 'production':
      return 'magenta';
    default:
      return 'default';
  }
};

const getQuantityColor = (quantity: number): string => {
  return quantity > 0 ? '#52c41a' : '#ff4d4f';
};

const formatQuantity = (quantity: number): string => {
  return quantity > 0 ? `+${quantity}` : `${quantity}`;
};

export const StockActivityTimeline: React.FC<StockActivityTimelineProps> = ({
  productId,
  limit = 20,
  showLoadMore = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<StockActivity[]>([]);
  const [currentLimit, setCurrentLimit] = useState(limit);

  useEffect(() => {
    loadActivities();
  }, [productId, currentLimit]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await window.api.products.getStockActivity(productId, currentLimit);
      if (response.success) {
        setActivities(response.data);
      } else {
        console.error('Failed to load stock activities:', response.message);
      }
    } catch (error) {
      console.error('Error loading stock activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setCurrentLimit((prev) => prev + 20);
  };

  const handleRefresh = () => {
    loadActivities();
  };

  const renderActivityDescription = (activity: StockActivity) => {
    const time = dayjs(activity.created_at);
    const relativeTimeStr = time.fromNow();
    const fullTimeStr = time.format('MMMM DD, YYYY [at] h:mm A');

    return (
      <div style={{ marginBottom: 8 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {/* Transaction Type and Quantity */}
          <Space size={8}>
            <Tag color={getTransactionColor(activity.transaction_type)}>
              {activity.transaction_type.toUpperCase()}
            </Tag>
            <Text strong style={{ color: getQuantityColor(activity.quantity) }}>
              {formatQuantity(activity.quantity)} units
            </Text>
            <Text type="secondary">→</Text>
            <Text>Balance: {activity.running_balance}</Text>
          </Space>

          {/* Value Information */}
          {activity.total_value !== null && (
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Value: ₹{activity.total_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
              {activity.unit_cost !== null && (
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  (₹{activity.unit_cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/unit)
                </Text>
              )}
            </Space>
          )}

          {/* Reference Information */}
          {activity.reference_type && (
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Ref: {activity.reference_type}
              {activity.reference_id && ` #${activity.reference_id}`}
            </Text>
          )}

          {/* Notes */}
          {activity.notes && (
            <Text
              type="secondary"
              italic
              style={{ fontSize: '13px', display: 'block', marginTop: 4 }}
            >
              "{activity.notes}"
            </Text>
          )}

          {/* User and Time */}
          <Space size={8} style={{ fontSize: '12px', color: '#8c8c8c' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              By {activity.creator.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              •
            </Text>
            <Tooltip title={fullTimeStr}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {relativeTimeStr}
              </Text>
            </Tooltip>
          </Space>
        </Space>
      </div>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            Stock Activity Timeline
          </Space>
        }
      >
        <Spin tip="Loading activities...">
          <div style={{ padding: '40px 0' }} />
        </Spin>
      </Card>
    );
  }

  if (!loading && activities.length === 0) {
    return (
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            Stock Activity Timeline
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </Button>
        }
      >
        <Empty
          description="No stock activity found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <ClockCircleOutlined />
          Stock Activity Timeline
          <Tag color="blue">{activities.length} activities</Tag>
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          size="small"
          loading={loading}
        >
          Refresh
        </Button>
      }
    >
      <Timeline
        mode="left"
        items={activities.map((activity) => ({
          dot: getTransactionIcon(activity.transaction_type),
          children: renderActivityDescription(activity),
        }))}
      />

      {showLoadMore && activities.length >= currentLimit && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button
            onClick={handleLoadMore}
            loading={loading}
            icon={<ReloadOutlined />}
          >
            Load More Activities
          </Button>
        </div>
      )}
    </Card>
  );
};

export default StockActivityTimeline;
