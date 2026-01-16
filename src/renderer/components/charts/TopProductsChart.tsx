import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  defaultChartOptions,
  currencyFormatter,
  chartColors,
} from '../../utils/chartConfig';
import { Empty, Spin } from 'antd';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopProductsChartProps {
  data: {
    product_name: string;
    total_quantity: string;
    total_revenue: string;
    order_count: string;
  }[];
  loading?: boolean;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ data, loading }) => {
  const chartData = {
    labels: data.map((item) =>
      item.product_name.length > 20
        ? item.product_name.substring(0, 20) + '...'
        : item.product_name
    ),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data.map((item) => Number(item.total_revenue)),
        backgroundColor: chartColors.primary,
        borderRadius: 4,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        ticks: {
          callback: (value: number) => currencyFormatter(value),
        },
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const item = data[index];
            return [
              `Revenue: ${currencyFormatter(Number(item.total_revenue))}`,
              `Quantity Sold: ${item.total_quantity}`,
              `Orders: ${item.order_count}`,
            ];
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Spin size="large" tip="Loading chart data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Empty description="No sales data available for the selected period" />
      </div>
    );
  }

  return (
    <div style={{ height: '400px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TopProductsChart;
