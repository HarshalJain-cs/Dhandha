import type { ChartOptions } from 'chart.js';

/**
 * Default Chart.js configuration options
 */
export const defaultChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 14 },
      bodyFont: { size: 13 },
    },
  },
};

/**
 * Format number as Indian currency (INR)
 */
export const currencyFormatter = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Color palette for charts
 * Using Ant Design color scheme
 */
export const chartColors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  gold: '#d4af37',
  purple: '#722ed1',
  cyan: '#13c2c2',
  magenta: '#eb2f96',
  orange: '#fa8c16',
  lime: '#a0d911',
};

/**
 * Generate an array of colors for charts with multiple datasets
 */
export const generateColors = (count: number): string[] => {
  const colors = Object.values(chartColors);
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }

  return result;
};
