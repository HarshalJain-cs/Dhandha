import React from 'react';
import { Table as AntTable, TableProps as AntTableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

// Export Column type for backward compatibility
export interface Column<T> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
}

// Support both custom Column[] and Ant Design's ColumnsType
interface CustomTableProps<T> extends Omit<AntTableProps<T>, 'columns' | 'dataSource'> {
  columns: Column<T>[] | ColumnsType<T>;
  data?: T[];
  dataSource?: T[];
  loading?: boolean;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  dataSource,
  loading = false,
  emptyMessage = 'No data available',
  ...props
}: CustomTableProps<T>) {
  // Check if columns are custom Column[] or ColumnsType
  const isCustomColumns = columns.length > 0 && 'key' in columns[0] && typeof columns[0].key === 'string';

  const antdColumns = isCustomColumns
    ? (columns as Column<T>[]).map((col) => ({
        key: col.key,
        title: col.title,
        dataIndex: col.dataIndex || col.key,
        render: col.render,
        width: col.width,
      }))
    : columns as ColumnsType<T>;

  return (
    <AntTable
      columns={antdColumns}
      dataSource={dataSource || data}
      loading={loading}
      locale={{ emptyText: emptyMessage }}
      {...props}
    />
  );
}

export default Table;
