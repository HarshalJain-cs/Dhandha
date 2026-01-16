import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { defaultChartOptions, currencyFormatter } from '../../utils/chartConfig';
import { Empty, Spin } from 'antd';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  data: {
    date: string;
    total_sales: string;
    invoice_count: string;
  }[];
  loading?: boolean;
}

const SalesChart: React.FC<SalesChartProps> = ({ data, loading }) => {
  const chartData = {
    labels: data.map((item) =>
      new Date(item.date).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      })
    ),
    datasets: [
      {
        label: 'Sales Amount',
        data: data.map((item) => Number(item.total_sales)),
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Invoice Count',
        data: data.map((item) => Number(item.invoice_count)),
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Sales Amount (₹)',
        },
        ticks: {
          callback: (value: number) => currencyFormatter(value),
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Invoice Count',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '320px' }}>
        <Spin size="large" tip="Loading chart data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: '320px' }}>
        <Empty description="No sales data available for the selected period" />
      </div>
    );
  }

  return (
    <div style={{ height: '320px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SalesChart;
