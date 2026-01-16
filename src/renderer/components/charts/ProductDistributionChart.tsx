import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { generateColors } from '../../utils/chartConfig';
import { Empty, Spin } from 'antd';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProductDistributionChartProps {
  data: {
    category: string;
    count: string;
    total_stock: string;
  }[];
  loading?: boolean;
}

const ProductDistributionChart: React.FC<ProductDistributionChartProps> = ({
  data,
  loading,
}) => {
  const chartData = {
    labels: data.map((item) => item.category),
    datasets: [
      {
        label: 'Product Count',
        data: data.map((item) => Number(item.count)),
        backgroundColor: generateColors(data.length),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} products (${percentage}%)`;
          },
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
        <Empty description="No product data available" />
      </div>
    );
  }

  return (
    <div style={{ height: '320px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default ProductDistributionChart;
