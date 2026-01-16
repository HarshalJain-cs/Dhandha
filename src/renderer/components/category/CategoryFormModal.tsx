import React, { useEffect, useState } from 'react';
import { Modal, Input, TreeSelect, InputNumber, message } from 'antd';
import { useForm } from '../../hooks/useForm';
import { required, createSchema } from '../../utils/validation';
import { ImageUpload } from '../ui';

/**
 * Category Form Modal
 * Create/Edit category with hierarchical parent selection
 */

interface Category {
  id: number;
  category_code: string;
  category_name: string;
  parent_category_id: number | null;
  hsn_code?: string | null;
  description?: string | null;
  images?: string[] | null;
  default_making_charge_percentage?: number;
  default_wastage_percentage?: number;
  children?: Category[];
}

interface CategoryFormModalProps {
  /** Modal visibility */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Submit callback */
  onSubmit: (data: any) => Promise<void>;
  /** Mode: create or edit */
  mode: 'create' | 'edit';
  /** Category to edit (required for edit mode) */
  category?: Category;
  /** Parent category (for create mode) */
  parentCategory?: Category;
  /** All categories (for parent selection) */
  allCategories?: Category[];
  /** Loading state */
  loading?: boolean;
}

const validationSchema = createSchema({
  category_name: {
    rules: [required('Category name is required')],
  },
  category_code: {
    rules: [required('Category code is required')],
  },
});

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  mode,
  category,
  parentCategory,
  allCategories = [],
  loading = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  /**
   * Generate category code suggestion
   */
  const generateCode = (name: string): string => {
    // Take first 3 letters of each word, uppercase
    const words = name.trim().split(/\s+/);
    const code = words
      .map((word) => word.substring(0, 3).toUpperCase())
      .join('');
    return code || 'CAT';
  };

  /**
   * Initialize form
   */
  const form = useForm({
    initialValues: {
      category_code: category?.category_code || '',
      category_name: category?.category_name || '',
      parent_category_id: category?.parent_category_id || parentCategory?.id || null,
      hsn_code: category?.hsn_code || '',
      description: category?.description || '',
      images: category?.images || [],
      default_making_charge_percentage: category?.default_making_charge_percentage || 0,
      default_wastage_percentage: category?.default_wastage_percentage || 0,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        await onSubmit(values);
        message.success(`Category ${mode === 'create' ? 'created' : 'updated'} successfully`);
        onClose();
      } catch (error: any) {
        message.error(error.message || `Failed to ${mode} category`);
      } finally {
        setSubmitting(false);
      }
    },
    validateOnBlur: true,
  });

  /**
   * Auto-generate code when name changes (only in create mode)
   */
  useEffect(() => {
    if (mode === 'create' && form.values.category_name && !form.touched.category_code) {
      const suggestedCode = generateCode(form.values.category_name);
      form.setFieldValue('category_code', suggestedCode);
    }
  }, [form.values.category_name, mode]);

  /**
   * Build tree data for parent selection
   */
  const buildTreeData = (categories: Category[], excludeId?: number): any[] => {
    return categories
      .filter((cat) => cat.id !== excludeId) // Exclude current category to prevent self-selection
      .map((cat) => ({
        value: cat.id,
        title: cat.category_name,
        children: cat.children ? buildTreeData(cat.children, excludeId) : undefined,
      }));
  };

  /**
   * Build hierarchical tree from flat array
   */
  const buildHierarchy = (items: Category[], parentId: number | null = null): Category[] => {
    return items
      .filter((item) => item.parent_category_id === parentId)
      .map((item) => ({
        ...item,
        children: buildHierarchy(items, item.id),
      }));
  };

  // Convert flat categories to hierarchical if needed
  const hierarchicalCategories = useMemo(() => {
    const hasChildren = allCategories.some((cat) => cat.children && cat.children.length > 0);
    if (hasChildren) {
      return allCategories;
    }
    return buildHierarchy(allCategories);
  }, [allCategories]);

  const treeData = buildTreeData(hierarchicalCategories, category?.id);

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!submitting) {
      form.resetForm();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      onOk={form.handleSubmit}
      title={
        mode === 'create'
          ? parentCategory
            ? `Add Subcategory to "${parentCategory.category_name}"`
            : 'Add Category'
          : `Edit Category: ${category?.category_name}`
      }
      okText={mode === 'create' ? 'Create' : 'Update'}
      confirmLoading={submitting || loading}
      width={600}
      destroyOnClose
    >
      <form onSubmit={form.handleSubmit} className="space-y-4">
        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.values.category_name}
            onChange={(e) => form.handleChange('category_name', e.target.value)}
            onBlur={() => form.handleBlur('category_name')}
            placeholder="e.g., Gold Rings"
            status={form.touched.category_name && form.errors.category_name ? 'error' : undefined}
            disabled={submitting}
          />
          {form.touched.category_name && form.errors.category_name && (
            <div className="text-red-500 text-sm mt-1">{form.errors.category_name}</div>
          )}
        </div>

        {/* Category Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Code <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.values.category_code}
            onChange={(e) => form.handleChange('category_code', e.target.value.toUpperCase())}
            onBlur={() => form.handleBlur('category_code')}
            placeholder="e.g., GOLRING"
            status={form.touched.category_code && form.errors.category_code ? 'error' : undefined}
            disabled={submitting}
          />
          {form.touched.category_code && form.errors.category_code && (
            <div className="text-red-500 text-sm mt-1">{form.errors.category_code}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            Auto-generated from name, but you can edit it
          </div>
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Category
          </label>
          <TreeSelect
            value={form.values.parent_category_id}
            onChange={(value) => form.handleChange('parent_category_id', value || null)}
            treeData={[
              { value: null, title: '(Root Category)' },
              ...treeData,
            ]}
            placeholder="Select parent category (optional)"
            allowClear
            showSearch
            treeDefaultExpandAll
            style={{ width: '100%' }}
            disabled={submitting}
          />
          {parentCategory && (
            <div className="text-xs text-blue-600 mt-1">
              Creating under: {parentCategory.category_name}
            </div>
          )}
        </div>

        {/* HSN Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HSN Code
          </label>
          <Input
            value={form.values.hsn_code}
            onChange={(e) => form.handleChange('hsn_code', e.target.value)}
            placeholder="e.g., 7113"
            disabled={submitting}
          />
          <div className="text-xs text-gray-500 mt-1">
            Harmonized System of Nomenclature code for taxation
          </div>
        </div>

        {/* Default Making Charge % */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Making Charge %
          </label>
          <InputNumber
            value={form.values.default_making_charge_percentage}
            onChange={(value) => form.handleChange('default_making_charge_percentage', value || 0)}
            min={0}
            max={100}
            precision={2}
            style={{ width: '100%' }}
            addonAfter="%"
            disabled={submitting}
          />
        </div>

        {/* Default Wastage % */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Wastage %
          </label>
          <InputNumber
            value={form.values.default_wastage_percentage}
            onChange={(value) => form.handleChange('default_wastage_percentage', value || 0)}
            min={0}
            max={100}
            precision={2}
            style={{ width: '100%' }}
            addonAfter="%"
            disabled={submitting}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Input.TextArea
            value={form.values.description}
            onChange={(e) => form.handleChange('description', e.target.value)}
            placeholder="Optional description for this category"
            rows={3}
            disabled={submitting}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Images
          </label>
          <ImageUpload
            value={form.values.images}
            onChange={(images) => form.handleChange('images', images)}
            maxImages={5}
            maxSizePerImage={2}
            disabled={submitting}
          />
          <div className="text-xs text-gray-500 mt-1">
            Upload representative images for this category
          </div>
        </div>
      </form>
    </Modal>
  );
};

// Add useMemo import
import { useMemo } from 'react';

export default CategoryFormModal;
