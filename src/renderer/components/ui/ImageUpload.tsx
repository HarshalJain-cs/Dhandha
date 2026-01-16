import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LeftOutlined, RightOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import imageCompression from 'browser-image-compression';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Image Upload Component
 * Multi-image upload with drag & drop, reordering, and preview
 */

interface ImageUploadProps {
  /** Array of base64 image strings */
  value?: string[];
  /** Change handler */
  onChange?: (images: string[]) => void;
  /** Maximum number of images */
  maxImages?: number;
  /** Maximum file size in MB */
  maxSizePerImage?: number;
  /** Compress images before upload */
  compressImages?: boolean;
  /** Max width for compression */
  maxWidth?: number;
  /** Max height for compression */
  maxHeight?: number;
  /** Error callback */
  onError?: (error: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show preview */
  showPreview?: boolean;
}

interface SortableImageProps {
  image: string;
  index: number;
  onRemove: (index: number) => void;
  onView: (index: number) => void;
  isPrimary: boolean;
}

const SortableImage: React.FC<SortableImageProps> = ({ image, index, onRemove, onView, isPrimary }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-white hover:border-primary-500 transition-colors"
    >
      {/* Image */}
      <div {...attributes} {...listeners} className="w-full h-full cursor-move">
        <img
          src={image}
          alt={`Upload ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded shadow-md">
          Primary
        </div>
      )}

      {/* Overlay Actions */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <Button
          type="primary"
          shape="circle"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onView(index);
          }}
          size="small"
        />
        <Button
          danger
          shape="circle"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          size="small"
        />
      </div>
    </div>
  );
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = [],
  onChange,
  maxImages = 10,
  maxSizePerImage = 5,
  compressImages = true,
  maxWidth = 1920,
  maxHeight = 1920,
  onError,
  disabled = false,
  showPreview = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Convert file to base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Compress image if needed
   */
  const compressImage = async (file: File): Promise<File> => {
    if (!compressImages) return file;

    try {
      const options = {
        maxSizeMB: maxSizePerImage,
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      return file; // Return original if compression fails
    }
  };

  /**
   * Handle file upload
   */
  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError: onUploadError }) => {
    try {
      const uploadFile = file as File;

      // Validate file type
      if (!uploadFile.type.startsWith('image/')) {
        const error = 'Please upload an image file';
        message.error(error);
        onError?.(error);
        onUploadError?.(new Error(error));
        return;
      }

      // Validate file size
      if (uploadFile.size > maxSizePerImage * 1024 * 1024) {
        const error = `File size exceeds ${maxSizePerImage}MB`;
        message.error(error);
        onError?.(error);
        onUploadError?.(new Error(error));
        return;
      }

      // Check max images
      if (value.length >= maxImages) {
        const error = `Maximum ${maxImages} images allowed`;
        message.error(error);
        onError?.(error);
        onUploadError?.(new Error(error));
        return;
      }

      setUploading(true);

      // Compress image
      const processedFile = await compressImage(uploadFile);

      // Convert to base64
      const base64 = await fileToBase64(processedFile);

      // Add to images array
      const newImages = [...value, base64];
      onChange?.(newImages);

      message.success('Image uploaded successfully');
      onSuccess?.('ok');
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload image';
      message.error(errorMessage);
      onError?.(errorMessage);
      onUploadError?.(error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle before upload validation
   */
  const handleBeforeUpload = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please upload an image file');
      return false;
    }

    // Validate file size
    if (file.size > maxSizePerImage * 1024 * 1024) {
      message.error(`File size exceeds ${maxSizePerImage}MB`);
      return false;
    }

    // Check max images
    if (value.length >= maxImages) {
      message.error(`Maximum ${maxImages} images allowed`);
      return false;
    }

    return true;
  };

  /**
   * Handle image removal
   */
  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange?.(newImages);
    message.success('Image removed');
  };

  /**
   * Handle drag end (reorder)
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().replace('image-', ''));
      const newIndex = parseInt(over.id.toString().replace('image-', ''));

      const newImages = arrayMove(value, oldIndex, newIndex);
      onChange?.(newImages);
    }
  };

  /**
   * Handle view image
   */
  const handleView = (index: number) => {
    setPreviewImage(value[index]);
    setPreviewIndex(index);
  };

  /**
   * Close preview
   */
  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  /**
   * Navigate preview
   */
  const handlePreviousImage = () => {
    const newIndex = previewIndex > 0 ? previewIndex - 1 : value.length - 1;
    setPreviewIndex(newIndex);
    setPreviewImage(value[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = previewIndex < value.length - 1 ? previewIndex + 1 : 0;
    setPreviewIndex(newIndex);
    setPreviewImage(value[newIndex]);
  };

  const uploadButton = (
    <div className="flex flex-col items-center justify-center p-4">
      <PlusOutlined className="text-2xl mb-2" />
      <div className="text-sm">Upload Image</div>
      <div className="text-xs text-gray-500 mt-1">
        Max {maxImages} images, {maxSizePerImage}MB each
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Upload Button */}
      {value.length < maxImages && (
        <Upload
          customRequest={handleUpload}
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
          accept="image/*"
          disabled={disabled || uploading}
          multiple={false}
        >
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            loading={uploading}
            disabled={disabled || uploading}
            block
            size="large"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </Upload>
      )}

      {/* Image Grid with Drag & Drop */}
      {value.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">
            {value.length} / {maxImages} images
            {value.length > 0 && (
              <span className="ml-2 text-gray-500">(Drag to reorder)</span>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={value.map((_, index) => `image-${index}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {value.map((image, index) => (
                  <SortableImage
                    key={`image-${index}`}
                    image={image}
                    index={index}
                    onRemove={handleRemove}
                    onView={handleView}
                    isPrimary={index === 0}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {value.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              💡 Tip: The first image is the primary image shown in lists
            </div>
          )}
        </div>
      )}

      {/* Simple Preview Modal */}
      {showPreview && previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={handleClosePreview}
        >
          <div className="relative max-w-4xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
            {/* Image */}
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* Navigation */}
            {value.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
                >
                  <LeftOutlined className="text-xl" />
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
                >
                  <RightOutlined className="text-xl" />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black bg-opacity-50 text-white rounded-full text-sm">
              {previewIndex + 1} / {value.length}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
