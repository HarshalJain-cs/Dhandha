import React from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';

interface Column<T> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
}

interface CustomTableProps<T> extends Omit<AntTableProps<T>, 'columns'> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  ...props
}: CustomTableProps<T>) {
  const antdColumns = columns.map((col) => ({
    key: col.key,
    title: col.title,
    dataIndex: col.dataIndex || col.key,
    render: col.render,
    width: col.width,
  }));

  return (
    <AntTable
      columns={antdColumns}
      dataSource={data}
      loading={loading}
      locale={{ emptyText: emptyMessage }}
      {...props}
    />
  );
}

export default Table;
