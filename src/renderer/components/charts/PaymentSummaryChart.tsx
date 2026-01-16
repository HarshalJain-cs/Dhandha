import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { chartColors, currencyFormatter } from '../../utils/chartConfig';
import { Empty, Spin } from 'antd';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentSummaryChartProps {
  data: {
    payment_mode: string;
    count: string;
    total_amount: string;
  }[];
  loading?: boolean;
}

const PaymentSummaryChart: React.FC<PaymentSummaryChartProps> = ({
  data,
  loading,
}) => {
  const paymentModeColors: Record<string, string> = {
    cash: chartColors.success,
    card: chartColors.primary,
    upi: chartColors.purple,
    cheque: chartColors.warning,
    bank_transfer: chartColors.cyan,
    metal_account: chartColors.gold,
    mixed: chartColors.magenta,
  };

  const paymentModeLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    metal_account: 'Metal Account',
    mixed: 'Mixed',
  };

  const chartData = {
    labels: data.map(
      (item) => paymentModeLabels[item.payment_mode] || item.payment_mode
    ),
    datasets: [
      {
        label: 'Payment Amount',
        data: data.map((item) => Number(item.total_amount)),
        backgroundColor: data.map(
          (item) => paymentModeColors[item.payment_mode] || chartColors.primary
        ),
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
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const item = data[index];
            const total = data.reduce(
              (sum, i) => sum + Number(i.total_amount),
              0
            );
            const percentage = (
              (Number(item.total_amount) / total) *
              100
            ).toFixed(1);
            return [
              `Amount: ${currencyFormatter(Number(item.total_amount))}`,
              `Transactions: ${item.count}`,
              `Share: ${percentage}%`,
            ];
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
        <Empty description="No payment data available for the selected period" />
      </div>
    );
  }

  return (
    <div style={{ height: '320px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default PaymentSummaryChart;
