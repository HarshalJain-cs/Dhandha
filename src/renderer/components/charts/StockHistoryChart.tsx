import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Select, Spin, Empty, Space, Statistic, Row, Col } from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LineChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StockOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface StockHistoryChartProps {
  productId: number;
  defaultDays?: number;
  showStats?: boolean;
  chartType?: 'line' | 'area';
  height?: number;
}

interface StockSummaryData {
  summary: {
    totalIn: number;
    totalOut: number;
    current: number;
  };
  chart: Array<{
    date: string;
    balance: number;
  }>;
}

export const StockHistoryChart: React.FC<StockHistoryChartProps> = ({
  productId,
  defaultDays = 30,
  showStats = true,
  chartType = 'area',
  height = 400,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StockSummaryData | null>(null);
  const [days, setDays] = useState(defaultDays);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<'line' | 'area'>(chartType);

  useEffect(() => {
    loadStockData();
  }, [productId, days]);

  const loadStockData = async () => {
    setLoading(true);
    try {
      const response = await window.api.products.getStockSummary(productId, days);
      if (response.success) {
        setData(response.data);
      } else {
        console.error('Failed to load stock data:', response.message);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDaysChange = (value: number) => {
    setDays(value);
    setDateRange(null);
  };

  const handleDateRangeChange = (dates: [Dayjs, Dayjs] | null) => {
    if (dates) {
      setDateRange(dates);
      const diffDays = dates[1].diff(dates[0], 'day');
      setDays(diffDays);
    } else {
      setDateRange(null);
      setDays(defaultDays);
    }
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('MMM DD');
  };

  const formatTooltipDate = (dateStr: string) => {
    return dayjs(dateStr).format('MMMM DD, YYYY');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '12px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ margin: 0, marginBottom: '8px', fontWeight: 500 }}>
            {formatTooltipDate(label)}
          </p>
          <p style={{ margin: 0, color: '#1890ff' }}>
            Stock Balance: <strong>{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!data || data.chart.length === 0) {
      return (
        <Empty
          description="No stock history data available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const chartData = data.chart.map((item) => ({
      ...item,
      displayDate: formatDate(item.date),
    }));

    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    return (
      <ResponsiveContainer width="100%" height={height}>
        {selectedChartType === 'area' ? (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              style={{ fontSize: '12px' }}
              label={{ value: 'Stock Quantity', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#1890ff"
              strokeWidth={2}
              fill="url(#colorBalance)"
              name="Stock Balance"
            />
          </AreaChart>
        ) : (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              style={{ fontSize: '12px' }}
              label={{ value: 'Stock Quantity', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#1890ff"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Stock Balance"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <Card
      title={
        <Space>
          <LineChartOutlined />
          Stock History
        </Space>
      }
      extra={
        <Space>
          <Select
            value={selectedChartType}
            onChange={setSelectedChartType}
            style={{ width: 100 }}
            size="small"
          >
            <Option value="line">Line</Option>
            <Option value="area">Area</Option>
          </Select>
          <Select
            value={days}
            onChange={handleDaysChange}
            style={{ width: 120 }}
            size="small"
          >
            <Option value={7}>Last 7 days</Option>
            <Option value={30}>Last 30 days</Option>
            <Option value={90}>Last 90 days</Option>
            <Option value={180}>Last 6 months</Option>
            <Option value={365}>Last year</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            size="small"
            format="YYYY-MM-DD"
          />
        </Space>
      }
    >
      {showStats && data && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic
              title="Total Stock In"
              value={data.summary.totalIn}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total Stock Out"
              value={data.summary.totalOut}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Current Stock"
              value={data.summary.current}
              prefix={<StockOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      )}

      <Spin spinning={loading}>
        {renderChart()}
      </Spin>
    </Card>
  );
};

export default StockHistoryChart;
