import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from 'antd';
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * Image Viewer Component
 * Full-screen modal gallery with navigation, zoom, and keyboard shortcuts
 */

interface ImageViewerProps {
  /** Array of image URLs or base64 strings */
  images: string[];
  /** Initial image index */
  initialIndex?: number;
  /** Whether the viewer is open */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Show thumbnails */
  showThumbnails?: boolean;
  /** Enable zoom */
  enableZoom?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  open,
  onClose,
  showThumbnails = true,
  enableZoom = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  // Reset index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  /**
   * Navigate to previous image
   */
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  }, [images.length]);

  /**
   * Navigate to next image
   */
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  }, [images.length]);

  /**
   * Zoom in
   */
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  }, []);

  /**
   * Zoom out
   */
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  /**
   * Reset zoom
   */
  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  /**
   * Go to specific image
   */
  const handleGoTo = useCallback((index: number) => {
    setCurrentIndex(index);
    setZoom(1);
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          if (enableZoom) handleZoomIn();
          break;
        case '-':
        case '_':
          if (enableZoom) handleZoomOut();
          break;
        case '0':
          if (enableZoom) handleResetZoom();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrevious, handleNext, handleZoomIn, handleZoomOut, handleResetZoom, onClose, enableZoom]);

  if (images.length === 0) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="100%"
      style={{ top: 0, padding: 0, maxWidth: '100vw' }}
      bodyStyle={{
        height: '100vh',
        padding: 0,
        background: 'rgba(0, 0, 0, 0.95)',
      }}
      closeIcon={null}
      destroyOnClose
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white text-lg font-medium">
            Image {currentIndex + 1} of {images.length}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {enableZoom && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOutOutlined className="text-xl" />
                </button>
                <span className="text-white text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomInOutlined className="text-xl" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-colors text-sm"
                  title="Reset Zoom (0)"
                >
                  Reset
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors ml-2"
              title="Close (ESC)"
            >
              <CloseOutlined className="text-xl" />
            </button>
          </div>
        </div>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div
            className="relative transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              cursor: zoom > 1 ? 'move' : 'default',
            }}
          >
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="max-w-full max-h-[calc(100vh-200px)] object-contain"
              onDoubleClick={enableZoom ? handleResetZoom : undefined}
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors"
              title="Previous (←)"
            >
              <LeftOutlined className="text-2xl" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors"
              title="Next (→)"
            >
              <RightOutlined className="text-2xl" />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleGoTo(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/50'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-4 left-4 text-white/50 text-xs">
          <div>← → Navigate | ESC Close</div>
          {enableZoom && <div>+ - Zoom | 0 Reset | Double-click Reset</div>}
        </div>
      </div>
    </Modal>
  );
};

export default ImageViewer;
