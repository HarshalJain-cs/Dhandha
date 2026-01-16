/**
 * Image Utilities
 * Helper functions for image validation, compression, and manipulation
 */

import imageCompression from 'browser-image-compression';

/**
 * Validate image file
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } => {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image',
    };
  }

  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check if it's a supported format
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported image format. Use JPEG, PNG, WEBP, or GIF',
    };
  }

  return { valid: true };
};

/**
 * Compress image file
 */
export const compressImage = async (
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  }
): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Convert file to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert base64 string to File object
 */
export const base64ToFile = async (
  base64: string,
  filename: string = 'image.jpg'
): Promise<File> => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (
  file: File | string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    if (typeof file === 'string') {
      // Base64 string or URL
      img.src = file;
    } else {
      // File object
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }
  });
};

/**
 * Resize image to specific dimensions
 */
export const resizeImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, file.type);
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Create thumbnail from image
 */
export const createThumbnail = async (
  file: File,
  size: number = 200
): Promise<File> => {
  return resizeImage(file, size, size);
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = async (
  file: File,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ valid: boolean; error?: string; dimensions?: { width: number; height: number } }> => {
  try {
    const dimensions = await getImageDimensions(file);

    if (minWidth && dimensions.width < minWidth) {
      return {
        valid: false,
        error: `Image width must be at least ${minWidth}px`,
        dimensions,
      };
    }

    if (minHeight && dimensions.height < minHeight) {
      return {
        valid: false,
        error: `Image height must be at least ${minHeight}px`,
        dimensions,
      };
    }

    if (maxWidth && dimensions.width > maxWidth) {
      return {
        valid: false,
        error: `Image width must be at most ${maxWidth}px`,
        dimensions,
      };
    }

    if (maxHeight && dimensions.height > maxHeight) {
      return {
        valid: false,
        error: `Image height must be at most ${maxHeight}px`,
        dimensions,
      };
    }

    return {
      valid: true,
      dimensions,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image dimensions',
    };
  }
};

/**
 * Convert images array to FormData for multipart upload
 */
export const imagesToFormData = (images: string[], fieldName: string = 'images'): FormData => {
  const formData = new FormData();

  images.forEach((base64, index) => {
    // Convert base64 to blob
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `image-${index}.jpg`, { type: mimeString });

    formData.append(fieldName, file);
  });

  return formData;
};

/**
 * Get base64 image size in MB
 */
export const getBase64SizeMB = (base64: string): number => {
  // Remove data URL prefix
  const base64String = base64.split(',')[1] || base64;

  // Calculate size (base64 encoding adds ~33% overhead)
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  return parseFloat(sizeInMB.toFixed(2));
};

/**
 * Check if string is valid base64 image
 */
export const isBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;

  // Check if it starts with data:image
  if (!str.startsWith('data:image/')) return false;

  // Check if it contains base64 data
  return str.includes('base64,');
};

/**
 * Optimize images array (compress and limit size)
 */
export const optimizeImagesArray = async (
  images: string[],
  options?: {
    maxImages?: number;
    maxSizeMBPerImage?: number;
    maxTotalSizeMB?: number;
  }
): Promise<{ images: string[]; removed: number; compressed: number }> => {
  const { maxImages = 10, maxSizeMBPerImage = 2, maxTotalSizeMB = 15 } = options || {};

  let optimized: string[] = [];
  let removed = 0;
  let compressed = 0;
  let totalSize = 0;

  for (let i = 0; i < images.length && i < maxImages; i++) {
    const image = images[i];
    const sizeMB = getBase64SizeMB(image);

    // Skip if adding this image would exceed total size
    if (totalSize + sizeMB > maxTotalSizeMB) {
      removed++;
      continue;
    }

    // If image is too large, try to compress it
    if (sizeMB > maxSizeMBPerImage) {
      try {
        const file = await base64ToFile(image);
        const compressedFile = await compressImage(file, {
          maxSizeMB: maxSizeMBPerImage,
        });
        const compressedBase64 = await fileToBase64(compressedFile);

        optimized.push(compressedBase64);
        totalSize += getBase64SizeMB(compressedBase64);
        compressed++;
      } catch (error) {
        console.error('Failed to compress image:', error);
        removed++;
      }
    } else {
      optimized.push(image);
      totalSize += sizeMB;
    }
  }

  // Remove excess images
  removed += images.length - maxImages;

  return {
    images: optimized,
    removed: Math.max(removed, 0),
    compressed,
  };
};
