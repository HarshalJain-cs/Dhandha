import React, { useState, useMemo } from 'react';
import { Tree, Input, Space, Button, Tag, Dropdown, Empty } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
} from '@ant-design/icons';

/**
 * Category Tree Component
 * Hierarchical tree view for product categories
 */

interface Category {
  id: number;
  category_code: string;
  category_name: string;
  parent_category_id: number | null;
  hsn_code?: string | null;
  description?: string | null;
  images?: string[] | null;
  product_count?: number;
  children?: Category[];
}

interface CategoryTreeProps {
  /** Categories data (flat or hierarchical) */
  categories: Category[];
  /** Selected category IDs */
  selectedKeys?: React.Key[];
  /** Expanded category IDs */
  expandedKeys?: React.Key[];
  /** Selection change callback */
  onSelect?: (categoryIds: React.Key[], info: any) => void;
  /** Expand change callback */
  onExpand?: (expandedKeys: React.Key[]) => void;
  /** Add category callback */
  onAdd?: (parentId: number | null) => void;
  /** Edit category callback */
  onEdit?: (category: Category) => void;
  /** Delete category callback */
  onDelete?: (category: Category) => void;
  /** Enable search */
  searchable?: boolean;
  /** Show action buttons */
  showActions?: boolean;
  /** Loading state */
  loading?: boolean;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  selectedKeys = [],
  expandedKeys: controlledExpandedKeys,
  onSelect,
  onExpand,
  onAdd,
  onEdit,
  onDelete,
  searchable = true,
  showActions = true,
  loading = false,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [autoExpandedKeys, setAutoExpandedKeys] = useState<React.Key[]>([]);

  // Use controlled or internal expanded keys
  const expandedKeys = controlledExpandedKeys || autoExpandedKeys;
  const setExpandedKeys = onExpand || setAutoExpandedKeys;

  /**
   * Build hierarchical tree from flat array
   */
  const buildTree = (items: Category[], parentId: number | null = null): Category[] => {
    return items
      .filter((item) => item.parent_category_id === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  /**
   * Convert categories to Ant Design tree data
   */
  const convertToTreeData = (categories: Category[]): DataNode[] => {
    return categories.map((category) => {
      const isMatch = searchValue
        ? category.category_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          category.category_code.toLowerCase().includes(searchValue.toLowerCase())
        : false;

      const title = (
        <div className="flex items-center justify-between group w-full py-1">
          <Space>
            <span className={isMatch ? 'text-primary-600 font-medium' : ''}>
              {category.category_name}
            </span>
            {category.hsn_code && (
              <Tag color="blue" className="text-xs">
                HSN: {category.hsn_code}
              </Tag>
            )}
            {category.product_count !== undefined && category.product_count > 0 && (
              <Tag color="green" className="text-xs">
                {category.product_count} items
              </Tag>
            )}
          </Space>

          {showActions && (
            <Space className="opacity-0 group-hover:opacity-100 transition-opacity" size="small">
              {onAdd && (
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(category.id);
                  }}
                  title="Add subcategory"
                />
              )}
              {onEdit && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                  title="Edit category"
                />
              )}
              {onDelete && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category);
                  }}
                  title="Delete category"
                />
              )}
            </Space>
          )}
        </div>
      );

      const node: DataNode = {
        key: category.id,
        title,
        icon: ({ expanded }: any) =>
          expanded ? <FolderOpenOutlined /> : <FolderOutlined />,
        children: category.children?.length
          ? convertToTreeData(category.children)
          : undefined,
      };

      return node;
    });
  };

  /**
   * Build tree structure
   */
  const treeData = useMemo(() => {
    // Check if categories are already hierarchical
    const hasChildren = categories.some((cat) => cat.children && cat.children.length > 0);

    let hierarchical: Category[];
    if (hasChildren) {
      // Already hierarchical
      hierarchical = categories;
    } else {
      // Build hierarchy from flat array
      hierarchical = buildTree(categories);
    }

    return convertToTreeData(hierarchical);
  }, [categories, searchValue, showActions, onAdd, onEdit, onDelete]);

  /**
   * Handle search
   */
  const handleSearch = (value: string) => {
    setSearchValue(value);

    if (value) {
      // Auto-expand nodes that match search
      const getAllKeys = (nodes: DataNode[]): React.Key[] => {
        const keys: React.Key[] = [];
        nodes.forEach((node) => {
          if (node.children) {
            keys.push(node.key);
            keys.push(...getAllKeys(node.children));
          }
        });
        return keys;
      };

      setExpandedKeys(getAllKeys(treeData));
    } else {
      // Collapse all when search is cleared
      setExpandedKeys([]);
    }
  };

  /**
   * Handle expand/collapse
   */
  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys);
  };

  return (
    <div className="category-tree">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          {searchable && (
            <Input
              placeholder="Search categories..."
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
          )}

          {onAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => onAdd(null)}
            >
              Add Root Category
            </Button>
          )}
        </div>

        {/* Tree */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading categories...</div>
        ) : treeData.length > 0 ? (
          <Tree
            showIcon
            showLine
            selectedKeys={selectedKeys}
            expandedKeys={expandedKeys}
            onSelect={onSelect}
            onExpand={handleExpand}
            treeData={treeData}
            className="category-tree-component"
          />
        ) : (
          <Empty
            description={
              searchValue
                ? 'No categories match your search'
                : 'No categories yet. Create your first category to get started.'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchValue && onAdd && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onAdd(null)}>
                Create Category
              </Button>
            )}
          </Empty>
        )}

        {/* Help Text */}
        {treeData.length > 0 && (
          <div className="text-xs text-gray-500">
            💡 Tip: Click the folder icon to expand/collapse, click the name to select
          </div>
        )}
      </Space>

      <style jsx>{`
        .category-tree-component :global(.ant-tree-node-content-wrapper) {
          width: 100%;
        }
        .category-tree-component :global(.ant-tree-title) {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default CategoryTree;
