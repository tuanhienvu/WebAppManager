import { useState, useEffect } from 'react';
import { apiFetch, getUploadUrl } from '@/lib/api-client';
import { IconClose } from './icons';

interface UploadedImage {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  currentImage?: string;
}

export default function ImageGallery({ isOpen, onClose, onSelect, currentImage }: ImageGalleryProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadImages();
      setSelectedImage(currentImage || null);
    }
  }, [isOpen, currentImage]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/upload/list');
      
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      } else {
        setError('Failed to load images');
      }
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Error loading images');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/upload/${filename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the list
        loadImages();
        // If deleted image was selected, clear selection
        if (selectedImage === `/uploads/${filename}`) {
          setSelectedImage(null);
        }
      } else {
        alert('Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Error deleting image');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Select Image</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconClose className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadImages}
                  className="mt-4 text-cyan-600 hover:text-cyan-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && images.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No images uploaded yet.</p>
                <p className="text-sm text-gray-400 mt-2">Upload an image first to see it here.</p>
              </div>
            )}

            {!loading && !error && images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.filename}
                    onClick={() => setSelectedImage(image.url)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === image.url
                        ? 'border-cyan-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <img
                        src={getUploadUrl(image.url)}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Selected indicator */}
                    {selectedImage === image.url && (
                      <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(image.filename, e)}
                      className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Delete image"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="truncate" title={image.filename}>{image.filename}</p>
                      <p className="text-gray-300">{formatFileSize(image.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              {images.length} {images.length === 1 ? 'image' : 'images'} available
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                disabled={!selectedImage}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

