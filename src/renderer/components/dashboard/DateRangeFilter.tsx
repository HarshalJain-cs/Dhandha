import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

interface DateRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onChange={onChange} style={{ width: 150 }}>
      <Option value="7d">Last 7 Days</Option>
      <Option value="30d">Last 30 Days</Option>
      <Option value="90d">Last 90 Days</Option>
      <Option value="1y">Last Year</Option>
      <Option value="all">All Time</Option>
    </Select>
  );
};

export default DateRangeFilter;
